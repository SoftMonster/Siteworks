// Site Works design, inventory and market-price enrichment for Steam inventory pages.
// Steam inventory webdata is the source for owned assets, descriptions and quantities.
// Market prices are a separate optional enrichment from Steam's market endpoint.
// Prices are stored locally and projected into shared filedata; they are not exported
// to Downloads as an intermediate import workflow.
// The green Quick Sell helper remains a separate, user-triggered convenience action.
(function cardShelfInventoryPrices(data) {
  const SYM = { "2001": "$", "2002": "\u00a3", "2003": "\u20ac", "2005": "\u20bd", "2007": "R$", "2008": "\u00a5", "2020": "C$", "2021": "A$" };
  const money = (cur, minor) => (SYM[cur] || "") + (minor / 100).toFixed(2);
  const pad = (n) => (n < 10 ? "0" : "") + n;
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const shortStamp = (ms) => { const d = new Date(ms); return d.getDate() + " " + MON[d.getMonth()] + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); };
  const longStamp = (ms) => { const d = new Date(ms); return d.getDate() + " " + MON[d.getMonth()] + " " + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); };
  const ago = (ms) => { const m = Math.max(0, Math.round((Date.now() - ms) / 60000));
    return m < 60 ? m + " min ago" : m < 2880 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " days ago"; };
  const ageColour = (ms) => { const days = (Date.now() - ms) / 86400000; return days < 2 ? "#a4d007" : days < 14 ? "#e5b84b" : "#e06c5b"; };
  const toast = (msg) => {
    let d = document.getElementById("card-shelf-helper-toast");
    if (!d) { d = document.createElement("div"); d.id = "card-shelf-helper-toast";
      d.style.cssText = "position:fixed;top:20px;right:20px;z-index:2147483647;background:#1b2838;color:#fff;padding:12px 16px;max-width:420px;" +
        "border-radius:8px;font:14px 'Segoe UI',Arial,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.5);white-space:pre-line"; document.body.appendChild(d); }
    d.textContent = msg; clearTimeout(d._t); d._t = setTimeout(() => d.remove(), 8000);
  };
  if (!/steamcommunity\.com$/.test(location.hostname) || !/\/inventory/.test(location.pathname)) { console.info("Design & price shelf: not a steamcommunity.com inventory page, nothing added."); return; }
  const CACHE = "cardShelfInvCache";
  const persist = () => {
    try { localStorage.setItem(CACHE, JSON.stringify(S.data)); }
    catch (e) { console.warn("Site Works: could not save market-price data", e); }
    // Keep prices as an enrichment of the shared filedata model, not a parallel inventory.
    try {
      const key = "siteworksFiledata_v1", fd = JSON.parse(localStorage.getItem(key) || "null");
      if (fd && fd.schemaVersion === 1) {
        fd.prices = S.data.prices || {};
        fd.priceHistory = S.data.history || {};
        fd.priceUpdatedAt = Date.now();
        localStorage.setItem(key, JSON.stringify(fd));
      }
    } catch (e) { console.warn("Site Works: price data saved locally but could not be projected into shared filedata", e); }
  };
  if (!data) { try { data = JSON.parse(localStorage.getItem(CACHE) || "null"); } catch (e) { data = null; } }
  if (!data || !data.prices) data = { prices: {}, bids: {}, savedAt: 0 };
  if (!data.bids) data.bids = {};
  const S = window.__cardShelfInv || (window.__cardShelfInv = {});
  S.data = data; S.gen = (S.gen || 0) + 1;                // a re-run with new data redraws every tag

  const nameOf = (el) => {
    let it = el.rgItem;
    if (!it) {
      const m = /^\d+_\d+_(\d+)$/.exec(el.id || "");
      try { const inv = window.g_ActiveInventory; it = m && inv && inv.m_rgAssets ? inv.m_rgAssets[m[1]] : null; } catch (e) { it = null; }
    }
    const d = it && (it.description || it);
    return (d && d.market_hash_name) || "";
  };
  const lookup = (name) => {
    const p = S.data.prices[name], b = S.data.bids ? S.data.bids[name] : null;
    return p ? { p: p[0], cur: p[1], at: p[2], src: p[3] || "", bid: b && b[0] > 0 ? { p: b[0], cur: b[1], at: b[2] } : null } : null;
  };

  if (!document.getElementById("cs-inv-price-style")) {
    const st = document.createElement("style"); st.id = "cs-inv-price-style";
    st.textContent =
      ".cs-inv-price{position:absolute;left:2px;right:2px;bottom:2px;z-index:5;pointer-events:none;background:rgba(10,16,24,.86);" +
      "border-radius:3px;padding:1px 2px;text-align:center;font:10px/1.25 Arial,sans-serif;color:#c6d4df;white-space:nowrap;overflow:hidden}" +
      ".cs-inv-price b{display:block;font-size:11px;color:#fff}" +
      ".cs-inv-panel{margin:10px 0;padding:8px 10px;border-left:3px solid #66c0f4;background:rgba(0,0,0,.25);font:12px/1.6 Arial,sans-serif;color:#c6d4df}" +
      ".cs-inv-panel b{color:#fff}";
    document.head.appendChild(st);
  }

  const drawTiles = () => {
    document.querySelectorAll(".inventory_page .item, .itemHolder .item").forEach((el) => {
      const name = nameOf(el);
      const key = S.gen + "|" + name;
      if (el.dataset.csPrice === key) return;
      el.dataset.csPrice = key;
      const old = el.querySelector(".cs-inv-price"); if (old) old.remove();
      const c = name && lookup(name);
      if (!c) return;
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      const tag = document.createElement("div"); tag.className = "cs-inv-price";
      tag.innerHTML = "<b></b><span></span>";
      tag.firstChild.textContent = money(c.cur, c.p);
      tag.lastChild.textContent = shortStamp(c.at);
      tag.lastChild.style.color = ageColour(c.at);
      el.title = "Cached market price: " + money(c.cur, c.p) + " at " + longStamp(c.at) + " (" + ago(c.at) + ")" +
        (c.bid ? "\nHighest buy order: " + money(c.bid.cur, c.bid.p) + " at " + longStamp(c.bid.at) : "");
      el.appendChild(tag);
    });
  };

  const drawPanel = () => {
    let sel = null;
    try { sel = window.g_ActiveInventory && window.g_ActiveInventory.selectedItem; } catch (e) {}
    const d = sel && (sel.description || sel), name = (d && d.market_hash_name) || "";
    document.querySelectorAll("#iteminfo0, #iteminfo1").forEach((p) => {
      if (p.offsetParent === null) return;
      let box = p.querySelector(".cs-inv-panel");
      const key = S.gen + "|" + name;
      if (box && box.dataset.key === key) return;
      if (box) box.remove();
      const c = name && lookup(name);
      if (!c) return;
      box = document.createElement("div"); box.className = "cs-inv-panel"; box.dataset.key = key;
      const line = (label, cur, minor, at, extra) => {
        const row = document.createElement("div");
        row.append(label + ": ");
        const v = document.createElement("b"); v.textContent = money(cur, minor); row.append(v);
        const t = document.createElement("span"); t.textContent = "  \u00b7  saved " + longStamp(at) + " (" + ago(at) + ")" + (extra || "");
        t.style.color = ageColour(at); row.append(t); box.append(row);
      };
      const head = document.createElement("div"); head.textContent = "Cached market price"; head.style.cssText = "color:#66c0f4;font-weight:bold";
      box.append(head);
      line("Lowest listing", c.cur, c.p, c.at, c.src ? " \u2014 " + c.src : "");
      if (c.bid) line("Highest buy order", c.bid.cur, c.bid.p, c.bid.at);
      const anchor = p.querySelector("[id$='_item_market_actions'], .item_market_actions") ||
                     p.querySelector("[id$='_item_descriptors'], .item_desc_descriptors");
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor);
      else (p.querySelector(".item_desc_content") || p).appendChild(box);
    });
  };

  const draw = () => { try { drawTiles(); drawPanel(); } catch (e) { console.error("Card Shelf Helper:", e); } };
  draw();
  if (!S.observer) {
    let pending = 0;
    S.observer = new MutationObserver(() => { if (!pending) pending = setTimeout(() => { pending = 0; S.draw(); }, 300); });
    S.observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("hashchange", () => setTimeout(() => S.draw(), 500));
    document.addEventListener("click", () => setTimeout(() => S.draw(), 600), true);
  }
  S.draw = draw;

  // ---------- v1.5: sortable price list + refreshing saved price data ----------
  // Lists the designs in the inventory Steam has loaded (one row per design), with
  // the saved price and time stamp, sortable. Refresh asks Steam's public
  // /market/priceoverview/ for one design at a time - the same request as Card
  // Shelf's Refresh prices - with your Delay between requests; the first 429
  // ("slow down") stops it and starts a cool-down (1 h, doubling, max 24 h).
  // New prices update the labels at once and are saved to Downloads as a
  // steam_market_prices_*.json capture, which Card Shelf imports.
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const LS = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
               set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const PRICE_COOLDOWN_KEY = "cardShelfPriceCool";
  const getPriceState = () => {
    const old = LS.get(PRICE_COOLDOWN_KEY, { state: "ready", until: 0, blocks: 0 }) || {};
    // Migrate the earlier R2.1 {until, blocks} record without losing its cooldown.
    if (!old.state) old.state = (old.blocks || 0) > 0 ? "throttled" : "ready";
    return old;
  };
  const savePriceState = (v) => LS.set(PRICE_COOLDOWN_KEY, Object.assign({ state: "ready", until: 0, blocks: 0 }, v));
  const parseRetryAfter = (resp) => {
    try {
      const raw = resp.headers && resp.headers.get("Retry-After");
      if (!raw) return 0;
      const seconds = Number(raw);
      if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 7 * 86400000);
      const date = Date.parse(raw);
      return Number.isFinite(date) ? Math.max(0, Math.min(date - Date.now(), 7 * 86400000)) : 0;
    } catch (e) { return 0; }
  };
  const classifyPriceResponse = (status, payload) => {
    if (status === 429) return "throttled";
    if (status === 403 || status === 503 || status === 502 || status === 504) return "blocked";
    if (status < 200 || status >= 300) return "http-error";
    if (!payload || typeof payload !== "object" || payload.success !== true) return "invalid";
    return "valid";
  };
  const throttleDuration = (blocks) => Math.min(3600000 * Math.pow(2, Math.max(0, blocks - 1)), 86400000);
  const pence = (t) => {
    let s = String(t || "").replace(/[^\d.,]/g, ""); if (!s) return null;
    if (/,\d{2}$/.test(s)) s = s.replace(/\./g, "").replace(",", "."); else s = s.replace(/,/g, "");
    const v = parseFloat(s); return isNaN(v) ? null : Math.round(v * 100);
  };
  const walletCur = () => {
    try { const w = window.g_rgWalletInfo; if (w && w.wallet_currency) return String(2000 + Number(w.wallet_currency)); } catch (e) {}
    const count = {}; Object.keys(S.data.prices).forEach((k) => { const c = S.data.prices[k][1]; if (c) count[c] = (count[c] || 0) + 1; });
    return Object.keys(count).sort((a, b) => count[b] - count[a])[0] || "2002";
  };
  const FULL_SCAN_KEY = "siteworksInventoryFullScan_v1"; // legacy migration key
  const FILEDATA_KEY = "siteworksFiledata_v1";
  const readFiledata = () => {
    let data = LS.get(FILEDATA_KEY, null);
    if (!data || data.schemaVersion !== 1) {
      data = { schemaVersion: 1, designs: LS.get("siteworksKnownCardDesigns_v1", {}) || {},
        inventory: LS.get(FULL_SCAN_KEY, null), prices: S.data.prices || {},
        priceHistory: S.data.history || {}, updatedAt: Date.now() };
      LS.set(FILEDATA_KEY, data);
    }
    if (!data.designs || typeof data.designs !== "object") data.designs = {};
    if (!data.prices || typeof data.prices !== "object") data.prices = {};
    if (!data.priceHistory || typeof data.priceHistory !== "object") data.priceHistory = {};
    // Merge the legacy price store into the shared projection by newest timestamp.
    Object.keys(S.data.prices || {}).forEach(name => {
      const current = data.prices[name], legacy = S.data.prices[name];
      if (!current || (Number(legacy && legacy[2]) || 0) > (Number(current && current[2]) || 0)) data.prices[name] = legacy;
    });
    return data;
  };
  const writeFiledata = (data) => { data.schemaVersion = 1; data.updatedAt = Date.now(); LS.set(FILEDATA_KEY, data); };
  const readFullScan = () => readFiledata().inventory || null;
  const saveFullScan = (inventory) => { const data = readFiledata(); data.inventory = inventory; writeFiledata(data); };
  const holdings = () => {
    const saved = readFullScan();
    if (!(S.scanState && S.scanState.running) && saved && saved.holdings && Object.keys(saved.holdings).length) return saved.holdings;
    const out = {}, inv = window.g_ActiveInventory;
    if (!inv || !inv.m_rgAssets) return out;
    Object.keys(inv.m_rgAssets).forEach((id) => {
      const a = inv.m_rgAssets[id], d = a && (a.description || a), n = d && d.market_hash_name;
      if (!n) return;
      const o = out[n] || (out[n] = { name: n, label: d.name || n.replace(/^\d+-/, ""), qty: 0, assetid: a.assetid || id,
        appid: String(d.appid || inv.appid || 753), contextid: String(a.contextid || inv.contextid || 6), marketable: !!d.marketable });
      o.qty += Number(a.amount || 1) || 1;
    });
    return out;
  };

  if (!S.ui) {
    const st = document.createElement("style");
    st.textContent =
      "#cs-pl-btn{position:fixed;left:16px;bottom:16px;z-index:2147483600;background:#66c0f4;color:#0b1520;border:0;border-radius:6px;padding:8px 12px;font:bold 13px Arial,sans-serif;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.5)}" +
      "#cs-pl{position:fixed;right:16px;top:70px;bottom:16px;width:min(500px,calc(100vw - 32px));z-index:2147483600;display:none;flex-direction:column;background:#16202d;color:#c6d4df;" +
      "border:1px solid #2a475e;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.6);font:12px Arial,sans-serif}" +
      "#cs-pl .hd{padding:10px 12px 8px;border-bottom:1px solid #2a475e;flex:0 0 auto;overflow:visible}#cs-pl .hd b.t{color:#fff;font-size:14px}" +
      "#cs-pl .headrow{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}" +
      "#cs-pl .headtitle{display:flex;align-items:baseline;gap:7px;min-width:0}" +
      "#cs-pl .headtitle .cnt{color:#9fb3c5;font-size:11px}" +
      "#cs-pl .headactions{display:flex;align-items:center;justify-content:flex-end;gap:5px;flex-wrap:wrap}" +
      "#cs-pl .headactions button{white-space:nowrap;padding:5px 8px}" +
      "#cs-pl .tabbar{display:flex;gap:6px;margin-top:10px;border-bottom:1px solid #30465a;padding-bottom:8px;clear:both}" +
      "#cs-pl .tabbtn{flex:1;padding:7px 5px;background:#203247;color:#aebfce;border:1px solid #30465a;font-weight:700}" +
      "#cs-pl .tabbtn[aria-selected=true]{background:#38617d;color:#fff;border-color:#66c0f4}" +
      "#cs-pl .tabcontent{display:flex;flex:1 1 auto;min-height:0;overflow:hidden}" +
      "#cs-pl .tabpane{display:none;flex:1 1 auto;min-height:0;overflow:auto;padding:10px 12px}" +
      "#cs-pl .tabpane.active{display:flex;flex-direction:column;gap:10px}" +
      "#cs-pl .tabpane .row{align-items:center}" +
      "#cs-pl .pricespane .pricepanel{display:flex;flex-direction:column;gap:8px}" +
      "#cs-pl .pricespane .pricepanel .row{margin-top:0}" +
      "#cs-pl .inventorypane>.row:first-child{display:flex;gap:8px;flex-wrap:wrap}" +
      "#cs-pl .inventorypane .inventorysummary{flex:0 0 auto}" +
      "#cs-pl .inventorypane .bd{flex:1 1 auto}" +
      "#cs-pl .tabpane .designpanel,#cs-pl .tabpane .pricepanel{margin-top:0}" +
      "#cs-pl .inventorypane .bd{display:block;flex:1 1 auto;min-height:0;max-height:none;overflow:auto;border:1px solid #30465a;border-radius:5px}" +
      "#cs-pl .inventorypane .row{flex:0 0 auto}" +
      "#cs-pl .inventorysummary{font-size:11px;color:#c6d4df;padding:6px 8px;background:#142333;border-left:3px solid #729b55;border-radius:3px}" +
      "#cs-pl select,#cs-pl input[type=text]{background:#0e1620;color:#c6d4df;border:1px solid #2a475e;border-radius:3px;padding:2px 4px;font-size:12px}" +
      "#cs-pl button{background:#2a475e;color:#fff;border:0;border-radius:3px;padding:4px 10px;cursor:pointer;font-size:12px}#cs-pl button.go{background:#5c7e10}#cs-pl button.stop{background:#a33}" +
      "#cs-pl .row{margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}" +
      "#cs-pl .sectionlabel{margin-top:9px;padding-top:6px;border-top:1px solid #30465a;color:#8faec5;font-size:10px;font-weight:700;letter-spacing:.09em}" +
      "#cs-pl .summary,#cs-pl .datasummary{padding:5px 7px;background:#142333;border-left:3px solid #477da4;border-radius:3px;line-height:1.45}" +
      "#cs-pl .datasummary{border-left-color:#729b55;font-size:11px}" +
      "#cs-pl .scanrow{padding:5px 0}" +
      "#cs-pl .discoveryprogress{padding:6px 7px;background:#101d2a;border-radius:3px}" +
      "#cs-pl .scanprogresslabel{font-size:11px;color:#d6e2ec;white-space:nowrap;font-variant-numeric:tabular-nums}" +
      "#cs-pl .sessionstats{font-size:11px;color:#9fb3c5;padding:4px 7px;background:#14202c;border-radius:3px}" +
      "#cs-pl .designpanel,#cs-pl .pricepanel{margin-top:8px;padding:0 7px 8px;border:1px solid #30465a;border-radius:5px;background:rgba(10,20,30,.24)}" +
      "#cs-pl .designpanel .sectionlabel,#cs-pl .pricepanel .sectionlabel{margin-top:0;padding-top:8px;border-top:0}" +
      "#cs-pl .pricepanel{border-color:#476b82;background:rgba(25,43,57,.35)}" +
      "#cs-pl .pricestats{font-size:11px;color:#d2dfeb;padding:5px 7px;background:#142333;border-left:3px solid #66c0f4;border-radius:3px}" +
      "#cs-pl .priceprogress{display:flex;align-items:center;gap:7px;padding:4px 7px;background:#101d2a;border-radius:3px}" +
      "#cs-pl .pricebar{width:105px;height:9px;flex:0 0 105px}" +
      "#cs-pl .priceprogresslabel{font-size:11px;color:#aebfce}" +
      "#cs-pl .discoveryprogress{align-items:center}#cs-pl .scanprogress{width:118px;height:10px;accent-color:#d99a36}#cs-pl .scanstatus{flex:1;min-width:180px;color:#c6d4df}#cs-pl .activitylog{display:block;max-height:90px;overflow:auto;padding:5px 7px;background:#0e1620;border:1px solid #2a475e;border-radius:3px;font:11px/1.5 monospace}#cs-pl .activitylog[hidden]{display:none}" +
      "#cs-pl .bd{flex:1 1 45%;min-height:180px;overflow:auto;overscroll-behavior:contain}#cs-pl table{width:100%;border-collapse:collapse}" +
      "#cs-pl th{position:sticky;top:0;background:#1b2838;color:#8fa3b5;text-align:left;padding:5px 6px;cursor:pointer;user-select:none;white-space:nowrap}" +
      "#cs-pl td{color:#c6d4df;padding:4px 6px;border-top:1px solid #1f2f40;white-space:nowrap}#cs-pl td.n{white-space:normal}" +
      "#cs-pl tr.r:hover td{background:#1f3044;cursor:pointer}#cs-pl .num{text-align:right}#cs-pl .st{padding:6px 12px;border-top:1px solid #2a475e;min-height:16px}" +
      "#cs-pl .throttleinfo{font-size:11px;flex:1;min-width:220px}";
    document.head.appendChild(st);
    const btn = document.createElement("button"); btn.id = "cs-pl-btn"; btn.textContent = "Design & price shelf"; document.body.appendChild(btn);
    const box = document.createElement("div"); box.id = "cs-pl";
    box.innerHTML =
      '<div class="hd"><div class="headrow"><div class="headtitle"><b class="t">Design &amp; price shelf</b><span class="cnt"></span></div><div class="headactions"><button class="imp" title="Import saved design and price data.">Import data…</button><button class="rl" title="Reload designs and items currently loaded by Steam">Reload list</button><button class="x">Close</button></div></div>' +
      '<div class="tabbar" role="tablist" aria-label="Design and price shelf sections">' +
      '<button class="tabbtn" role="tab" data-tab="design" aria-selected="true">🔎 Design capture</button>' +
      '<button class="tabbtn" role="tab" data-tab="prices" aria-selected="false">💷 Price enrichment</button>' +
      '<button class="tabbtn" role="tab" data-tab="inventory" aria-selected="false">📦 Inventory list</button>' +
      '</div></div>' +
      '<div class="tabcontent">' +
      '<section class="tabpane designpane active" data-pane="design" role="tabpanel">' +
      '<div class="designpanel">' +
      '<div class="sectionlabel">🔎 WEBdata INGESTION &amp; DESIGN DISCOVERY</div>' +
      '<div class="row summary" aria-live="polite"></div>' +
      '<div class="row datasummary" aria-live="polite" title="Saved designs, current/complete inventory holdings and price-saved-data-only entries are counted separately."></div>' +
      '<div class="row scanrow"><button class="newdesigns" title="Synchronise the active Steam inventory: capture current webdata, stream further batches through Steam’s own loader, save incremental backups and update the shared filedata used by all tabs. Prices are enriched separately.">Synchronise inventory</button> <button class="scanstop stop" title="Stop after the current Steam request settles and preserve all committed webdata and filedata." disabled>Stop</button></div>' +
      '<div class="row discoveryprogress"><progress class="scanprogress" max="100" value="0" title="Approximate progress against the minimum expected inventory size"></progress><span class="scanprogresslabel">0 / minimum unknown</span><span class="scanstatus" aria-live="polite">Inventory loading is monitored independently of market prices.</span></div>' +
      '<div class="row sessionstats" aria-live="polite">No discovery session recorded yet.</div>' +
      '<div class="row toolsrow"><button class="exportdesigns" title="Export the local known-design catalogue as JSON; does not export prices.">Export design catalogue</button><button class="resetdiscovery" title="Reset only the discovery cursor to page one. Saved designs and price history are preserved.">Reset discovery position</button><button class="showlog" title="Show recent inventory and design-discovery events.">Activity log</button></div><div class="row activitylog" hidden aria-live="polite"></div>' +
      '</div></section>' +
      '<section class="tabpane pricespane" data-pane="prices" role="tabpanel">' +
      '<div class="pricepanel">' +
      '<div class="sectionlabel">💷 MARKET PRICE ENRICHMENT</div>' +
      '<div class="row priceexplain" style="font-size:11px;color:#aebfce">Inventory webdata does not contain live market prices. This optional step enriches the shared filedata using Steam’s separate market endpoint. A throttle pauses price requests only; your inventory remains available.</div>' +
      '<div class="row pricestats" aria-live="polite"></div>' +
      '<div class="row priceprogress"><progress class="pricebar" max="100" value="0"></progress><span class="priceprogresslabel">Ready · no price requests running</span></div>' +
      '<div class="row">Sort <select class="sort"><option value="pd">Saved price: high → low</option><option value="pa">Saved price: low → high</option><option value="ao">Cached: oldest first</option><option value="an">Cached: newest first</option><option value="q">Quantity held</option><option value="nm">Name</option></select><label><input type="checkbox" class="hide"> hide designs with no saved price</label></div>' +
      '<div class="row">Enrich <select class="which"><option value="ticked">ticked designs</option><option value="none">designs with no saved price</option><option value="old">saved over a day ago</option><option value="shown">every design listed</option></select> max <select class="max" title="Maximum number of design price requests in this batch."><option>10</option><option selected>25</option><option>50</option><option>100</option><option value="0">all</option></select> Delay <input type="text" class="dl" size="5" title="Minimum delay between market-price requests, in milliseconds."> ms <button class="pricego" title="Fetch missing market-price data from Steam’s separate market endpoint. Inventory webdata does not contain live prices. A throttle stops this queue; no automatic retries.">Enrich prices</button></div>' +
      '<div class="row throttle"><span class="throttleinfo" aria-live="polite"></span></div>' +
      '</div></section>' +
      '<section class="tabpane inventorypane" data-pane="inventory" role="tabpanel">' +
      '<div class="row"><input type="text" class="search" placeholder="Search designs…" aria-label="Search designs" title="Filter the displayed design list by design name."> <select class="freshness"><option value="all">All price ages</option><option value="fresh">Fresh (&lt;2 days)</option><option value="aging">Aging (2–14 days)</option><option value="stale">Stale (&gt;14 days)</option><option value="missing">No price</option></select></div>' +
      '<div class="row inventorysummary" aria-live="polite">Inventory design and item quantities</div>' +
      '<div class="bd"><table><thead><tr><th style="width:18px"><input type="checkbox" class="all" title="Tick every design listed"></th><th data-s="nm">Design</th><th data-s="q" class="num" title="Number of individual inventory items for this design; — means quantity is unknown.">Items</th><th data-s="pd" class="num">Saved price</th><th data-s="ao">Saved at</th><th class="num">Buy order</th></tr></thead><tbody></tbody></table></div>' +
      '</section></div>' +
      '<div class="st" aria-live="polite"></div>';
    document.body.appendChild(box);
    const $ = (sel) => box.querySelector(sel);
    S.ui = { btn, box, $, ticked: new Set() };
    const activateTab = (name) => {
      box.querySelectorAll(".tabbtn").forEach((b) => {
        const active = b.dataset.tab === name;
        b.setAttribute("aria-selected", active ? "true" : "false");
      });
      box.querySelectorAll(".tabpane").forEach((p) => p.classList.toggle("active", p.dataset.pane === name));
    };
    box.querySelectorAll(".tabbtn").forEach((b) => b.addEventListener("click", () => activateTab(b.dataset.tab)));
    $(".newdesigns").onclick = () => S.discoverNewDesigns();
    $(".scanstop").onclick = () => {
      if (!S.scanState.running) return;
      S.scanState.stop = true;
      if (S.run && !S.run.done) S.run.stop = true;
      $(".scanstop").disabled = true;
      $(".scanstatus").textContent = "STOPPING · waiting for the current Steam operation to settle; preserving webdata…";
      S.status("Stop requested. No further native inventory batch will be initiated; the current Steam request is allowed to settle and webdata is preserved.");
    };
    $(".exportdesigns").onclick = () => {
      const catalog = knownDesigns();
      const blob = new Blob([JSON.stringify({ version: 1, exportedAt: Date.now(), designs: catalog }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = "siteworks-card-designs-" + new Date().toISOString().slice(0,10) + ".json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      logDiscovery("Exported " + Object.keys(catalog).length + " known designs"); S.status("Exported " + Object.keys(catalog).length + " known designs. Market-price history was not included.");
    };
    $(".resetdiscovery").onclick = () => { if (!confirm("Reset the new-design discovery position to page one? Saved designs, inventory snapshots and price history will be preserved.")) return; LS.set(DESIGN_CURSOR_KEY, { nextPage: 1, resetAt: Date.now() }); updateDiscoveryProgress(0, 0); logDiscovery("Discovery position reset to page one"); S.status("Discovery position reset. The design catalogue and price history were preserved."); };
    $(".showlog").onclick = () => { const el = $(".activitylog"); el.hidden = !el.hidden; if (!el.hidden) renderDiscoveryLog(); };
    $(".sort").value = LS.get("cardShelfPlSort", "pd");
    $(".search").value = LS.get("cardShelfPlSearch", "");
    // HF14 could persist the "No saved price" filter. HF15 starts with the complete
    // catalogue visible so saved designs are not silently hidden on upgrade.
    $(".freshness").value = "all";
    LS.set("cardShelfPlFreshness", "all");
    $(".search").oninput = () => { LS.set("cardShelfPlSearch", $(".search").value); S.renderList(); };
    $(".freshness").onchange = () => { LS.set("cardShelfPlFreshness", $(".freshness").value); S.renderList(); };
    $(".hide").checked = !!LS.get("cardShelfPlHide", false);
    $(".dl").value = String(LS.get("cardShelfPlDelay", 3500));
    btn.onclick = () => { const open = box.style.display !== "flex"; box.style.display = open ? "flex" : "none"; if (open) S.renderList(); };
    $(".x").onclick = () => { box.style.display = "none"; };
    $(".rl").onclick = () => { S.snapshotCaptured = false; S.snapshotCompared = false; S.renderList(); };
    $(".imp").onclick = () => {
      const fi = document.createElement("input"); fi.type = "file"; fi.accept = ".json,application/json";
      fi.onchange = async () => {
        const f = fi.files && fi.files[0]; if (!f) return;
        let o; try { o = JSON.parse((await f.text()).replace(/^\uFEFF/, "")); } catch (e) { S.status("That file isn't valid JSON."); return; }
        const norm = (v, isBid) => Array.isArray(v) ? v : (v && typeof v === "object") ? (isBid ? [Math.round(v.p || 0), String(v.cur || ""), v.at || 0] : [Math.round(v.p || 0), String(v.cur || ""), v.at || 0, v.src || ""]) : null;
        let added = 0;
        const merge = (src, dst, isBid) => Object.keys(src || {}).forEach((n) => {
          const v = norm(src[n], isBid); if (!v || !v[2] || (!isBid && !(v[0] > 0))) return;
          if (!dst[n] || dst[n][2] < v[2]) { dst[n] = v; added++; }
        });
        merge(o.prices, S.data.prices, false); merge(o.bids, S.data.bids, true);
        if (!o.prices) { S.status("No prices found in that file. Pick CardShelf_prices.json from Card Shelf's data folder."); return; }
        S.data.savedAt = Date.now(); persist(); S.gen++; draw(); S.renderList();
        S.status("Loaded " + f.name + ": " + added + " price(s) newer than previously saved.");
      };
      fi.click();
    };
    $(".sort").onchange = () => { LS.set("cardShelfPlSort", $(".sort").value); S.renderList(); };
    $(".hide").onchange = () => { LS.set("cardShelfPlHide", $(".hide").checked); S.renderList(); };
    box.querySelectorAll("th[data-s]").forEach((th) => th.onclick = () => {
      const k = th.dataset.s, cur = $(".sort").value;
      $(".sort").value = k === "pd" ? (cur === "pd" ? "pa" : "pd") : k === "ao" ? (cur === "ao" ? "an" : "ao") : k;
      $(".sort").onchange();
    });
    $(".all").onchange = () => { (S.shown || []).forEach((r) => $(".all").checked ? S.ui.ticked.add(r.name) : S.ui.ticked.delete(r.name)); S.renderList(); };
    $("tbody").addEventListener("click", (e) => {
      const tr = e.target.closest("tr.r"); if (!tr) return;
      const name = tr.dataset.n;
      if (e.target.matches("input")) { e.target.checked ? S.ui.ticked.add(name) : S.ui.ticked.delete(name); return; }
      const h = (S.held || {})[name]; if (!h) return;
      try { if (typeof window.ShowItemInventory === "function") window.ShowItemInventory(h.appid, h.contextid, h.assetid); else location.hash = h.appid + "_" + h.contextid + "_" + h.assetid; } catch (err) {}
    });
    $(".pricego").onclick = () => {
      if (S.run && !S.run.done) {
        S.run.stop = true;
        $(".priceprogresslabel").textContent = "STOPPING · finishing the current request";
        S.status("Stopping after the current price request…");
      } else S.refresh();
    };
    window.addEventListener("hashchange", () => { if (box.style.display === "flex") { S.snapshotCaptured = false; S.snapshotCompared = false; setTimeout(() => S.renderList(), 800); } });
  }
  S.status = (t) => { S.ui.$(".st").textContent = t || ""; };
  S.updateThrottleUI = () => {
    const state = getPriceState(), info = S.ui.$(".throttleinfo");
    if (!info) return;
    if ((state.state === "throttled" || state.state === "blocked") && state.until > Date.now()) {
      info.textContent = "Market-price endpoint paused until " + longStamp(state.until) +
        ". Existing inventory webdata and saved prices remain available; no price requests will be sent.";
      info.style.color = "#e5b84b";
    } else if (state.state === "throttled" || state.state === "blocked") {
      info.textContent = "Previous market-price throttle period has elapsed. A user-started enrichment batch may be attempted; no probe is required.";
      info.style.color = "#e5b84b";
    } else if (state.state === "inconclusive") {
      info.textContent = "Market-price endpoint response was inconclusive. Inventory synchronisation is unaffected.";
      info.style.color = "#e5b84b";
    } else {
      info.textContent = "Market prices are optional enrichment from a separate Steam endpoint. Inventory synchronisation does not depend on them.";
      info.style.color = "#8fa3b5";
    }
  };
  S.updateThrottleUI();
  // Inventory-description loading has its own persistent throttle state, separate
  // from the Market price endpoint state above. Failed/empty page loads are never
  // treated as a complete scan and never trigger automatic retries.
  const INVENTORY_COOLDOWN_KEY = "siteworksInventoryLoadCooldown_v1";
  const readInventoryState = () => LS.get(INVENTORY_COOLDOWN_KEY, { state: "ready", until: 0, incidents: 0 }) || { state: "ready", until: 0, incidents: 0 };
  const saveInventoryState = (v) => LS.set(INVENTORY_COOLDOWN_KEY, Object.assign({ state: "ready", until: 0, incidents: 0 }, v));
  const inventoryBackoff = (n) => Math.min(3600000 * Math.pow(2, Math.max(0, n - 1)), 86400000);
  const inventoryDescriptionCount = () => {
    const inv = window.g_ActiveInventory;
    if (!inv || !inv.m_rgAssets) return 0;
    return Object.values(inv.m_rgAssets).filter(a => { const d = a && (a.description || a); return !!(d && d.market_hash_name); }).length;
  };
  const markInventoryBlocked = (reason) => {
    const old = readInventoryState(), incidents = (old.incidents || 0) + 1, now = Date.now();
    saveInventoryState({ state: "throttled", incidents, until: now + inventoryBackoff(incidents), lastFailureAt: now, reason });
    S.status("Inventory item-description loading stopped: " + reason + ". Partial data preserved. No automatic retry; wait for cooldown, then use Synchronise inventory to verify Steam webdata.");
    if (S.ui) S.ui.$(".scanstatus").textContent = "THROTTLED · Partial scan retained · " + reason;
  };
  const inventoryCooldownActive = () => { const st = readInventoryState(); return st.state === "throttled" && Date.now() < (st.until || 0); };
  S.scanState = { running: false, stop: false };
  const sleepScan = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  // Short polling intervals make Stop responsive during long waits without
  // cancelling an already-issued Steam navigation request.
  const sleepScanInterruptible = async (ms) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (S.scanState.stop) return false;
      await sleepScan(Math.min(100, end - Date.now()));
    }
    return !S.scanState.stop;
  };
  const visibleInventoryPage = () => [...document.querySelectorAll(".inventory_page")].find((e) => e.offsetParent !== null) || document.querySelector(".inventory_page");
  const pageTiles = () => { const pg = visibleInventoryPage(); return pg ? [...pg.querySelectorAll(".itemHolder .item")].filter((e) => e.offsetParent !== null) : []; };
  const pageSignature = () => {
    const label = pageLabel();
    const ids = pageTiles().map((e) => e.id || e.getAttribute("data-economy-item") || "?");
    return label + "|" + ids.join(",");
  };
  const pageLabel = () => {
    const el = document.querySelector("#pagecontrol, .inventory_pagecontrols, .inventory_pagecontrols_ctn");
    return el ? el.innerText.replace(/\s+/g, " ").trim() : "";
  };
  // Steam commonly reports either an item range ("1 - 25 of 17,300") or a
  // page count ("Page 1 of 693"). Convert either form to total pages.
  const totalInventoryPages = () => {
    const label = pageLabel();
    const range = label.match(/\b\d+\s*[-–]\s*\d+\s+of\s+([\d,]+)/i);
    if (range) return Math.max(1, Math.ceil(Number(range[1].replace(/,/g, "")) / 25));
    const pageCount = label.match(/(?:page\s*)?\d+\s+of\s+([\d,]+)/i);
    return pageCount ? Math.max(1, Number(pageCount[1].replace(/,/g, ""))) : 0;
  };
  const currentInventoryPage = () => {
    const label = pageLabel();
    const range = label.match(/\b([\d,]+)\s*[-–]\s*([\d,]+)\s+of\s+([\d,]+)/i);
    if (range) return Math.max(1, Math.floor((Number(range[1].replace(/,/g, "")) - 1) / 25) + 1);
    const page = label.match(/(?:page\s*)?([\d,]+)\s+of\s+[\d,]+/i);
    return page ? Math.max(1, Number(page[1].replace(/,/g, ""))) : 0;
  };
  const pageItemCount = (snapshot) => snapshot && Array.isArray(snapshot.items) ? snapshot.items.length : 0;

  // Capability-detected Steam webdata adapter. Do not assume a particular Steam build.
  const steamInventoryCapabilities = (inv) => ({
    assets: !!(inv && inv.m_rgAssets && typeof inv.m_rgAssets === "object"),
    descriptions: !!(inv && inv.m_rgDescriptions && typeof inv.m_rgDescriptions === "object"),
    nativeLoader: !!(inv && typeof inv.LoadMoreAssets === "function"),
    fullyLoadedFlag: !!(inv && typeof inv.m_bFullyLoaded === "boolean"),
    appIdentity: !!(inv && inv.appid != null && inv.contextid != null)
  });
  const descriptionForAsset = (asset, inv) => {
    if (!asset) return null;
    if (asset.description && asset.description.market_hash_name) return asset.description;
    if (asset.market_hash_name) return asset;
    const descriptions = inv && inv.m_rgDescriptions || {};
    const classid = String(asset.classid || ""), instanceid = String(asset.instanceid || "0");
    const keys = classid ? [classid + (instanceid !== "0" ? "_" + instanceid : ""), classid + "_0"] : [];
    for (const key of keys) { const d = descriptions[key]; if (d && d.market_hash_name) return d; }
    return null;
  };
  // Versioned webdata journal. This stores serialisable Steam data fields, not
  // the live controller object (which contains methods, DOM references and cycles).
  const WEBDATA_DB = "siteworks_webdata_journal";
  const WEBDATA_DB_VERSION = 1;
  let webdataDbPromise = null;
  const openWebdataDb = () => {
    if (!window.indexedDB) return Promise.reject(new Error("IndexedDB is unavailable"));
    if (webdataDbPromise) return webdataDbPromise;
    webdataDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(WEBDATA_DB, WEBDATA_DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("batches")) db.createObjectStore("batches", { keyPath: "id", autoIncrement: true });
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open webdata journal"));
      request.onblocked = () => reject(new Error("Webdata journal upgrade is blocked by another open Site Works tab"));
    });
    return webdataDbPromise;
  };
  const serialisableRecord = (value, omitDescription = false) => {
    const seen = new WeakSet();
    const json = JSON.stringify(value, (key, val) => {
      if (typeof val === "function") return undefined;
      if (omitDescription && key === "description") return undefined;
      if (val && typeof val === "object") {
        if (typeof Element !== "undefined" && val instanceof Element) return undefined;
        if (seen.has(val)) return undefined;
        seen.add(val);
      }
      return val;
    });
    return json ? JSON.parse(json) : null;
  };
  const stableFingerprint = (value) => {
    try { return JSON.stringify(value); } catch (_) { return ""; }
  };
  const appendWebdataBatch = async (inv, snapshot, batchNumber, seenAssets, seenDescriptions, complete = false) => {
    const assets = [], descriptions = [];
    const assetMap = inv && inv.m_rgAssets || {};
    Object.keys(assetMap).forEach((key) => {
      const asset = assetMap[key]; if (!asset || asset.is_currency) return;
      const record = serialisableRecord(asset, true); if (!record) return;
      const id = String(asset.assetid || asset.id || key), fingerprint = stableFingerprint(record);
      if (seenAssets.get(id) !== fingerprint) { seenAssets.set(id, fingerprint); assets.push({ id, record }); }
    });
    const descriptionMap = inv && inv.m_rgDescriptions || {};
    Object.keys(descriptionMap).forEach((key) => {
      const record = serialisableRecord(descriptionMap[key]); if (!record) return;
      const fingerprint = stableFingerprint(record);
      if (seenDescriptions.get(key) !== fingerprint) { seenDescriptions.set(key, fingerprint); descriptions.push({ key, record }); }
    });
    const db = await openWebdataDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(["batches", "meta"], "readwrite");
      tx.objectStore("batches").add({ schemaVersion: 1, source: "steam-webdata", appid: String(inv.appid),
        contextid: String(inv.contextid), capturedAt: Date.now(), batchNumber, complete,
        reportedItems: Number(inv.m_cItems) || 0, assetCount: Object.keys(assetMap).length,
        descriptionCount: Object.keys(descriptionMap).length, lastAssetID: String(inv.m_ulLastAssetID || ""),
        assets, descriptions });
      tx.objectStore("meta").put({ key: "latest", schemaVersion: 1, appid: String(inv.appid), contextid: String(inv.contextid),
        updatedAt: Date.now(), batchNumber, complete, assetCount: Object.keys(assetMap).length,
        descriptionCount: Object.keys(descriptionMap).length, reportedItems: Number(inv.m_cItems) || 0 });
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error("Could not write webdata batch"));
      tx.onabort = () => reject(tx.error || new Error("Webdata batch write aborted"));
    });
    return { assetsWritten: assets.length, descriptionsWritten: descriptions.length };
  };
  const readWebdataJournal = async () => {
    const db = await openWebdataDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(["batches", "meta"], "readonly");
      const batchesReq = tx.objectStore("batches").getAll();
      const metaReq = tx.objectStore("meta").get("latest");
      tx.oncomplete = () => resolve({ batches: batchesReq.result || [], latest: metaReq.result || null });
      tx.onerror = () => reject(tx.error || new Error("Could not read webdata journal"));
    });
  };
  const readSteamWebdata = (inv) => {
    const caps = steamInventoryCapabilities(inv);
    if (!caps.assets) return { supported: false, reason: "Steam's active inventory webdata is unavailable", items: [], holdings: {}, unresolved: 0, assetCount: 0 };
    const items = [], holdings = Object.create(null); let unresolved = 0;
    Object.keys(inv.m_rgAssets).forEach((key) => {
      const asset = inv.m_rgAssets[key]; if (!asset || asset.is_currency) return;
      const d = descriptionForAsset(asset, inv);
      if (!d || !d.market_hash_name) { unresolved++; return; }
      const assetid = String(asset.assetid || asset.id || key), appid = String(d.appid || asset.appid || inv.appid || ""),
        contextid = String(asset.contextid || inv.contextid || ""), amount = Math.max(1, Number(asset.amount) || 1);
      const item = { assetid, appid, contextid, name: d.market_hash_name, label: d.name || d.market_hash_name,
        marketable: !!d.marketable, tradable: !!d.tradable, amount };
      items.push(item);
      const h = holdings[item.name] || (holdings[item.name] = { name: item.name, label: item.label, qty: 0,
        appid, contextid, assetid, marketable: false, tradable: false });
      h.qty += amount; h.marketable = h.marketable || item.marketable; h.tradable = h.tradable || item.tradable;
    });
    return { supported: true, capabilities: caps, items, holdings, unresolved, assetCount: Object.keys(inv.m_rgAssets).length,
      descriptionCount: Object.keys(inv.m_rgDescriptions || {}).length, reportedItems: Number(inv.m_cItems) || 0,
      fullyLoaded: inv.m_bFullyLoaded === true, lastAssetID: inv.m_ulLastAssetID == null ? "" : String(inv.m_ulLastAssetID) };
  };
  const commitSteamCacheSnapshot = (snapshot) => {
    const committed = commitVerifiedPage({ pageNo: currentInventoryPage() || 0, items: snapshot.items });
    const holdings = Object.create(null);
    Object.keys(snapshot.holdings).forEach(name => { holdings[name] = { ...snapshot.holdings[name] }; });
    return { ...committed, holdings, quantity: Object.values(holdings).reduce((n,h) => n + (Number(h.qty) || 0), 0) };
  };
  const awaitSteamNativeLoad = (inv) => new Promise((resolve, reject) => {
    let request; try { request = inv.LoadMoreAssets(); } catch (e) { reject(e); return; }
    if (request && typeof request.done === "function" && typeof request.fail === "function") request.done(resolve).fail(e => reject(e || new Error("Steam native inventory loader failed")));
    else if (request && typeof request.then === "function") request.then(resolve, reject);
    else reject(new Error("Steam's native loader did not return a supported promise"));
  });
  const captureInventoryPage = () => {
    const inv = window.g_ActiveInventory || {}, assets = inv.m_rgAssets || {};
    const tiles = pageTiles(), items = [], unresolved = [];
    tiles.forEach((el) => {
      const m = /^(\d+)_(\d+)_(\d+)$/.exec(el.id || "");
      let asset = el.rgItem;
      if (!asset && m) asset = assets[m[3]];
      const d = asset && (asset.description || asset);
      const assetid = String((asset && (asset.assetid || asset.id)) || (m && m[3]) || "");
      if (!assetid || !d || !d.market_hash_name) { unresolved.push(el.id || assetid || "unknown tile"); return; }
      items.push({ assetid, appid: String((d && d.appid) || (asset && asset.appid) || (m && m[1]) || inv.appid || 753),
        contextid: String((asset && asset.contextid) || (m && m[2]) || inv.contextid || 6), name: d.market_hash_name,
        label: d.name || d.market_hash_name, marketable: !!d.marketable, tradable: !!d.tradable });
    });
    const unique = new Map(); items.forEach((it) => unique.set(it.appid + ":" + it.contextid + ":" + it.assetid, it));
    return { label: pageLabel(), pageNo: currentInventoryPage(), tileCount: tiles.length, items: [...unique.values()], unresolved };
  };
  // A page is processable only after every rendered tile has a description and
  // the exact page snapshot has remained unchanged for several observations.
  // A fixed sleep alone is not evidence that Steam has finished populating it.
  const waitForStableInventoryPage = async (expectedPage, timeout = 30000) => {
    const deadline = Date.now() + timeout;
    let lastKey = "", stableSince = 0, stableSamples = 0, lastSnapshot = null;
    while (Date.now() < deadline) {
      if (S.scanState.stop) return { ok: false, cancelled: true, snapshot: lastSnapshot, reason: "Stop requested while waiting for Steam inventory descriptions" };
      if (!(await sleepScanInterruptible(500))) return { ok: false, cancelled: true, snapshot: lastSnapshot, reason: "Stop requested while waiting for Steam inventory descriptions" };
      const snap = captureInventoryPage();
      const pageNo = snap.pageNo || expectedPage;
      const key = snap.label + "|" + snap.items.map(x => x.appid + ":" + x.contextid + ":" + x.assetid + ":" + x.name).join("|") + "|unresolved:" + snap.unresolved.length + "|tiles:" + snap.tileCount;
      const complete = snap.tileCount > 0 && snap.unresolved.length === 0 && snap.items.length === snap.tileCount && pageNo === expectedPage;
      if (complete && key === lastKey) { stableSamples++; if (!stableSince) stableSince = Date.now(); }
      else { stableSamples = 0; stableSince = complete ? Date.now() : 0; }
      lastKey = key; lastSnapshot = snap;
      if (complete && stableSamples >= 3 && Date.now() - stableSince >= 1500) return { ok: true, snapshot: snap };
    }
    return { ok: false, snapshot: lastSnapshot, reason: !lastSnapshot || !lastSnapshot.tileCount ? "Steam did not render inventory tiles before the timeout" : lastSnapshot.unresolved.length ? (lastSnapshot.unresolved.length + " of " + lastSnapshot.tileCount + " inventory descriptions were still unavailable") : "Inventory page did not reach a stable, complete state" };
  };
  const waitPageChange = async (before, timeout) => {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      if (S.scanState.stop) return false;
      if (!(await sleepScanInterruptible(250))) return false;
      const now = pageSignature();
      if (now && now !== before) return true;
    }
    return false;
  };
  const mergePage = (target, page) => Object.keys(page).forEach((name) => {
    const h = page[name], old = target[name];
    if (!old) target[name] = Object.assign({}, h);
    else {
      old.qty += Number(h.qty) || 0;
      old.marketable = old.marketable || h.marketable;
      old.tradable = old.tradable || h.tradable;
    }
  });
  // Unified inventory discovery now collects holdings, catalogue designs and
  // eligible market prices from each verified page in one workflow.
  const DESIGN_CATALOG_KEY = "siteworksKnownCardDesigns_v1";
  const DESIGN_CURSOR_KEY = "siteworksNewDesignDiscoveryCursor_v1";
  const DESIGN_LOG_KEY = "siteworksDiscoveryActivityLog_v1";
  const logDiscovery = (message) => { const entries = LS.get(DESIGN_LOG_KEY, []) || []; entries.unshift({ at: Date.now(), message: String(message) }); LS.set(DESIGN_LOG_KEY, entries.slice(0, 30)); if (S.ui && !S.ui.$(".activitylog").hidden) renderDiscoveryLog(); };
  const renderDiscoveryLog = () => { const el = S.ui && S.ui.$(".activitylog"); if (!el) return; const entries = LS.get(DESIGN_LOG_KEY, []) || []; el.textContent = entries.length ? entries.map(x => new Date(x.at).toLocaleString() + " · " + x.message).join("\n") : "No activity recorded yet."; };
  const updateDiscoveryProgress = (processed, minimum) => {
    if (!S.ui) return;
    const bar = S.ui.$(".scanprogress"), label = S.ui.$(".scanprogresslabel");
    const pct = minimum > 0 ? Math.min(100, (processed / minimum) * 100) : 0;
    bar.value = pct;
    bar.title = minimum > 0 ? processed.toLocaleString() + " / " + minimum.toLocaleString() + " (min)" : "Minimum inventory size not available";
    label.textContent = processed.toLocaleString() + " / " + (minimum > 0 ? minimum.toLocaleString() + " (min)" : "minimum unknown");
  };
  const readDesignCatalog = () => readFiledata().designs;
  const saveDesignCatalog = (catalog) => { const data = readFiledata(); data.designs = catalog; writeFiledata(data); };
  const knownDesigns = () => {
    const known = readDesignCatalog();
    Object.keys(S.data.prices || {}).forEach(n => { known[n] = known[n] || { firstSeenAt: 0, source: "saved-price-data" }; });
    const full = readFullScan();
    if (full && full.holdings) Object.keys(full.holdings).forEach(n => { known[n] = known[n] || { firstSeenAt: 0, source: "inventory-scan" }; });
    return known;
  };
  const commitVerifiedPage = (snapshot) => {
    const catalog = readDesignCatalog(), pageDesigns = Object.create(null), holdingsPage = Object.create(null);
    snapshot.items.forEach((it) => {
      const h = pageDesigns[it.name] || (pageDesigns[it.name] = {
        name: it.name, label: it.label || it.name, qty: 0, appid: it.appid,
        marketable: false, tradable: false
      });
      h.qty += Math.max(1, Number(it.amount) || 1); h.marketable = h.marketable || !!it.marketable; h.tradable = h.tradable || !!it.tradable;
      const owned = holdingsPage[it.name] || (holdingsPage[it.name] = {
        name: it.name, label: it.label || it.name, qty: 0, appid: it.appid,
        contextid: it.contextid, assetid: it.assetid, marketable: !!it.marketable
      });
      owned.qty += Math.max(1, Number(it.amount) || 1);
    });
    const known = knownDesigns(), additions = Object.keys(pageDesigns).filter(n => !known[n]);
    Object.keys(pageDesigns).forEach((name) => {
      const h = pageDesigns[name], old = catalog[name] || {};
      catalog[name] = {
        ...old, name, label: h.label, appid: h.appid || old.appid || "753",
        marketable: h.marketable, tradable: h.tradable,
        firstSeenAt: old.firstSeenAt || Date.now(), lastSeenAt: Date.now(),
        lastSeenPage: snapshot.pageNo, source: "inventory-discovery"
      };
    });
    saveDesignCatalog(catalog);
    return { pageDesigns, holdingsPage, additions };
  };

  // Read only the page Steam has already rendered. No previous/next controls are clicked.
  S.scanSteamInventoryCache = async (inv) => {
    if (S.scanState.running) return;
    const $ = S.ui.$, caps = steamInventoryCapabilities(inv);
    if (!caps.assets || !caps.nativeLoader || !caps.fullyLoadedFlag) {
      S.status("Steam's native webdata loader is not exposed by this page build. The verified DOM fallback will be used.");
      return S.discoverByPageNavigation();
    }
    if (+inv.appid !== +window.g_ActiveInventory?.appid) { S.status("The selected Steam inventory changed. Select it and try again."); return; }
    if (!confirm("Scan this inventory using Steam's own incremental loader?\n\nSite Works observes webdata after each batch, saves verified designs and holdings, and attempts eligible prices separately. Steam controls request size and delay. Stop or any loader error preserves partial results. No automatic retries.")) return;
    S.scanState.running=true; S.scanState.stop=false; $(".newdesigns").disabled=true; $(".scanstop").disabled=false;
    let batches=0, newlyCatalogued=0, failed=false, lastSnapshot=null; const processedIds=new Set(), seenWebAssets=new Map(), seenWebDescriptions=new Map();
    try {
      let snapshot=readSteamWebdata(inv);
      if (!snapshot.supported) throw new Error(snapshot.reason);
      if (snapshot.items.length) {
        const journalResult = await appendWebdataBatch(inv, snapshot, 0, seenWebAssets, seenWebDescriptions, !!inv.m_bFullyLoaded);
        const c=commitSteamCacheSnapshot(snapshot); newlyCatalogued+=c.additions.length; lastSnapshot=snapshot;
        snapshot.items.forEach(it=>processedIds.add(it.appid+":"+it.contextid+":"+it.assetid));
        S.snapshotCaptured=false; S.snapshotCompared=false; S.renderList();
      }
      while (!S.scanState.stop && !inv.m_bFullyLoaded) {
        if (window.g_ActiveInventory!==inv || +window.g_ActiveInventory?.appid!==+inv.appid) throw new Error("Active Steam inventory changed during scan");
        if (inv.m_ActivePromise) {
          $(".scanstatus").textContent="WAITING · Steam inventory request already in progress";
          const until=Date.now()+30000; while(inv.m_ActivePromise && Date.now()<until && !S.scanState.stop) await sleepScan(250);
          if(S.scanState.stop) break; if(inv.m_ActivePromise) throw new Error("Steam's existing request did not settle within 30 seconds"); continue;
        }
        const before=Object.keys(inv.m_rgAssets||{}).length, beforeLast=String(inv.m_ulLastAssetID||"");
        $(".scanstatus").textContent="REQUESTING · Steam native loader · "+before.toLocaleString()+" webdata assets";
        await awaitSteamNativeLoad(inv);
        if(S.scanState.stop) break;
        if(window.g_ActiveInventory!==inv) throw new Error("Active inventory changed while Steam was loading");
        const after=Object.keys(inv.m_rgAssets||{}).length, afterLast=String(inv.m_ulLastAssetID||"");
        if(after<=before && afterLast===beforeLast && !inv.m_bFullyLoaded) throw new Error("Loader completed without webdata growth or continuation progress");
        snapshot=readSteamWebdata(inv); if(!snapshot.supported) throw new Error(snapshot.reason);
        const journalResult = await appendWebdataBatch(inv, snapshot, batches + 1, seenWebAssets, seenWebDescriptions, !!inv.m_bFullyLoaded);
        const c=commitSteamCacheSnapshot(snapshot), fresh=snapshot.items.filter(it=>!processedIds.has(it.appid+":"+it.contextid+":"+it.assetid));
        fresh.forEach(it=>processedIds.add(it.appid+":"+it.contextid+":"+it.assetid));
        newlyCatalogued+=c.additions.length; batches++; lastSnapshot=snapshot;
        saveFullScan({version:3,source:"steam-webdata-journal",complete:false,batches,assetEntries:snapshot.assetCount,
          resolvedAssetEntries:snapshot.items.length,unresolvedAssetEntries:snapshot.unresolved,reportedItems:snapshot.reportedItems,
          uniqueDesigns:Object.keys(snapshot.holdings).length,holdings:snapshot.holdings,updatedAt:Date.now(),lastAssetID:snapshot.lastAssetID});
        S.snapshotCaptured=false; S.snapshotCompared=false; S.renderList();
        const pct=snapshot.reportedItems?Math.min(99,snapshot.assetCount/snapshot.reportedItems*100):0;
        $(".scanprogress").value=pct; $(".scanprogresslabel").textContent=snapshot.assetCount.toLocaleString()+" webdata assets · "+snapshot.unresolved+" unresolved";
        $(".scanstatus").textContent="BATCH "+batches+" SAVED · "+Object.keys(snapshot.holdings).length+" designs · "+snapshot.items.length+" resolved assets";
        logDiscovery("Steam webdata batch "+batches+": "+snapshot.assetCount+" assets, "+c.additions.length+" new designs, "+snapshot.unresolved+" unresolved");
        if(snapshot.unresolved && inv.m_bFullyLoaded) throw new Error(snapshot.unresolved+" assets remain without resolvable descriptions after Steam marked the inventory complete");
      }
      if(inv.m_bFullyLoaded && !S.scanState.stop) {
        const final=readSteamWebdata(inv); if(!final.supported || final.unresolved) throw new Error("Steam reports fully loaded, but webdata descriptions are incomplete");
        await appendWebdataBatch(inv, final, batches + 1, seenWebAssets, seenWebDescriptions, true);
        const c=commitSteamCacheSnapshot(final), full={version:3,complete:true,source:"steam-webdata-journal",batches,
          assetEntries:final.assetCount,resolvedAssetEntries:final.items.length,reportedItems:final.reportedItems,
          uniqueDesigns:Object.keys(final.holdings).length,totalItems:c.quantity,scannedAt:Date.now(),holdings:final.holdings,lastAssetID:final.lastAssetID};
        saveFullScan(full); S.fullScan=full;
        $(".scanprogress").value=100; $(".scanprogresslabel").textContent=final.assetCount.toLocaleString()+" webdata assets · complete";
        $(".scanstatus").textContent="COMPLETE · "+full.uniqueDesigns+" designs · "+full.totalItems+" item quantity";
        S.snapshotCaptured=false; S.snapshotCompared=false; S.renderList();
        S.status("Steam reports the inventory fully loaded. Saved "+full.uniqueDesigns+" designs across "+full.assetEntries+" asset entries ("+full.totalItems+" item quantity), using "+batches+" native batches. No competing inventory requests were issued.");
      } else if(S.scanState.stop) {
        const partial=readSteamWebdata(inv); if(partial.supported) {
          commitSteamCacheSnapshot(partial); saveFullScan({version:3,source:"steam-webdata-journal",complete:false,batches,
            assetEntries:partial.assetCount,resolvedAssetEntries:partial.items.length,unresolvedAssetEntries:partial.unresolved,
            reportedItems:partial.reportedItems,uniqueDesigns:Object.keys(partial.holdings).length,holdings:partial.holdings,
            stoppedAt:Date.now(),lastAssetID:partial.lastAssetID});
          S.status("Stopped safely. Preserved "+Object.keys(partial.holdings).length+" designs and "+partial.assetCount+" webdata assets. Steam fully loaded: "+partial.fullyLoaded+".");
        }
      }
    } catch(e) {
      failed=true; const partial=readSteamWebdata(inv);
      if(partial.supported) { commitSteamCacheSnapshot(partial); saveFullScan({version:3,source:"steam-webdata-journal",complete:false,batches,
        assetEntries:partial.assetCount,resolvedAssetEntries:partial.items.length,unresolvedAssetEntries:partial.unresolved,
        reportedItems:partial.reportedItems,uniqueDesigns:Object.keys(partial.holdings).length,holdings:partial.holdings,
        failedAt:Date.now(),reason:e.message||String(e),lastAssetID:partial.lastAssetID}); }
      $(".scanstatus").textContent="INCOMPLETE · partial webdata preserved";
      S.status("Inventory scan stopped without retry: "+(e.message||e)+". Partial webdata was preserved."); logDiscovery("Steam native scan stopped: "+(e.message||e));
    } finally {
      S.scanState.running=false; $(".newdesigns").disabled=false; $(".scanstop").disabled=true;
      if(lastSnapshot && !failed && !inv.m_bFullyLoaded && !S.scanState.stop) $(".scanstatus").textContent="PAUSED · Steam has not marked webdata fully loaded";
    }
  };

  S.discoverByPageNavigation = async () => {
    if (S.scanState.running) return;
    const invState = readInventoryState();
    if (invState.state === "throttled" && Date.now() < (invState.until || 0)) {
      S.status("Inventory loading cooldown active until " + new Date(invState.until).toLocaleString() + ". No page navigation sent."); return;
    }
    if (invState.state === "throttled") {
      S.status("Inventory cooldown elapsed. Use Synchronise inventory first to verify Steam descriptions."); return;
    }
    const first = document.querySelector("#pagebtn_prev, #pagebtn_previous"), next = document.querySelector("#pagebtn_next");
    if (!first || !next) { S.status("Steam's inventory page controls were not found. Combined inventory scan is unavailable on this layout."); return; }
    const $ = S.ui.$, cursor = LS.get(DESIGN_CURSOR_KEY, { nextPage: 1, processedAssetIds: [] }) || { nextPage: 1, processedAssetIds: [] };
    if (!confirm("Scan Steam inventory pages for designs and item quantities, then attempt eligible market-price lookups for each verified page. Each page must finish loading and remain stable before it is committed. Design capture and price capture keep separate status and cooldowns. Click again to resume.")) return;
    S.scanState.running = true; S.scanState.stop = false;
    $(".newdesigns").disabled = true; $(".scanstop").disabled = false;
    let pages = 0, discovered = 0, failed = false, pendingResumePage = null,
      processedAssetIds = new Set(Array.isArray(cursor.processedAssetIds) ? cursor.processedAssetIds : []),
      aggregateHoldings = Object.create(null);
    let pageNo = Math.max(1, Number(cursor.nextPage) || 1);
    const startedAtPageOne = pageNo === 1;
    const totalPagesAtStart = totalInventoryPages();
    const completionThreshold = totalPagesAtStart ? (25 * totalPagesAtStart) - 24 : 0;
    const processedCount = () => processedAssetIds.size;
    try {
      // Reposition to page one, then replay the persisted cursor. Navigation
      // waits for page identity to change; content is validated separately.
      let guard = 0;
      while (!S.scanState.stop && guard++ < 2000) {
        const prev = document.querySelector("#pagebtn_prev, #pagebtn_previous");
        if (!prev || prev.classList.contains("disabled")) break;
        const before = pageSignature(); prev.click();
        if (!(await waitPageChange(before, 15000))) { if (S.scanState.stop) break; failed = true; $(".scanstatus").textContent = "INCOMPLETE · Could not navigate to page one"; S.status("Could not verify navigation to the first inventory page. No discovery result recorded."); break; }
        if (!(await sleepScanInterruptible(4000))) break;
      }
      if (!failed && !S.scanState.stop) {
        for (let pnum = 1; pnum < pageNo; pnum++) {
          const advance = document.querySelector("#pagebtn_next");
          if (!advance || advance.classList.contains("disabled")) { failed = true; S.status("Could not restore saved discovery position: Steam ended before page " + pageNo + ". No page result was inferred."); break; }
          const before = pageSignature(); advance.click();
          if (!(await waitPageChange(before, 15000))) { if (S.scanState.stop) break; failed = true; S.status("Could not restore saved discovery position at page " + (pnum + 1) + ". No discovery result recorded."); break; }
          if (!(await sleepScanInterruptible(4000))) break;
        }
      }
      while (!failed && !S.scanState.stop && pageNo <= 2000) {
        $(".scanstatus").textContent = "Loading page " + pageNo + " · waiting for Steam descriptions to stabilise";
        const settled = await waitForStableInventoryPage(pageNo, 30000);
        if (!settled.ok && settled.cancelled) break;
        if (!settled.ok) {
          failed = true;
          $(".scanstatus").textContent = "⚠️ INCOMPLETE · Page " + pageNo + " not fully loaded · " + settled.reason;
          logDiscovery("Page " + pageNo + " not inspected: " + settled.reason);
          S.status("Page " + pageNo + " was not fully loaded: " + settled.reason + ". No zero-new-design result was recorded and the resume position remains on this page.");
          break;
        }
        const snapshot = settled.snapshot, pageAssetIds = snapshot.items.map(it => it.appid + ":" + it.contextid + ":" + it.assetid);
        // One verified page updates the shared inventory dataset; market prices are refreshed separately.
        const committed = commitVerifiedPage(snapshot), pageDesigns = committed.pageDesigns, additions = committed.additions;
        Object.keys(committed.holdingsPage).forEach(name => {
          const h = committed.holdingsPage[name], old = aggregateHoldings[name];
          if (!old) aggregateHoldings[name] = { ...h };
          else old.qty += h.qty;
        });
        pageAssetIds.forEach(id => processedAssetIds.add(id));
        discovered += additions.length; pages++;
        const processedItems = processedCount(), minimum = totalInventoryPages() ? (25 * totalInventoryPages()) - 24 : completionThreshold;
        updateDiscoveryProgress(processedItems, minimum);
        S.snapshotCaptured = false; S.snapshotCompared = false; S.renderList();
        $(".scanstatus").textContent = "Page " + pageNo + " saved · " + Object.keys(pageDesigns).length + " designs · " + snapshot.items.length + " items · updating filedata";
        S.renderList();
        const advance = document.querySelector("#pagebtn_next"), isLastPage = !advance || advance.classList.contains("disabled");
        LS.set(DESIGN_CURSOR_KEY, { nextPage: isLastPage ? 1 : pageNo + 1, lastSuccessfulPage: pageNo,
          processedAssetIds: [...processedAssetIds], processedItems, completionThreshold: minimum, updatedAt: Date.now(),
          completedAt: isLastPage ? Date.now() : undefined });
        if (additions.length) logDiscovery("Page " + pageNo + ": added " + additions.length + " new design(s) from " + snapshot.items.length + " verified items");
        if (!additions.length) {
          const thresholdReached = minimum > 0 && processedItems >= minimum;
          if (thresholdReached || isLastPage) {
            $(".scanstatus").textContent = "⚠️ PAUSED · 0 new designs on page " + pageNo + " · " + processedItems.toLocaleString() + "/" + (minimum ? minimum.toLocaleString() + " (min)" : "unknown minimum");
            S.status("Page " + pageNo + " was fully loaded and contained zero new designs. " + (thresholdReached ? "The minimum inventory threshold has been reached." : "Steam's final page was reached.") + " " + discovered + " new designs saved during this run.");
            break;
          }
          $(".scanstatus").textContent = "⚠️ No new designs on page " + pageNo + " · continuing inventory scan · " + processedItems.toLocaleString() + "/" + (minimum ? minimum.toLocaleString() + " (min)" : "unknown minimum");
          S.status("Page " + pageNo + " was fully loaded and contained no new designs, but the minimum inventory threshold has not been reached. Continuing.");
        } else {
          $(".scanstatus").textContent = "Discovering · page " + pageNo + " · " + discovered + " new design(s) saved · " + processedItems.toLocaleString() + "/" + (minimum ? minimum.toLocaleString() + " (min)" : "unknown minimum");
          S.status("Combined scan: page " + pageNo + " added " + additions.length + " new design(s); " + discovered + " saved this run.");
        }
        if (isLastPage) {
          if (startedAtPageOne) {
          const full = { version: 1, complete: true, pages: pageNo, uniqueDesigns: Object.keys(aggregateHoldings).length,
            totalItems: Object.values(aggregateHoldings).reduce((n,h)=>n+h.qty,0), scannedAt: Date.now(), holdings: aggregateHoldings };
          saveFullScan(full); S.fullScan = full;
          S.snapshotCaptured = false; S.snapshotCompared = false; S.renderList();
          } else {
            $(".scanstatus").textContent = "DISCOVERY COMPLETE · resumed from page " + cursor.nextPage + " · full holdings total not recalculated";
          }
          $(".scanstatus").textContent = (startedAtPageOne ? "COMPLETE" : "DISCOVERY COMPLETE") + " · " + discovered + " new design(s) saved across " + pages + " verified page(s)";
          logDiscovery("Reached Steam's final page after verifying " + pages + " page(s)");
          break;
        }
        if (S.scanState.stop) break;
        const before = pageSignature(); pendingResumePage = pageNo + 1; advance.click();
        if (!(await waitPageChange(before, 15000))) {
          if (S.scanState.stop) break;
          failed = true; $(".scanstatus").textContent = "⚠️ INCOMPLETE · Navigation to page " + (pageNo + 1) + " could not be verified";
          S.status("Navigation to page " + (pageNo + 1) + " could not be verified. Saved discoveries retained; resume remains at that page."); break;
        }
        pageNo++; pendingResumePage = null;
        LS.set(DESIGN_CURSOR_KEY, { nextPage: pageNo, lastSuccessfulPage: pageNo - 1, processedAssetIds: [...processedAssetIds], processedItems: processedCount(), completionThreshold: minimum, updatedAt: Date.now() });
        if (!(await sleepScanInterruptible(4000))) break;
      }
      if (S.scanState.stop || failed) {
        saveFullScan({ version: 1, complete: false, pages, uniqueDesigns: Object.keys(aggregateHoldings).length,
          totalItems: Object.values(aggregateHoldings).reduce((n,h)=>n+h.qty,0), holdings: aggregateHoldings,
          stoppedAt: Date.now(), reason: failed ? "load-failure" : "user-stopped" });
      }
      if (S.scanState.stop) {
        // Stop is honoured at a page boundary. If the current page was already
        // validated and committed, resume on the following page; if Stop was
        // requested during navigation, resume on the not-yet-committed page.
        const savedCursor = LS.get(DESIGN_CURSOR_KEY, {}) || {};
        const lastSuccessfulPage = Number(savedCursor.lastSuccessfulPage) || (pageNo - 1);
        const resumePage = pendingResumePage || (lastSuccessfulPage >= pageNo ? pageNo + 1 : pageNo);
        LS.set(DESIGN_CURSOR_KEY, { ...savedCursor, nextPage: resumePage, lastSuccessfulPage, processedAssetIds: [...processedAssetIds],
          processedItems: processedCount(), completionThreshold, stoppedAt: Date.now(),
          lastRun: { pagesVerified: pages, newDesigns: discovered, processedItems: processedCount(), stoppedAt: Date.now(), resumePage } });
        $(".scanstatus").textContent = "STOPPED · " + discovered + " new designs · " + pages +
          " verified pages · resume at page " + resumePage;
        $(".sessionstats").textContent = "Last session: " + pages + " verified pages · " + discovered +
          " new designs saved · " + processedCount().toLocaleString() + " unique inventory items processed · resume page " + resumePage;
        S.status("Combined scan stopped at a safe page boundary. " + discovered + " new designs were saved across " +
          pages + " verified page(s). Resume position: page " + resumePage + ".");
        logDiscovery("User stopped discovery after " + pages + " verified page(s); " + discovered +
          " new designs saved; resume position page " + resumePage);
      }
      if (failed) logDiscovery("Discovery paused on page " + pageNo + "; incomplete page was not committed as zero designs");
    } catch (e) {
      LS.set(DESIGN_CURSOR_KEY, { nextPage: pageNo, lastSuccessfulPage: pageNo - 1, processedAssetIds: [...processedAssetIds], processedItems: processedCount(), completionThreshold, errorAt: Date.now() });
      $(".scanstatus").textContent = "INCOMPLETE · " + discovered + " new design(s) saved · click to resume";
      S.status("Design discovery error: " + (e.message || e) + ". Verified discoveries remain saved; the current page was not marked complete.");
    } finally {
      if (pages > 0) {
        const saved = LS.get(DESIGN_CURSOR_KEY, {}) || {};
        LS.set(DESIGN_CURSOR_KEY, { ...saved, lastRun: { pagesVerified: pages, newDesigns: discovered,
          processedItems: processedCount(), finishedAt: Date.now(), outcome: failed ? "incomplete" : (S.scanState.stop ? "stopped" : "paused-or-complete"),
          resumePage: Number(saved.nextPage) || pageNo } });
      }
      S.scanState.running = false; $(".newdesigns").disabled = false; $(".scanstop").disabled = true;
    }
  };

  S.discoverNewDesigns = async () => {
    if (S.scanState.running) return;
    const inv=window.g_ActiveInventory, caps=steamInventoryCapabilities(inv);
    if(caps.assets && caps.nativeLoader && caps.fullyLoadedFlag) return S.scanSteamInventoryCache(inv);
    return S.discoverByPageNavigation();
  };
  // Rebuild the application-facing filedata projection from captured webdata records.
  S.rebuildFiledataFromWebdataJournal = async () => {
    const journal = await readWebdataJournal(), assets = new Map(), descriptions = new Map();
    journal.batches.forEach(batch => {
      (batch.assets || []).forEach(x => assets.set(String(x.id), x.record));
      (batch.descriptions || []).forEach(x => descriptions.set(String(x.key), x.record));
    });
    const items = [], holdings = Object.create(null); let unresolved = 0;
    assets.forEach((asset, id) => {
      if (!asset || asset.is_currency) return;
      const classid = String(asset.classid || ""), instanceid = String(asset.instanceid || "0");
      const d = descriptions.get(classid + (instanceid !== "0" ? "_" + instanceid : "")) || descriptions.get(classid + "_0") || descriptions.get(classid);
      if (!d || !d.market_hash_name) { unresolved++; return; }
      const item = { assetid: String(asset.assetid || id), appid: String(d.appid || asset.appid || journal.latest?.appid || ""),
        contextid: String(asset.contextid || journal.latest?.contextid || ""), name: d.market_hash_name,
        label: d.name || d.market_hash_name, marketable: !!d.marketable, tradable: !!d.tradable,
        amount: Math.max(1, Number(asset.amount) || 1) };
      items.push(item);
      const h = holdings[item.name] || (holdings[item.name] = { name:item.name,label:item.label,qty:0,appid:item.appid,
        contextid:item.contextid,assetid:item.assetid,marketable:false,tradable:false });
      h.qty += item.amount; h.marketable = h.marketable || item.marketable; h.tradable = h.tradable || item.tradable;
    });
    const snapshot = { supported:true, items, holdings, unresolved, assetCount:assets.size,
      reportedItems:Number(journal.latest?.reportedItems)||0, lastAssetID:"", fullyLoaded:!!journal.latest?.complete };
    commitSteamCacheSnapshot(snapshot);
    const totalItems = Object.values(holdings).reduce((n,h)=>n+(Number(h.qty)||0),0);
    saveFullScan({ version:3, source:"steam-webdata-journal-rebuild", complete:!!journal.latest?.complete && unresolved===0,
      assetEntries:assets.size, resolvedAssetEntries:items.length, unresolvedAssetEntries:unresolved,
      reportedItems:snapshot.reportedItems, uniqueDesigns:Object.keys(holdings).length, totalItems, holdings,
      rebuiltAt:Date.now(), journalBatches:journal.batches.length });
    S.snapshotCaptured=false; S.snapshotCompared=false; if(S.ui) S.renderList();
    return { batches:journal.batches.length, assets:assets.size, descriptions:descriptions.size,
      designs:Object.keys(holdings).length, items:totalItems, unresolved, complete:!!journal.latest?.complete && unresolved===0 };
  };

  S.updatePricePanel = (run) => {
    if (!S.ui) return;
    const prices = S.data.prices || {}, names = Object.keys(S.held || {});
    const priceable = names.filter(n => S.held[n] && (S.held[n].marketable || S.held[n].ownership === "discovered" || S.held[n].source === "inventory + catalogue") && /^\d+$/.test(String(S.held[n].appid || "")));
    const cached = priceable.filter(n => lookup(n)).length;
    const missing = priceable.length - cached;
    S.ui.$(".pricestats").textContent = "DESIGNS ELIGIBLE FOR PRICE LOOKUP · " + priceable.length +
      " · SAVED PRICES · " + cached + " · PRICES MISSING · " + missing +
      " · TOTAL CACHE ENTRIES · " + Object.keys(prices).length;
    if (run && !run.done) {
      const pct = run.total ? Math.min(100, (run.index / run.total) * 100) : 0;
      S.ui.$(".pricebar").value = pct;
      S.ui.$(".priceprogresslabel").textContent = "Getting prices · " + run.index + "/" + run.total +
        " · " + run.got + " updated" + (run.miss ? " · " + run.miss + " without a listed price" : "");
    } else if (!S.ui.$(".priceprogresslabel").textContent.startsWith("STOPPING")) {
      S.ui.$(".pricebar").value = 0;
      S.ui.$(".priceprogresslabel").textContent = "Ready · " + cached + " saved / " + priceable.length + " priceable designs";
    }
  };

  S.renderList = () => {
    const $ = S.ui.$, mode = $(".sort").value, hide = $(".hide").checked;
    const ownedHoldings = holdings();
    const intelligence = window.SiteWorksInventory;
    const previousSnapshot = LS.get("siteworksInventorySnapshot", null);
    // Only actual inventory holdings feed snapshots and valuation. The visible
    // price list is a union of owned items, discovered designs and saved-price names.
    const currentSnapshot = Object.fromEntries(Object.entries(ownedHoldings).map(([n,h]) => [n,{qty:h.qty}]));
    const visibleHoldings = Object.create(null);
    Object.keys(ownedHoldings).forEach((n) => {
      visibleHoldings[n] = Object.assign({}, ownedHoldings[n], { ownership: "known", qtyKnown: true, source: "inventory" });
    });
    const catalogue = readDesignCatalog();
    Object.keys(catalogue).forEach((n) => {
      const d = catalogue[n] || {};
      if (!visibleHoldings[n]) visibleHoldings[n] = {
        name: n, label: d.label || d.name || n, qty: null, qtyKnown: false,
        appid: String(d.appid || "753"), contextid: "6", assetid: null,
        // Discovery confirms a Steam inventory design. Older catalogue records
        // stored missing marketability metadata as false; treat that as unknown
        // and allow the harmless read-only price-overview request to decide.
        marketable: true, marketabilityKnown: typeof d.marketable === "boolean" && d.marketable === true,
        ownership: "discovered", source: "design catalogue"
      };
      else {
        visibleHoldings[n].source = "inventory + catalogue";
        visibleHoldings[n].marketable = true;
        visibleHoldings[n].appid = String(visibleHoldings[n].appid || d.appid || "753");
        visibleHoldings[n].marketabilityKnown = typeof d.marketable === "boolean" && d.marketable === true;
      }
    });
    Object.keys(S.data.prices || {}).forEach((n) => {
      if (!visibleHoldings[n]) visibleHoldings[n] = {
        name: n, label: n, qty: null, qtyKnown: false, appid: "", contextid: "6",
        assetid: null, marketable: false, ownership: "unknown", source: "saved price data"
      };
    });
    S.inventoryHeld = ownedHoldings;
    S.held = visibleHoldings;
    if (intelligence && previousSnapshot && !S.snapshotCompared) {
      const delta = intelligence.compareSnapshots(previousSnapshot, currentSnapshot);
      const changes = delta.added.length + delta.removed.length + delta.quantityChanged.length;
      if (changes) toast("Loaded inventory view changes since last comparison: " + delta.added.length + " added, " + delta.removed.length + " removed, " + delta.quantityChanged.length + " quantity changes.");
      S.lastChanges = delta; S.snapshotCompared = true;
    }
    // Capture once per explicit list load/view change, not on every DOM redraw.
    if (!S.snapshotCaptured && Object.keys(currentSnapshot).length) { LS.set("siteworksInventorySnapshot", currentSnapshot); S.snapshotCaptured = true; }
    let rows = Object.keys(S.held).map((n) => {
      const h = S.held[n], c = lookup(n);
      return { name: n, label: h.label || n, qty: h.qty, qtyKnown: h.qtyKnown !== false && h.qty != null,
        ownership: h.ownership || "known", source: h.source || "inventory", appid: h.appid || "", marketable: !!h.marketable, c };
    });
    const total = rows.length, cached = rows.filter((r) => r.c).length;
    const ownedTotal = Object.keys(ownedHoldings).length;
    const val = intelligence ? intelligence.valuation(ownedHoldings, S.data.prices) : {totalMinor:0,pricedDesigns:Object.keys(ownedHoldings).filter(n => lookup(n)).length,unpricedDesigns:Math.max(0,ownedTotal-Object.keys(ownedHoldings).filter(n => lookup(n)).length),quantity:Object.values(ownedHoldings).reduce((a,h)=>a+(Number(h.qty)||0),0)};
    const scan = readFullScan();
    const coverage = scan && scan.complete ? "COMPLETE INVENTORY · WEBdata STREAM FINISHED" : (scan && scan.holdings ? "PARTIAL FILEdata · WEBdata STREAM INCOMPLETE" : "CURRENT WEBdata ONLY");
    const valueScope = scan && scan.complete ? "Full-inventory estimated value" : (scan && scan.holdings ? "Partial-inventory estimated value" : "Current-webdata estimated value");
    $(".summary").textContent = coverage + " · " + valueScope + ": " + (val.totalMinor ? money(walletCur(), val.totalMinor) : "—") +
      " · " + val.pricedDesigns + "/" + ownedTotal + " owned designs priced · " + val.unpricedDesigns + " owned designs unpriced · " + val.quantity + " known owned item instances";
    const explicitCatalog = readDesignCatalog(), priceCache = S.data.prices || {}, discoveryCursor = LS.get(DESIGN_CURSOR_KEY, {}) || {};
    const lastRun = discoveryCursor.lastRun || null;
    const lastRunText = lastRun ? (" · Last discovery: " + (lastRun.pagesVerified || 0) + " verified pages, " +
      (lastRun.newDesigns || 0) + " new designs, " + (lastRun.processedItems || 0).toLocaleString() + " unique items processed") : "";
    $(".datasummary").textContent = "FILEdata · " + Object.keys(explicitCatalog).length + " saved designs · SAVED PRICE DATA · " +
      Object.keys(priceCache).length + " design prices · INVENTORY VIEW · " + total + " designs / " + val.quantity +
       " item instances (" + ((scan && scan.complete) ? "complete webdata stream" : (scan && scan.holdings ? "partial saved webdata" : "current Steam webdata")) + ") · " +
      rows.filter(r => r.ownership === "discovered").length + " discovered-only designs · " +
      rows.filter(r => r.ownership === "unknown").length + " price-only designs" + lastRunText;
    const cursorForDisplay = LS.get(DESIGN_CURSOR_KEY, {}) || {}, lastRunForDisplay = cursorForDisplay.lastRun;
    if (lastRunForDisplay) $(".sessionstats").textContent = "Last session: " + (lastRunForDisplay.pagesVerified || 0) +
      " verified pages · " + (lastRunForDisplay.newDesigns || 0) + " new designs · " +
      (lastRunForDisplay.processedItems || 0).toLocaleString() + " unique items processed · resume page " +
      (lastRunForDisplay.resumePage || cursorForDisplay.nextPage || "unknown");
    const progressItems = Number(cursorForDisplay.processedItems) || 0, progressMinimum = Number(cursorForDisplay.completionThreshold) || 0;
    updateDiscoveryProgress(progressItems, progressMinimum);
    if (hide) rows = rows.filter((r) => r.c);
    const query = $(".search").value.trim().toLocaleLowerCase(), ageFilter = $(".freshness").value;
    if (query) rows = rows.filter((r) => (r.label + " " + r.name).toLocaleLowerCase().includes(query));
    if (ageFilter !== "all") rows = rows.filter((r) => (intelligence ? intelligence.freshness(r.c && r.c.at) : (r.c ? "fresh" : "missing")) === ageFilter);
    const cmpName = (a, b) => a.label.localeCompare(b.label);
    const price = (r) => (r.c ? r.c.p : null), at = (r) => (r.c ? r.c.at : null);
    const nullsLast = (f, dir) => (a, b) => { const x = f(a), y = f(b); if (x == null && y == null) return cmpName(a, b); if (x == null) return 1; if (y == null) return -1; return (x - y) * dir || cmpName(a, b); };
    rows.sort(mode === "pd" ? nullsLast(price, -1) : mode === "pa" ? nullsLast(price, 1) : mode === "ao" ? nullsLast(at, 1) :
              mode === "an" ? nullsLast(at, -1) : mode === "q" ? ((a, b) => {
        if (a.qty == null && b.qty == null) return cmpName(a,b);
        if (a.qty == null) return 1; if (b.qty == null) return -1;
        return b.qty - a.qty || cmpName(a,b);
      }) : cmpName);
    S.shown = rows;
    $(".cnt").textContent = "\u00b7 " + total + " designs · " + cached + " priced · " + (total - cached) + " without prices";
    $("tbody").innerHTML = rows.map((r) => {
      const c = r.c;
      return '<tr class="r" data-n="' + esc(r.name) + '" title="' + esc(r.ownership === "known" ? "Owned inventory item; click to select it" : r.ownership === "discovered" ? "Discovered design; ownership quantity not established" : "Saved-price entry; ownership not established") + '"><td><input type="checkbox"' + (S.ui.ticked.has(r.name) ? " checked" : "") + '></td>' +
        '<td class="n">' + esc(r.label) + '</td><td class="num" title="' + esc(r.ownership === "known" ? "Owned quantity known in the selected inventory scope" : r.ownership === "discovered" ? "Design discovered on a previously inspected page; current quantity is unknown" : "Saved price exists, but ownership is unknown") + '">' + (r.qtyKnown ? r.qty : "—") + '</td>' +
        '<td class="num" style="color:#fff;font-weight:bold">' + (c ? money(c.cur, c.p) : '<span style="color:#56636f">\u2014</span>') + '</td>' +
        '<td style="color:' + (c ? ageColour(c.at) : "#56636f") + '" title="' + (c ? esc(longStamp(c.at) + " (" + ago(c.at) + ")" + (c.src ? " \u2014 " + c.src : "")) : "") + '">' + (c ? shortStamp(c.at) : "no saved price") + '</td>' +
        '<td class="num" title="Highest buy order">' + (c && c.bid ? money(c.bid.cur, c.bid.p) + (intelligence && intelligence.priceSpread(S.data.prices[r.name], S.data.bids[r.name]) != null ? '<small style="display:block;color:#8fa3b5">spread ' + money(c.cur, intelligence.priceSpread(S.data.prices[r.name], S.data.bids[r.name])) + '</small>' : "") : "") + '</td></tr>';
    }).join("") || '<tr><td colspan="6" style="padding:12px">No designs loaded yet \u2014 wait for the inventory to finish loading, then press Reload list.</td></tr>';
    const inventorySummary = S.ui.$(".inventorysummary");
    if (inventorySummary) inventorySummary.textContent =
      rows.length.toLocaleString() + " unique designs listed · " +
      rows.filter(r => r.qtyKnown).reduce((a,r) => a + (Number(r.qty) || 0), 0).toLocaleString() +
      " known individual items · " + rows.filter(r => !r.qtyKnown).length.toLocaleString() +
      " designs with unknown item quantities";
    S.updatePricePanel();
  };
  S.refresh = async (onlyNames) => {
    const $ = S.ui.$, which = $(".which").value, max = Number($(".max").value) || 0;
    let delay = parseInt($(".dl").value, 10); if (isNaN(delay)) delay = 3500; delay = Math.max(2000, Math.min(60000, delay));
    $(".dl").value = String(delay); LS.set("cardShelfPlDelay", delay);
    const cool = getPriceState();
    if (cool.state === "throttled" || cool.state === "blocked") {
      if (cool.until > Date.now()) {
        S.status("Market-price endpoint is paused until " + longStamp(cool.until) +
          ". Inventory webdata and existing filedata remain usable. No price request sent.");
        return;
      }
      // Cooldown elapsed: allow only this explicit user-started enrichment batch.
      savePriceState({ state: "ready", until: 0, blocks: cool.blocks || 0,
        lastCooldownElapsedAt: Date.now(), lastMessage: "Cooldown elapsed; user may start a new price-enrichment batch." });
    }
    if (cool.state === "inconclusive") {
      S.status("Market-price endpoint previously returned an inconclusive response. Inventory synchronisation remains available; inspect the activity log before starting another price batch.");
      return;
    }
    if (!S.shown) S.renderList();
    let list = Array.isArray(onlyNames)
      ? onlyNames.map((name) => {
          const h = S.held[name]; if (!h) return null;
          const c = lookup(name);
          return { name, label: h.label || name, qty: h.qty, qtyKnown: h.qtyKnown !== false && h.qty != null,
            ownership: h.ownership || "known", source: h.source || "inventory", appid: h.appid || "",
            marketable: !!h.marketable, c };
        }).filter(Boolean)
      : S.shown.filter((r) => S.held[r.name] &&
          (S.held[r.name].marketable || S.held[r.name].ownership === "discovered" || S.held[r.name].source === "inventory + catalogue") &&
          /^\d+$/.test(String(S.held[r.name].appid || "")));
    if (Array.isArray(onlyNames)) list = list.filter((r) => !r.c && S.held[r.name] &&
      (S.held[r.name].marketable || S.held[r.name].ownership === "discovered" || S.held[r.name].source === "inventory + catalogue") &&
      /^\d+$/.test(String(S.held[r.name].appid || "")));
    else if (which === "ticked") list = list.filter((r) => S.ui.ticked.has(r.name));
    else if (which === "none") list = list.filter((r) => !r.c);
    else if (which === "old") list = list.filter((r) => !r.c || Date.now() - r.c.at > 86400000);
    if (max) list = list.slice(0, max);
    if (!list.length) { S.status(Array.isArray(onlyNames) ? "Page data saved. No eligible designs without a saved price need enrichment." : which === "ticked" ? "No designs are selected. Select eligible designs or choose another enrichment scope." : "No eligible designs with a valid Steam app ID are available in this enrichment scope."); return; }
    const cur = walletCur(), curNum = Number(cur) - 2000;
    const run = S.run = { stop: false, done: false, got: 0, miss: 0, items: [], total: list.length, index: 0 };
    const go = $(".pricego"); go.textContent = "Stop"; go.className = "stop";
    const save = () => {
      // Each successful response is already persisted immediately. This flush
      // keeps the batch boundary explicit without generating Downloads files.
      persist();
      run.items = [];
    };
    let why = "";
    for (let i = 0; i < list.length && !run.stop; i++) {
      const r = list[i], h = S.held[r.name];
      S.status("Refreshing " + (i + 1) + " of " + list.length + ": " + r.label + "\u2026  (" + run.got + " updated" + (run.miss ? ", " + run.miss + " with no price" : "") + ")");
      if (i) { await new Promise((res) => setTimeout(res, delay)); if (run.stop) break; }
      let resp = null;
      try { resp = await fetch("/market/priceoverview/?appid=" + encodeURIComponent(h.appid) + "&currency=" + curNum + "&market_hash_name=" + encodeURIComponent(r.name), { credentials: "same-origin" }); }
      catch (e) {
        why = "the request failed (" + (e.message || e) + ")";
        savePriceState({ state: "inconclusive", until: 0, blocks: cool.blocks || 0, lastProbeAt: Date.now(), lastMessage: why });
        break;
      }
      const j = resp.ok ? await resp.json().catch(() => null) : null;
      const kind = classifyPriceResponse(resp.status, j);
      if (kind !== "valid") {
        const now = Date.now();
        if (kind === "throttled" || kind === "blocked") {
          const blocks = Math.min((cool.blocks || 0) + 1, 6), retry = parseRetryAfter(resp), wait = retry || throttleDuration(blocks), until = now + wait;
          savePriceState({ state: kind === "throttled" ? "throttled" : "blocked", until, blocks, lastStatus: resp.status, lastThrottleAt: now, retryAfterMs: retry, lastMessage: "Price refresh stopped immediately; no further requests will be sent." });
          why = "Steam response indicates throttling or blocking (HTTP " + resp.status + "). Stopped. Cooldown until " + longStamp(until) + ".";
        } else {
          savePriceState({ state: "inconclusive", until: 0, blocks: cool.blocks || 0, lastStatus: resp.status, lastThrottleAt: now, lastMessage: "Unexpected or invalid price response; refresh stopped." });
          why = "Unexpected response (HTTP " + resp.status + "). Stopped to avoid mistaking a block or challenge page for an unpriced card.";
        }
        break;
      }
      const low = j.lowest_price ? pence(j.lowest_price) : null, med = j.median_price ? pence(j.median_price) : null, p = low || med;
      if (!p) { run.miss++; continue; }
      const now = Date.now(), src = low ? "Steam price refresh (inventory page)" : "Steam price refresh (median sale, none listed)";
      S.data.prices[r.name] = [p, cur, now, src];
      S.data.history = S.data.history || {};
      const history = S.data.history[r.name] || (S.data.history[r.name] = []);
      if (!history.length || history[history.length - 1][0] !== p || history[history.length - 1][1] !== cur) history.push([p, cur, now]);
      else history[history.length - 1][2] = now;
      if (history.length > 90) history.splice(0, history.length - 90);
      S.data.savedAt = now; persist();
      run.items.push({ market_hash_name: r.name, appid: h.appid, buyer: p, currency: cur, listings: null, price_text: j.lowest_price || j.median_price, source: src });
      run.got++; S.gen++; draw(); S.renderList();
      if (run.items.length >= 50) save();
    }
    if (!why && run.got) savePriceState({ state: "ready", until: 0, blocks: 0, lastSuccessfulRefreshAt: Date.now() });
    save(); run.done = true; go.textContent = "Enrich prices"; go.className = "pricego";
    S.updatePricePanel(run); S.updateThrottleUI();
    S.status((run.stop ? "Stopped. " : why ? "Stopped: " + why + " " : "Done. ") + run.got + " price(s) updated" + (run.miss ? ", " + run.miss + " valid responses with no listed price" : "") +
      (run.got ? ". Saved locally and projected into shared filedata." : "."));
  };
  if (S.ui.box.style.display === "flex") S.renderList();

  const n = Object.keys(data.prices).length;
  toast("Design & price shelf: button added (bottom-left). " + (n ? n + " saved price(s)" + (data.savedAt ? ", last saved " + longStamp(data.savedAt) : "") + "." :
        "No prices saved yet \u2014 open it and use Load Design & price shelf\u2026 or Refresh.") +
        "\nDate colour: green under 2 days old, amber under 2 weeks, red older.");
})(null);

// ---------------------------------------------------------------------------
// Green "Quick sell" button: for each design on each inventory page, click
// one copy and press Augmented Steam's "Quick sell this for x" button when x is
// over QS_MIN_PRICE (0.14 = 14p), then turn the page. Click it again to stop.
// Needs the Augmented Steam extension and the full-width page layout.
// ---------------------------------------------------------------------------
(() => {
  if (!/steamcommunity\.com$/.test(location.hostname) || !/\/inventory/.test(location.pathname)) return;
  const CFG = window.__siteWorksConfig || {};
  const QS_MIN_PRICE = Math.max(1, Number(CFG.market && CFG.market.quickSellMinPence) || 14) / 100;
  const QS_MAX_LISTINGS = Math.max(1, Math.min(500, Math.round(Number(CFG.safety && CFG.safety.maxListingsPerRun) || 20)));
  const REQUEST_DELAY = Math.max(4000, Math.round(Number(CFG.safety && CFG.safety.requestIntervalMs) || 4000));
  const DELAY = { afterSelect: REQUEST_DELAY, afterSell: REQUEST_DELAY, afterPage: REQUEST_DELAY, buttonTimeout: 10000 };

  const old = document.getElementById("cs-qs-btn"); if (old) old.remove();
  const btn = document.createElement("button");
  btn.id = "cs-qs-btn";
  btn.style.cssText = "position:fixed;left:170px;bottom:16px;z-index:2147483600;background:#5c7e10;color:#fff;border:0;border-radius:6px;" +
    "padding:8px 12px;font:bold 13px Arial,sans-serif;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.5)";
  const idleText = "Quick sell over " + Math.round(QS_MIN_PRICE * 100) + "p";
  btn.textContent = idleText;
  document.body.appendChild(btn);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms + Math.random() * 400));
  const tick = () => new Promise((r) => setTimeout(r, 250));
  const visible = (el) => !!el && el.offsetParent !== null;
  const waitFor = async (fn, timeout) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const v = fn(); if (v) return v; await tick(); } return null; };
  const panel = () => [...document.querySelectorAll("#iteminfo0, #iteminfo1")].find(visible);
  const panelName = () => { const p = panel(), n = p && p.querySelector(".hover_item_name, [id$='_item_name']"); return n ? n.textContent.trim() : ""; };
  const findQuickSell = () => {
    const p = panel(); if (!p) return null;
    // Prefer the Steam Quick Sell userscript's button (.qs-btn). It is disabled while it works out
    // its price, so wait for it. When that script is running, never fall back to Augmented Steam.
    const ours = p.querySelector(".qs-btn");
    if (ours || window.__quickSell2) {
      return ours && !ours.disabled && /quick sell this for/i.test(ours.textContent) && visible(ours) ? ours : null;
    }
    return [...p.querySelectorAll("a, button, span")].find((b) => /quick sell this for/i.test(b.textContent) && visible(b) && !b.querySelector("a, button")) || null;
  };
  const parsePrice = (text) => { const nums = text.replace(/\s/g, "").match(/\d+(?:[.,]\d+)?/g); return nums ? parseFloat(nums[nums.length - 1].replace(",", ".")) : NaN; };
  const pageItems = () => { const pg = [...document.querySelectorAll(".inventory_page")].find(visible); return pg ? [...pg.querySelectorAll(".itemHolder .item")].filter(visible) : []; };
  const designKey = (item) => { const img = item.querySelector("img"); return img ? img.src.split("?")[0].replace(/\/\d+fx?\d*f?$/, "") : item.id; };

  let running = false;
  window.stopQuickSell = false;

  btn.onclick = async () => {
    if (running) { window.stopQuickSell = true; btn.textContent = "Stopping\u2026"; return; }
    if (window.matchMedia("(max-width: 910px)").matches) {
      alert("The page is too narrow, so Steam is using its mobile layout and the Quick sell button won't appear.\n\nUndock DevTools (\u22ee \u2192 Dock side \u2192 Undock) or widen the window, then click again.");
      return;
    }
    if (!confirm("Quick sell up to " + QS_MAX_LISTINGS + " card designs whose Quick sell price is over " + Math.round(QS_MIN_PRICE * 100) + "p?\n\n" +
                 "It works through inventory pages, one copy per design. Minimum request interval: " + REQUEST_DELAY + "ms.\n" +
                 "Click the button again to stop.")) return;
    running = true; window.stopQuickSell = false;
    btn.style.background = "#a33";
    const seen = new Set();
    let sold = 0, skipped = 0, noBtn = 0;
    const show = (pg) => { btn.textContent = "Stop quick sell \u00b7 page " + pg + " \u00b7 sold " + sold; };
    try {
      for (let pg = 1; pg <= 1000 && !window.stopQuickSell && sold < QS_MAX_LISTINGS; pg++) {
        show(pg);
        for (const item of pageItems()) {
          if (window.stopQuickSell || sold >= QS_MAX_LISTINGS) break;
          const key = designKey(item);
          if (seen.has(key)) continue;
          seen.add(key);
          const before = panelName();
          (item.querySelector("a") || item).click();
          await sleep(DELAY.afterSelect);
          await waitFor(() => panelName() && panelName() !== before, 5000);
          const name = panelName();
          const qs = await waitFor(findQuickSell, DELAY.buttonTimeout);
          if (!qs) { noBtn++; console.log("  \u2013 " + name + ": no Quick sell button, skipped"); continue; }
          const price = parsePrice(qs.textContent);
          if (price > QS_MIN_PRICE) {
            qs.click(); sold++; show(pg);
            console.log("  \u2713 Quick sold " + name + " for " + price);
            await sleep(DELAY.afterSell);
          } else { skipped++; console.log("  \u2013 " + name + ": " + price + " not over " + QS_MIN_PRICE + ", skipped"); }
        }
        if (sold >= QS_MAX_LISTINGS) break;
        const next = document.querySelector("#pagebtn_next");
        if (!next || next.classList.contains("disabled") || window.stopQuickSell) break;
        const firstBefore = pageItems()[0];
        next.click();
        await sleep(DELAY.afterPage);
        await waitFor(() => pageItems()[0] && pageItems()[0] !== firstBefore, 8000);
      }
    } finally {
      running = false;
      btn.style.background = "#5c7e10"; btn.textContent = idleText;
      const msg = "Quick sell " + (window.stopQuickSell ? "stopped" : "done") + ": sold " + sold + ", skipped " + skipped + " at or under " +
        Math.round(QS_MIN_PRICE * 100) + "p" + (noBtn ? ", " + noBtn + " had no Quick sell button" : "") + ".";
      console.log("%c" + msg, "color:#a4d007;font-weight:bold");
      alert(msg);
    }
  };
})();
