// ==UserScript==
// @name         Steam Badges: All Action Buttons (Booster Pack, Store, Gamecards buttons)
// @namespace    https://steamcommunity.com/
// @version      1.0
// @description  Adds 7 buttons under every badge on the badges page: Booster Pack (market), Store Page, plus the 5 gamecards-page buttons (Inventory, Sell, Buy dialog, Buy missing, Buy missing FOIL)
// @match        https://steamcommunity.com/id/*/badges*
// @match        https://steamcommunity.com/profiles/*/badges*
// @match        https://steamcommunity.com/id/*/gamecards/*
// @match        https://steamcommunity.com/profiles/*/gamecards/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ------------------------------------------------------------------
    // Config
    // ------------------------------------------------------------------
    // true  = put the buttons in the narrow info column (same place as the Booster Pack / Store Page buttons)
    // false = put them in a full-width strip underneath the whole badge row
    const PLACE_IN_INFO_COLUMN = false;
    const DIALOG_HASH = '#sbb-buy-dialog';
    // A normal badge is only complete at level 5; a foil badge is complete at level 1.
    const NORMAL_MAX_LEVEL = 5;
    const FOIL_MAX_LEVEL = 1;

    // ------------------------------------------------------------------
    // Part A: when a gamecards page is opened via the "Show buy cards dialog"
    //         button, automatically click SIH's dialog button there.
    // ------------------------------------------------------------------
    if (/\/gamecards\//.test(location.pathname)) {
        if (location.hash === DIALOG_HASH) {
            history.replaceState(null, '', location.pathname + location.search);
            let tries = 0;
            const t = setInterval(() => {
                const b = document.querySelector('a.btn_buymissings');
                if (b) { clearInterval(t); b.click(); }
                else if (++tries > 80) clearInterval(t); // give up after ~20s
            }, 250);
        }
        return;
    }

    // ------------------------------------------------------------------
    // Part B: badges page
    // ------------------------------------------------------------------
    const pm = location.pathname.match(/^\/(?:id|profiles)\/[^\/]+/);
    if (!pm) return;
    const PROFILE = location.origin + pm[0];

    // ---- throttled fetch queue (max 2 at a time) ----
    let active = 0;
    const waiting = [];
    function enqueue(fn, urgent) {
        return new Promise((resolve, reject) => {
            const job = { fn, resolve, reject };
            urgent ? waiting.unshift(job) : waiting.push(job);
            pump();
        });
    }
    function pump() {
        while (active < 2 && waiting.length) {
            const { fn, resolve, reject } = waiting.shift();
            active++;
            fn().then(resolve, reject).finally(() => { active--; pump(); });
        }
    }

    // ---- card data ----
    async function fetchDoc(url) {
        const r = await fetch(url, { credentials: 'same-origin' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return new DOMParser().parseFromString(await r.text(), 'text/html');
    }

    function parseCards(doc) {
        const cards = [];
        doc.querySelectorAll('.badge_card_set_card').forEach(card => {
            const titleEl = card.querySelector('.badge_card_set_title') ||
                            card.querySelector('.badge_card_set_text');
            if (!titleEl) return;
            const clone = titleEl.cloneNode(true);
            clone.querySelectorAll('.badge_card_set_text_qty').forEach(e => e.remove());
            const name = clone.textContent.replace(/\s+/g, ' ').trim().replace(/\s*\(Foil\)\s*$/i, '');
            if (!name) return;
            const qtyEl = card.querySelector('.badge_card_set_text_qty');
            const qtyMatch = qtyEl && qtyEl.textContent.match(/\((\d+)\)/);
            const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 0;
            const owned = qty > 0 || (/\bowned\b/.test(card.className) && !/\bunowned\b/.test(card.className));
            cards.push({ name, owned });
        });
        return cards;
    }

    function parseLevel(doc) {
        const cur = doc.querySelector('.badge_current');
        const m = cur && cur.textContent.match(/Level\s+(\d+)/i);
        return m ? parseInt(m[1], 10) : 0;
    }

    async function loadData(appid) {
        const normalDoc = await fetchDoc(`${PROFILE}/gamecards/${appid}/`);
        const cards = parseCards(normalDoc);
        if (!cards.length) throw new Error('no cards found for app ' + appid);
        const normalLevel = parseLevel(normalDoc);
        const foilOwned = new Set();
        let foilLevel = 0;
        try {
            const foilDoc = await fetchDoc(`${PROFILE}/gamecards/${appid}/?border=1`);
            parseCards(foilDoc).forEach(c => { if (c.owned) foilOwned.add(c.name); });
            foilLevel = parseLevel(foilDoc);
        } catch (e) { /* treat all foils as missing, foil level 0 */ }
        return { cards, foilOwned, normalLevel, foilLevel };
    }

    const cache = new Map();
    function getData(appid, urgent) {
        if (!cache.has(appid)) {
            const p = enqueue(() => loadData(appid), urgent);
            p.catch(() => cache.delete(appid)); // allow retry after failure
            cache.set(appid, p);
        }
        return cache.get(appid);
    }

    // ---- market URL builder + market existence check ----
    // multibuy/multisell abort with 'The item "..." does not exist on the market' if ANY item in the
    // list has no market entry, so every list is checked against the market first.
    function marketUrl(kind, hashNames) {
        return `https://steamcommunity.com/market/${kind}?appid=753&contextid=6` +
            hashNames.map(h => `&items[]=${encodeURIComponent(h)}&qty[]=1`).join('');
    }

    const norm = s => s.toLowerCase().replace(/\s+/g, ' ').trim();
    const marketCache = new Map(); // appid -> { time, promise }

    // Returns Map(normalised hash_name -> real hash_name) of all trading cards (normal + foil) for the game
    // that exist on the market, or null if the result can't be trusted to be complete.
    function getMarketNames(appid) {
        const hit = marketCache.get(appid);
        if (hit && Date.now() - hit.time < 5 * 60 * 1000) return hit.promise;
        const url = 'https://steamcommunity.com/market/search/render/?query=&start=0&count=100&appid=753&norender=1' +
            `&category_753_Game%5B%5D=tag_app_${appid}&category_753_item_class%5B%5D=tag_item_class_2`;
        const promise = fetch(url, { credentials: 'same-origin' })
            .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
            .then(j => {
                if (!j || j.success === false || !Array.isArray(j.results)) throw new Error('bad market response');
                if (j.total_count > j.results.length) return null; // incomplete page, don't filter
                return new Map(j.results.map(x => [norm(x.hash_name), x.hash_name]));
            });
        promise.catch(() => marketCache.delete(appid));
        marketCache.set(appid, { time: Date.now(), promise });
        return promise;
    }

    async function resolveHashNames(appid, names, suffix) {
        const wanted = names.map(n => `${appid}-${n}${suffix || ''}`);
        let existing = null;
        try { existing = await getMarketNames(appid); }
        catch (e) { console.warn('[SBB] market lookup failed, using unverified names', e); }
        if (!existing) return { hashNames: wanted, skipped: [] };
        const hashNames = [], skipped = [];
        wanted.forEach(w => {
            const real = existing.get(norm(w));
            real ? hashNames.push(real) : skipped.push(w);
        });
        return { hashNames, skipped };
    }

    // ---- button helpers ----
    function makeBtn(label, href) {
        const a = document.createElement('a');
        a.className = 'btn_grey_grey btn_medium';
        a.target = '_blank';
        a.rel = 'noopener';
        a.href = href || '#';
        const s = document.createElement('span');
        s.textContent = label;
        a.appendChild(s);
        return a;
    }
    function setBtn(a, { href, label, title }) {
        if (href) a.href = href;
        if (label) a.firstChild.textContent = label;
        if (title !== undefined) a.title = title;
    }
    const listTitle = (head, names) => names.length ? head + ':\n' + names.map(n => '• ' + n).join('\n') : '';

    // Market buttons: load card data if needed, drop cards that have no market entry, then open the page.
    function wireMarket(ctx, a, key) {
        a.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            const w = window.open('about:blank', '_blank'); // opened synchronously to avoid popup blocking
            try {
                if (!ctx.targets) render(ctx, await getData(ctx.appid, true));
                const t = ctx.targets[key];
                const { hashNames, skipped } = await resolveHashNames(ctx.appid, t.names, t.suffix);
                if (skipped.length) {
                    console.info('[SBB] left out (no market entry):', skipped);
                    a.title = a.title.split('\n\nLeft out')[0] +
                        '\n\nLeft out (no market entry):\n' + skipped.map(x => '• ' + x).join('\n');
                }
                if (!hashNames.length) {
                    if (w) w.close();
                    alert('None of these cards exist on the Steam Market right now:\n' + skipped.join('\n'));
                    return;
                }
                const url = marketUrl(t.kind, hashNames);
                if (w) w.location.href = url; else window.open(url, '_blank');
            } catch (err) {
                if (w) w.close();
                alert('Could not prepare this link: ' + err.message);
            }
        });
    }

    function render(ctx, d) {
        const { appid } = ctx;
        const all = d.cards.map(c => c.name);
        const size = all.length;
        const missingNormal = d.cards.filter(c => !c.owned).map(c => c.name);
        const missingFoil = all.filter(n => !d.foilOwned.has(n));

        // Normal: complete only at level 5. The number in brackets is the number of cards the button opens
        // (missing cards, or the whole set when complete / nothing missing).
        const normalDone = d.normalLevel >= NORMAL_MAX_LEVEL;
        let nLabel, nNames, nTitle;
        if (normalDone) {
            nNames = all; nLabel = `Normal set complete ✓ (${size})`;
            nTitle = `Badge level ${d.normalLevel}/${NORMAL_MAX_LEVEL} – opens multibuy for the full set of ${size} cards`;
        } else if (missingNormal.length) {
            nNames = missingNormal; nLabel = `Buy missing (${missingNormal.length})`;
            nTitle = listTitle('Cards missing', missingNormal) + `\n\nBadge level ${d.normalLevel}/${NORMAL_MAX_LEVEL}`;
        } else {
            nNames = all; nLabel = `Buy next set (${size})`;
            nTitle = `You own the full set, badge level ${d.normalLevel}/${NORMAL_MAX_LEVEL} – opens multibuy for all ${size} cards`;
        }
        setBtn(ctx.normal, { label: nLabel, title: nTitle });

        // Foil: complete at level 1.
        const foilDone = d.foilLevel >= FOIL_MAX_LEVEL;
        let fLabel, fNames, fTitle;
        if (foilDone) {
            fNames = all; fLabel = `FOIL set complete ✓ (${size})`;
            fTitle = `Foil badge level ${d.foilLevel}/${FOIL_MAX_LEVEL} – opens multibuy for the full foil set of ${size} cards`;
        } else if (missingFoil.length) {
            fNames = missingFoil; fLabel = `Buy missing FOIL (${missingFoil.length})`;
            fTitle = listTitle('Foil cards missing', missingFoil.map(n => `${appid}-${n} (Foil)`));
        } else {
            fNames = all; fLabel = `Buy FOIL set (${size})`;
            fTitle = `You own the full foil set but have not crafted the badge – opens multibuy for all ${size} foil cards`;
        }
        setBtn(ctx.foil, { label: fLabel, title: fTitle });

        // what each market button opens when clicked (verified against the market at click time)
        ctx.targets = {
            sell:   { kind: 'multisell', names: all,    suffix: '' },
            normal: { kind: 'multibuy',  names: nNames, suffix: '' },
            foil:   { kind: 'multibuy',  names: fNames, suffix: ' (Foil)' },
        };
    }

    // ---- lazy prefetch when a row scrolls into view ----
    const io = new IntersectionObserver((entries) => {
        entries.forEach(en => {
            if (!en.isIntersecting) return;
            io.unobserve(en.target);
            const ctx = en.target._sbbCtx;
            if (!ctx) return;
            getData(ctx.appid, false).then(d => render(ctx, d)).catch(() => { /* label stays; click retries */ });
        });
    }, { rootMargin: '300px' });

    // ---- build buttons for each badge row ----
    function getAppId(row) {
        const link = row.querySelector('a[href*="/gamecards/"]');
        const m = link && link.href.match(/\/gamecards\/(\d+)/);
        return m ? m[1] : null;
    }

    function getGameName(row) {
        const titleEl = row.querySelector('.badge_title');
        if (!titleEl) return null;
        const clone = titleEl.cloneNode(true);
        clone.querySelectorAll('*').forEach(el => el.remove()); // drop "View details" span etc.
        return clone.textContent.replace(/\u00a0/g, ' ').trim();
    }

    function addButtons() {
        document.querySelectorAll('.badge_row').forEach(row => {
            if (row.dataset.sbbCards) return;
            const appid = getAppId(row);
            if (!appid) return;
            row.dataset.sbbCards = '1';

            const name = getGameName(row);
            const booster = name
                ? makeBtn('Booster Pack', `https://steamcommunity.com/market/listings/753/${encodeURIComponent(appid + '-' + name + ' Booster Pack')}`)
                : null;
            const store  = makeBtn('Store Page', `https://store.steampowered.com/app/${appid}`);
            const inv    = makeBtn('View cards in my Inventory', `${PROFILE}/inventory/#753_6`);
            const sell   = makeBtn('Sell these cards on the Market');
            const dialog = makeBtn('Show buy cards dialog', `${PROFILE}/gamecards/${appid}/${DIALOG_HASH}`);
            const normal = makeBtn('Buy missing');
            const foil   = makeBtn('Buy missing FOIL');

            const ctx = { appid, sell, normal, foil };
            wireMarket(ctx, sell, 'sell');
            wireMarket(ctx, normal, 'normal');
            wireMarket(ctx, foil, 'foil');
            [booster, store, inv, dialog].forEach(b => b && b.addEventListener('click', e => e.stopPropagation()));

            const wrap = document.createElement('div');
            wrap.className = 'sbb-card-actions';
            wrap.style.cssText = 'position:relative;z-index:5;display:flex;flex-wrap:wrap;gap:6px;' +
                (PLACE_IN_INFO_COLUMN ? 'margin-top:8px;' : 'padding:8px 12px 10px;');
            [booster, store, inv, sell, dialog, normal, foil].forEach(b => b && wrap.appendChild(b));

            const target = PLACE_IN_INFO_COLUMN
                ? (row.querySelector('.badge_info') || row.querySelector('.badge_content') || row)
                : (row.querySelector('.badge_row_inner') || row);
            target.appendChild(wrap);

            row._sbbCtx = ctx;
            io.observe(row);
        });
    }

    addButtons();
    let timer;
    new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(addButtons, 200); })
        .observe(document.body, { childList: true, subtree: true });
})();