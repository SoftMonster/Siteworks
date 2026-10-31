// ==UserScript==
// @name         Steam Quick Sell >14p
// @namespace    local.steam.quicksell
// @version      4.5
// @description  One button: clicks each unique card on the current inventory page, waits for the Steam Suite "Lowest" price to appear for it, then lists it 1p under that price if the result is over 14p.
// @match        https://steamcommunity.com/id/*/inventory*
// @match        https://steamcommunity.com/profiles/*/inventory*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';
  if (!/steamcommunity\.com$/.test(location.hostname) || !/\/inventory/.test(location.pathname)) return;
  if (window.__qsOne) { console.log('Quick sell >14p is already running. Refresh the page to reload it.'); return; }
  window.__qsOne = true;

  // ================= settings =================
  const MIN_PRICE      = 14;    // pence: sell only when the quick sell price is OVER this
  const UNDERCUT       = 1;     // pence under the price Steam shows in the item details
  const FOIL_ONLY      = true;  // true = only visit foil cards (non-foil are skipped instantly, without clicking)
  const ALL_PAGES      = true;  // true = keep going through every page of the inventory, false = current page only
  const MAX_FAILS      = 10;    // the ONLY automatic stop: this many listings in a row rejected by Steam
  const ITEM_DELAY     = 2500;  // ms between cards (each click makes Steam fetch a price, so don't go too fast)
  const SELL_DELAY     = 3000;  // ms after listing a card
  const SELECT_TIMEOUT = 6000;  // ms to wait for a click to select the card
  const PRICE_TIMEOUT  = 20000; // ms to wait for a price to appear after clicking a card (then that card is skipped and it moves on)
  const PRICE_SOURCE   = 'either'; // 'either' = Steam Suite "Lowest", else Steam's "Starting at"; or 'suite' / 'steam' to use just one
  const CONFIRM        = false; // true = ask "are you sure?" before starting
  // ============================================

  // ---------- helpers ----------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms + Math.random() * 400));
  const tick = () => new Promise((r) => setTimeout(r, 250));
  const log = (...a) => console.log('[QS]', ...a);
  const visible = (el) => !!el && el.getClientRects().length > 0;
  const wallet = () => window.g_rgWalletInfo || {};
  const sessionId = () => window.g_sessionID || ((document.cookie.match(/(?:^|;\s*)sessionid=([^;]+)/) || [])[1]) || '';

  function parsePrice(str) {
    const s = String(str).replace(/[^\d.,]/g, '');
    if (!s) return NaN;
    const idx = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
    if (idx !== -1 && s.length - idx - 1 <= 2) {
      const whole = s.slice(0, idx).replace(/[.,]/g, '');
      const frac = s.slice(idx + 1).padEnd(2, '0');
      return parseInt(whole || '0', 10) * 100 + parseInt(frac, 10);
    }
    return parseInt(s.replace(/[.,]/g, ''), 10) * 100;
  }

  function fmt(cents) {
    try {
      if (typeof v_currencyformat === 'function' && typeof GetCurrencyCode === 'function') {
        return v_currencyformat(cents, GetCurrencyCode(wallet().wallet_currency));
      }
    } catch (e) {}
    return '£' + (cents / 100).toFixed(2);
  }

  // what the buyer pays if the seller receives `received`
  function buyerTotal(received, pubPct) {
    const w = wallet();
    const steamPct = parseFloat(w.wallet_fee_percent ?? 0.05);
    const base = parseInt(w.wallet_fee_base ?? 0, 10) || 0;
    const min = parseInt(w.wallet_fee_minimum ?? 1, 10) || 1;
    const steamFee = Math.floor(Math.max(received * steamPct, min) + base);
    const pubFee = Math.floor(Math.max(received * pubPct, min));
    return received + steamFee + pubFee;
  }

  // largest seller-receives amount whose buyer total is <= target
  function sellerReceives(target, pubPct) {
    for (let r = target; r >= 1; r--) if (buyerTotal(r, pubPct) <= target) return r;
    return 0;
  }

  // ---------- reading the page ----------
  const panel = () => [...document.querySelectorAll('#iteminfo0, #iteminfo1')].find(visible);
  const panelNameOf = (p) => { const n = p && p.querySelector('.hover_item_name, [id$="_item_name"]'); return n ? n.textContent.trim() : ''; };
  const currentPage = () => [...document.querySelectorAll('.inventory_page')].find(visible);
  const pageTiles = () => { const pg = currentPage(); return pg ? [...pg.querySelectorAll('.itemHolder .item')].filter(visible) : []; };
  const selectedId = () => { try { const s = window.g_ActiveInventory.selectedItem; return s ? String(s.assetid || s.id || '') : ''; } catch (e) { return ''; } };

  // foil cards have "(Foil)" in their market name; the card border tag is the backup check
  function isFoil(info) {
    const d = info.d || {};
    const text = (d.market_hash_name || '') + ' ' + (d.name || '');
    if (!text.trim()) return true; // can't tell, so don't skip it
    if (/\(foil\)/i.test(text)) return true;
    return Array.isArray(d.tags) && d.tags.some((t) => /cardborder_1/i.test(t.internal_name || t.name || ''));
  }

  function tileInfo(el) {
    const inv = window.g_ActiveInventory || {};
    const m = /^(\d+)_(\d+)_(\d+)$/.exec(el.id || '');
    let it = el.rgItem;
    if (!it && m && inv.m_rgAssets) it = inv.m_rgAssets[m[3]];
    const d = (it && (it.description || it)) || {};
    const img = el.querySelector('img');
    return {
      el, d,
      appid: m ? m[1] : String((it && it.appid) || inv.appid || 753),
      contextid: m ? m[2] : String((it && it.contextid) || inv.contextid || 6),
      assetid: m ? m[3] : String((it && (it.assetid || it.id)) || ''),
      name: d.market_hash_name || '',
      label: d.name || '',
      key: d.market_hash_name || (img ? img.src.split('?')[0] : el.id)
    };
  }

  // ----- reading prices shown on the page -----
  const decode = (t) => { const x = document.createElement('textarea'); x.innerHTML = t; return x.value; };
  const norm = (t) => decode(String(t || '')).toLowerCase().replace(/[^a-z0-9\u00c0-\uffff]+/g, '');
  const sameCard = (shown, expected) => { const a = norm(shown), b = norm(expected); return !a || !b || a.includes(b) || b.includes(a); };
  // first number after a label, ignoring any currency symbol: "Lowest: £0.13 · median..." -> 13 (pence)
  const priceAfter = (text, label) => {
    const m = text.match(new RegExp(label + '\\s*[^\\d\\n]{0,4}(\\d[\\d.,]*)', 'i'));
    if (!m) return null;
    const v = parsePrice(m[1].replace(/[.,]+$/, ''));
    return isNaN(v) || v <= 0 ? null : v;
  };

  // ----- reading prices from the text that is actually shown on screen -----
  // This does not depend on Steam's or the extensions' HTML structure at all: it reads the rendered text
  // of the page. A price only counts when it is tied to the name of the card that was just clicked.
  const pageText = () => (document.body.innerText || document.body.textContent || '');

  // "Steam Suite: 1900-Morforatorus (Foil)"  then  "Lowest: £0.25 · median 24 h: ..."
  function suitePriceFromText(text, info) {
    const re = /Steam\s*Suite\s*:?\s*([^\n]*?)\s*Lowest\s*:\s*[^\d\n]{0,4}(\d[\d.,]*)/gi;
    let m;
    while ((m = re.exec(text))) {
      const nm = m[1].trim();
      if (!nm || !sameCard(nm, info.name)) continue; // that box is still showing a different card
      const v = parsePrice(m[2].replace(/[.,]+$/, ''));
      if (!isNaN(v) && v > 0) return v;
    }
    return null;
  }

  // Steam's own details: "Starting at: £0.25" - the card's name must appear shortly before it
  function startingAtFromText(text, info) {
    const re = /Starting at:?\s*[^\d\n]{0,4}(\d[\d.,]*)/gi;
    let m;
    while ((m = re.exec(text))) {
      if (info.label && !norm(text.slice(Math.max(0, m.index - 3000), m.index)).includes(norm(info.label))) continue;
      const v = parsePrice(m[1].replace(/[.,]+$/, ''));
      if (!isNaN(v) && v > 0) return v;
    }
    return null;
  }

  function readPrice(info) {
    const text = pageText();
    if (PRICE_SOURCE === 'steam') return startingAtFromText(text, info);
    if (PRICE_SOURCE === 'suite') return suitePriceFromText(text, info);
    const v = suitePriceFromText(text, info);
    return v != null ? v : startingAtFromText(text, info);
  }

  // what the script could see when a price never appeared (written to the console and the end message)
  function diagnose(info) {
    const text = pageText();
    const snip = (re) => { const i = text.search(re); return i < 0 ? 'not on page' : '"' + text.slice(i, i + 110).replace(/\s+/g, ' ') + '"'; };
    return 'expected "' + info.name + '" (label "' + info.label + '") | card name on page: ' +
      (info.label ? norm(text).includes(norm(info.label)) : '?') +
      ' | Steam Suite text: ' + snip(/Steam\s*Suite/i) + ' | Starting at text: ' + snip(/Starting at/i);
  }

  async function waitFor(fn, timeout) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) { const v = fn(); if (v) return v; await tick(); }
    return null;
  }

  // wait until Steam shows a price for the selected card, and it has stopped changing
  async function waitForShownPrice(info) {
    const t0 = Date.now();
    let last = null, since = 0;
    while (Date.now() - t0 < PRICE_TIMEOUT) {
      if (selectedId() !== info.assetid) return { changed: true };
      const p = readPrice(info);
      if (p == null) { last = null; }
      else if (p !== last) { last = p; since = Date.now(); }
      else if (Date.now() - since >= 900) return { price: p };
      await new Promise((r) => setTimeout(r, 400));
    }
    return { timeout: true };
  }

  // ---------- listing ----------
  async function sellOne(info, receiveCents) {
    const body = new URLSearchParams({
      sessionid: sessionId(), appid: info.appid, contextid: info.contextid,
      assetid: info.assetid, amount: 1, price: receiveCents
    });
    const res = await fetch('/market/sellitem/', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
      body
    });
    if (res.status === 429) return { rateLimited: true };
    const j = await res.json().catch(() => null);
    return j || { success: false, message: 'HTTP ' + res.status };
  }

  // ---------- UI: one button ----------
  const style = document.createElement('style');
  style.textContent =
    '#cs-qs-btn{display:none!important}' + // hide the old green button from the Card Shelf prices script
    '#qs-one{position:fixed;bottom:16px;z-index:2147483600;background:#5c7e10;color:#fff;border:0;border-radius:6px;' +
    'padding:8px 14px;font:bold 13px Arial,sans-serif;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.5)}' +
    '#qs-one:hover{filter:brightness(1.15)}#qs-one.run{background:#a33}' +
    '#qs-one-toast{position:fixed;top:20px;right:20px;z-index:2147483647;background:#1b2838;color:#fff;padding:12px 16px;max-width:440px;' +
    'border-radius:8px;font:14px "Segoe UI",Arial,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.5);white-space:pre-line}';
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'qs-one';
  const idleText = 'Quick sell >' + MIN_PRICE + 'p';
  btn.textContent = idleText;
  btn.title = 'Clicks each unique card on this inventory page, waits for the Steam Suite price, and lists it 1p under that price if over ' +
    MIN_PRICE + 'p. Click again while running to stop. Each listing then needs approving in your Steam authenticator.';
  btn.style.left = document.getElementById('cs-pl-btn') ? '170px' : '16px'; // sit beside the Card Shelf prices button if present
  document.body.appendChild(btn);

  function toast(msg, ms) {
    let d = document.getElementById('qs-one-toast');
    if (!d) { d = document.createElement('div'); d.id = 'qs-one-toast'; document.body.appendChild(d); }
    d.textContent = msg; clearTimeout(d._t); d._t = setTimeout(() => d.remove(), ms || 12000);
  }

  // ---------- main run ----------
  let running = false, stop = false;

  btn.onclick = async () => {
    if (running) { stop = true; btn.textContent = 'Stopping…'; return; }
    if (!window.g_ActiveInventory) { toast('Steam inventory not found on this page. Open your inventory and wait for it to load.'); return; }
    if (window.g_bViewingOwnProfile === 0 || window.g_bViewingOwnProfile === false) { toast('Open your own inventory to use Quick sell.'); return; }
    if (window.matchMedia('(max-width: 910px)').matches) {
      toast('The page is too narrow, so Steam is using its mobile layout and the item details won\'t show a price.\nWiden the window (or undock DevTools) and click again.', 15000); return;
    }
    if (!sessionId()) { toast('Could not find your Steam session. Reload the page and try again.'); return; }
    if (CONFIRM && !confirm('Quick sell every unique card on this page whose quick sell price is over ' + MIN_PRICE + 'p?')) return;

    running = true; stop = false;
    const oldToast = document.getElementById('qs-one-toast'); if (oldToast) oldToast.remove();
    btn.classList.add('run');
    const stats = { sold: 0, skipped: 0, noPrice: 0, failed: 0, unsellable: 0, nonFoil: 0 };
    const seen = new Set();
    let why = '', pageNo = 1, noPriceRun = 0, failRun = 0, lastFail = '', lastDiag = '';

    try {
      for (; pageNo <= 1000 && !stop; pageNo++) {
        const tiles = pageTiles();
        if (!tiles.length) { why = 'no cards visible on this page.'; break; }
        log('page ' + pageNo + ': ' + tiles.length + ' items');

        for (let t = 0; t < tiles.length && !stop; t++) {
          const info = tileInfo(tiles[t]);
          if (seen.has(info.key)) continue;           // one visit per unique card
          seen.add(info.key);
          const mk = info.d.marketable;
          if (info.d.market_hash_name && !(mk === true || Number(mk) === 1)) {
            stats.unsellable++; log('– ' + (info.label || info.name) + ': not marketable, skipped'); continue;
          }
          if (FOIL_ONLY && !isFoil(info)) { stats.nonFoil++; continue; } // instant: no click, no waiting
          btn.textContent = 'Stop · page ' + pageNo + ' · sold ' + stats.sold;

          // 1. click the card
          (tiles[t].querySelector('a') || tiles[t]).click();
          const picked = await waitFor(() => selectedId() === info.assetid, SELECT_TIMEOUT);
          if (!picked) { stats.noPrice++; log('– ' + (info.label || info.name) + ': click did not select it, skipped'); continue; }

          // 2. wait for Steam to show the price for this card
          const r = await waitForShownPrice(info);
          if (r.changed) { stats.noPrice++; log('– ' + (info.label || info.name) + ': selection changed, skipped'); continue; }
          if (r.timeout) {
            stats.noPrice++; noPriceRun++;
            lastDiag = diagnose(info);
            log('– ' + (info.label || info.name) + ': no price appeared within ' + (PRICE_TIMEOUT / 1000) + 's, skipped. ' + lastDiag);
            // never abort for this - just slow down a little if it keeps happening, then carry on with the next card
            await sleep(ITEM_DELAY + Math.min(noPriceRun - 1, 6) * 2000);
            continue;
          }
          noPriceRun = 0;

          // 3. quick sell if over the threshold
          const shown = r.price, quick = shown - UNDERCUT;
          if (!(quick > MIN_PRICE)) {
            stats.skipped++; log('– ' + (info.label || info.name) + ': shown ' + fmt(shown) + ' -> ' + fmt(quick) + ', not over ' + fmt(MIN_PRICE) + ', skipped');
            await sleep(ITEM_DELAY); continue;
          }
          const pubPct = parseFloat(info.d.market_fee ?? wallet().wallet_publisher_fee_percent_default ?? 0.10);
          const receive = sellerReceives(quick, pubPct);
          if (receive < 1) { stats.skipped++; await sleep(ITEM_DELAY); continue; }
          if (selectedId() !== info.assetid) { stats.noPrice++; log('– ' + (info.label || info.name) + ': selection changed before listing, skipped'); continue; }

          let s;
          for (let attempt = 0; attempt < 4 && !stop; attempt++) {
            try { s = await sellOne(info, receive); } catch (e) { s = { success: false, message: e.message }; }
            if (!s.rateLimited) break;
            log('Steam rate-limited the listing request (429). Waiting 60s, then trying again.');
            btn.textContent = 'Steam says slow down - waiting 60s…';
            await sleep(60000);
          }
          if (!s) break;
          if (s.rateLimited) { s = { success: false, message: 'rate limited (429)' }; }
          if (s.success) {
            stats.sold++; failRun = 0;
            btn.textContent = 'Stop · page ' + pageNo + ' · sold ' + stats.sold;
            log('✓ ' + (info.label || info.name) + ': lowest ' + fmt(shown) + ', listed at ' + fmt(quick) + ' (you receive ' + fmt(receive) + ')');
            await sleep(SELL_DELAY);
          } else {
            stats.failed++; failRun++; lastFail = s.message || 'unknown error';
            log('✗ ' + (info.label || info.name) + ': ' + lastFail, s);
            if (failRun >= MAX_FAILS) { why = MAX_FAILS + ' listings in a row were rejected by Steam (' + lastFail + ').'; break; }
            await sleep(ITEM_DELAY);
          }
        }
        if (why || stop || !ALL_PAGES) break;

        const next = document.querySelector('#pagebtn_next');
        if (!next || next.classList.contains('disabled')) break;
        const firstBefore = pageTiles()[0];
        next.click();
        await sleep(2500);
        await waitFor(() => { const f = pageTiles()[0]; return f && f !== firstBefore; }, 8000);
      }
    } catch (e) {
      why = 'error: ' + e.message; console.error(e);
    } finally {
      const wasStopped = stop && !why;
      running = false; stop = false;
      btn.classList.remove('run'); btn.textContent = idleText;
      const msg = (wasStopped ? 'Stopped. ' : why ? 'Stopped: ' + why + ' ' : 'Done. ') +
        'Listed ' + stats.sold + ', skipped ' + stats.skipped + ' at or under ' + MIN_PRICE + 'p' +
        (stats.noPrice ? ', ' + stats.noPrice + ' with no price' : '') +
        (stats.nonFoil ? ', ' + stats.nonFoil + ' non-foil ignored' : '') +
        (stats.unsellable ? ', ' + stats.unsellable + ' not marketable' : '') +
        (stats.failed ? ', ' + stats.failed + ' failed' + (lastFail ? ' (' + lastFail + ')' : '') : '') + '.' +
        (stats.sold ? '\nApprove the listings in your Steam Mobile Authenticator.' : '') +
        (stats.noPrice && lastDiag ? '\nLast card with no price - ' + lastDiag : '');
      log(msg);
      toast(msg, 20000);
    }
  };

  console.log('Quick sell >' + MIN_PRICE + 'p loaded.');
})();
