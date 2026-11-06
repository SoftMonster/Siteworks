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

    // ---- URL builders (same format as the gamecards-page buttons) ----
    function marketUrl(kind, appid, names, suffix) {
        return `https://steamcommunity.com/market/${kind}?appid=753&contextid=6` +
            names.map(n => `&items[]=${appid}-${encodeURIComponent(n + (suffix || ''))}&qty[]=1`).join('');
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

    // Dynamic buttons: until card data has loaded their href is "#", so we fetch first, then open.
    function wireDynamic(a, urlFn) {
        a.addEventListener('click', async (e) => {
            e.stopPropagation();
            const href = a.getAttribute('href');
            if (href && href !== '#') return; // real link already set, let the browser handle it
            e.preventDefault();
            const w = window.open('about:blank', '_blank'); // opened synchronously to avoid popup blocking
            try {
                const url = await urlFn();
                if (w) w.location.href = url;
            } catch (err) {
                if (w) w.close();
                alert('Could not load the card list for this game: ' + err.message);
            }
        });
    }

    function render(ctx, d) {
        const { appid } = ctx;
        const all = d.cards.map(c => c.name);
        const size = all.length;
        const missingNormal = d.cards.filter(c => !c.owned).map(c => c.name);
        const missingFoil = all.filter(n => !d.foilOwned.has(n));

        setBtn(ctx.sell, { href: marketUrl('multisell', appid, all) });

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
        setBtn(ctx.normal, { href: marketUrl('multibuy', appid, nNames), label: nLabel, title: nTitle });

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
        setBtn(ctx.foil, { href: marketUrl('multibuy', appid, fNames, ' (Foil)'), label: fLabel, title: fTitle });
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
            const urgentRender = async () => { const d = await getData(appid, true); render(ctx, d); return d; };
            wireDynamic(sell,   async () => { await urgentRender(); return sell.href; });
            wireDynamic(normal, async () => { await urgentRender(); return normal.href; });
            wireDynamic(foil,   async () => { await urgentRender(); return foil.href; });
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