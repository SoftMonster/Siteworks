// ==UserScript==
// @name         Steam owned games exporter
// @namespace    local.steam.owned.export
// @version      1.2.0
// @description  Adds a button to your Steam profile that downloads an updated steam_page_owned_userdata_<timestamp>.json
// @match        https://steamcommunity.com/id/*
// @match        https://steamcommunity.com/profiles/*
// @match        https://store.steampowered.com/*
// @grant        GM_xmlhttpRequest
// @connect      store.steampowered.com
// @noframes
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const USERDATA_URL = 'https://store.steampowered.com/dynamicstore/userdata/';
  const BUTTON_ID = 'owned-userdata-export-btn';

  console.log('[owned export] v1.2.0 running on', location.host);
  if (document.getElementById(BUTTON_ID)) return; // already injected

  // ---------- fetching ----------

  const ON_STORE = location.hostname === 'store.steampowered.com';

  // Same-origin on the store page (cookies always sent). On the community site,
  // use GM_xmlhttpRequest so the cross-site request is allowed at all.
  function getText(url) {
    if (!ON_STORE && url.indexOf(location.origin) !== 0 && typeof GM_xmlhttpRequest === 'function') {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: url,
          anonymous: false,
          onload: (r) => resolve(r.responseText),
          onerror: () => reject(new Error('Network error')),
          ontimeout: () => reject(new Error('Timed out')),
        });
      });
    }
    return fetch(url, { credentials: 'include', cache: 'no-store' }).then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    });
  }

  // Strategy A: store userdata (the source of the original file).
  async function fromStoreUserdata() {
    const text = await getText(USERDATA_URL);
    const ud = JSON.parse(text);
    const apps = Array.isArray(ud.rgOwnedApps) ? ud.rgOwnedApps : [];
    const pkgs = Array.isArray(ud.rgOwnedPackages) ? ud.rgOwnedPackages : [];
    console.log('[owned export] store userdata:', apps.length, 'apps,', pkgs.length, 'packages');
    return { appids: apps, packages: pkgs.length, source: 'dynamicstore/userdata', url: USERDATA_URL };
  }

  // Strategy B: your profile's games list (same-origin on steamcommunity.com).
  async function fromProfileGamesList() {
    const m = location.pathname.match(/^\/(id|profiles)\/[^/]+/);
    if (!m) throw new Error('Not on a profile page');
    const url = location.origin + m[0] + '/games/?tab=all';
    const html = await getText(url);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const el = doc.querySelector('[data-profile-gameslist]');
    if (!el) throw new Error('Games list not found on profile (is it visible to you?)');
    const data = JSON.parse(el.getAttribute('data-profile-gameslist'));
    const games = Array.isArray(data.rgGames) ? data.rgGames : [];
    console.log('[owned export] profile games list:', games.length, 'games');
    return { appids: games.map((g) => g.appid), packages: null, source: 'profile games list', url: url };
  }

  async function collect() {
    const errors = [];
    try {
      const r = await fromStoreUserdata();
      if (r.appids.length) return r;
      errors.push('store returned an empty library');
    } catch (e) { errors.push('store: ' + e.message); }

    if (!ON_STORE) {
      try {
        const r = await fromProfileGamesList();
        if (r.appids.length) return r;
        errors.push('profile games list was empty');
      } catch (e) { errors.push('profile: ' + e.message); }
    }
    console.warn('[owned export] attempts failed:', errors);
    throw new Error(ON_STORE
      ? 'Not logged in to the store?'
      : 'No games found. Try the button on store.steampowered.com instead.');
  }

  // ---------- building the file (same shape as the original export) ----------

  function buildExport(res, elapsedMs) {
    const items = Array.from(new Set(res.appids.map(Number)))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b)
      .map((appid) => ({ key: String(appid), appid: appid, name: '', hours: 0 }));

    return {
      cardShelfPage: 1,
      version: 1,
      id: 'owned_userdata',
      key: '',
      how: 'button',
      capturedAt: new Date().toISOString(),
      url: res.url,
      title: 'Your Steam library (store list)',
      parts: {
        ownedGames: {
          ok: true,
          ms: elapsedMs,
          data: {
            items: items,
            wishlist: [],
            packages: res.packages,
            source: res.source,
          },
        },
      },
    };
  }

  function download(obj) {
    // e.g. steam_page_owned_userdata_2026-11-08T11-55-53-844Z.json
    const stamp = obj.capturedAt.replace(/[:.]/g, '-');
    const filename = 'steam_page_owned_userdata_' + stamp + '.json';
    const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    return filename;
  }

  // ---------- button ----------

  const btn = document.createElement('a');
  btn.id = BUTTON_ID;
  btn.href = 'javascript:void(0)';
  const label = document.createElement('span');
  label.textContent = 'Export owned games';
  btn.appendChild(label);

  function setLabel(text) { label.textContent = text; }

  let busy = false;
  btn.addEventListener('click', async (ev) => {
    ev.preventDefault();
    if (busy) return;
    busy = true;
    setLabel('Fetching library…');
    const t0 = performance.now();
    try {
      const res = await collect();
      const out = buildExport(res, Math.round(performance.now() - t0));
      const n = out.parts.ownedGames.data.items.length;
      const file = download(out);
      setLabel('Saved ' + n + ' games');
      console.log('[owned export] saved', file, '(' + n + ' apps)');
    } catch (e) {
      console.error('[owned export]', e);
      setLabel('Failed: ' + e.message);
    } finally {
      busy = false;
      setTimeout(() => setLabel('Export owned games'), 5000);
    }
  });

  // ---------- placement ----------
  // The button is attached to <body> and absolutely positioned, so it sits outside the
  // page's own layout flow and cannot push, overlap or re-order Steam's controls.
  //   - Store pages:   next to the "Wishlist" link in the store nav bar.
  //   - Profile pages: in the empty space directly under the avatar.
  //   - Anything else: a small floating button, bottom-right.

  const BASE_BG = ON_STORE ? 'rgba(103,193,245,0.2)' : 'rgba(0,0,0,0.55)';
  const HOVER_BG = 'rgba(103,193,245,0.45)';
  btn.style.cssText = [
    'position:absolute', 'z-index:2147483000', 'box-sizing:border-box',
    'display:block', 'text-align:center', 'cursor:pointer', 'white-space:nowrap',
    'padding:' + (ON_STORE ? '5px 12px' : '7px 10px'), 'background:' + BASE_BG,
    'color:' + (ON_STORE ? '#67c1f5' : '#fff'),
    'border-radius:2px', 'text-decoration:none', 'line-height:1.3',
    'font:' + (ON_STORE ? '12px' : '13px') + ' "Motiva Sans",Arial,Helvetica,sans-serif',
  ].join(';');
  btn.addEventListener('mouseenter', () => { btn.style.background = HOVER_BG; });
  btn.addEventListener('mouseleave', () => { btn.style.background = BASE_BG; });
  document.body.appendChild(btn);

  function visible(el) {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function findWishlistLink() {
    const inNav = Array.from(document.querySelectorAll(
      '#store_nav_area a, .store_nav_area a, #store_header a, .store_header a'));
    const anywhere = Array.from(document.querySelectorAll('a[href*="/wishlist"]'));
    const all = inNav.concat(anywhere).filter(visible);
    // The nav-bar one: text says Wishlist and it sits in the top part of the page.
    return all.find((a) => /^\s*wishlist\b/i.test(a.textContent) && a.getBoundingClientRect().top < 320) || null;
  }

  function floatBottomRight() {
    btn.style.position = 'fixed';
    btn.style.right = '20px';
    btn.style.bottom = '20px';
    btn.style.left = 'auto';
    btn.style.top = 'auto';
    btn.style.width = 'auto';
    btn.style.background = '#1b2838';
    btn.style.border = '1px solid #66c0f4';
  }

  function placeNextToWishlist(link) {
    const r = link.getBoundingClientRect();
    const w = btn.offsetWidth || 150;
    const h = btn.offsetHeight || 26;
    const gap = 14;
    const vw = document.documentElement.clientWidth;

    btn.style.position = 'absolute';
    btn.style.right = 'auto';
    btn.style.bottom = 'auto';
    btn.style.width = 'auto';
    btn.style.border = '0';

    let left = r.right + gap;
    let top = r.top + (r.height - h) / 2;
    if (left + w > vw - 8) {
      // No room to the right (narrow window): tuck it directly under the Wishlist link
      // instead of over it, right-aligned with it.
      left = Math.max(8, r.right - w);
      top = r.bottom + 4;
    }
    btn.style.left = Math.round(left + window.scrollX) + 'px';
    btn.style.top = Math.round(top + window.scrollY) + 'px';
  }

  function placeUnderAvatar(avatar) {
    // Lowest edge of the avatar or its decorative frame, whichever extends further.
    const rects = [avatar].concat(Array.from(avatar.querySelectorAll('.profile_avatar_frame, img')))
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0);
    const bottom = Math.max.apply(null, rects.map((r) => r.bottom));
    const left = Math.min.apply(null, rects.map((r) => r.left));
    const right = Math.max.apply(null, rects.map((r) => r.right));

    btn.style.position = 'absolute';
    btn.style.right = 'auto';
    btn.style.bottom = 'auto';
    btn.style.border = '0';
    btn.style.left = Math.round(left + window.scrollX) + 'px';
    btn.style.top = Math.round(bottom + window.scrollY + 8) + 'px';
    btn.style.width = Math.max(120, Math.round(right - left)) + 'px';
  }

  function position() {
    if (ON_STORE) {
      const link = findWishlistLink();
      if (link) return placeNextToWishlist(link);
      return floatBottomRight(); // nav not found (yet)
    }
    const avatar = document.querySelector('.profile_header .playerAvatar, .playerAvatar.profile_header_size');
    if (avatar) return placeUnderAvatar(avatar);
    floatBottomRight();
  }

  position();
  window.addEventListener('resize', position);
  window.addEventListener('load', position);
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(position);
    ro.observe(document.body);
    const nav = document.querySelector('#store_nav_area, .store_nav_area, .profile_header .playerAvatar');
    if (nav) ro.observe(nav);
  }
  // Re-check after extensions / late-loading content settle.
  [500, 1500, 3000, 6000].forEach((ms) => setTimeout(position, ms));
})();