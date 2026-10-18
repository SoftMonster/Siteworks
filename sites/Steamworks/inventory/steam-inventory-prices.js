// Card Shelf prices for your Steam inventory page.
// Site Works runs this on Steam inventory pages (sites\Steamworks\inventory\) once you allow it.
// It can also be pasted into the Console (F12 -> Console) on steamcommunity.com/my/inventory/.
// Adds a "Card Shelf prices" button (bottom-left):
//   - every card with a cached price gets a label with the price and when it was cached
//     (green under 2 days old, amber under 2 weeks, red older); clicking a card shows the
//     full time stamp in the item panel;
//   - the button opens a list of your cards, sortable by cached price, age, quantity or name;
//     click a row to select that card;
//   - "Load Card Shelf prices..." imports CardShelf_prices.json from Card Shelf's data folder;
//   - Refresh asks Steam's public price endpoint for one card at a time with your delay
//     (min 2000 ms), stops at the first "slow down" (429) and pauses 1 h (doubling, max 24 h).
//     New prices are kept in this browser and saved to Downloads as a
//     steam_market_prices_*.json capture that Card Shelf imports.
// The green "Quick sell over 14p" button (Augmented Steam needed) quick-sells one copy of
// each card design whose Quick sell price is over 14p, page by page. Click it again to stop.
// The cache lives in this browser (localStorage for steamcommunity.com), so it is still
// there next time you paste the script.
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
  if (!/steamcommunity\.com$/.test(location.hostname) || !/\/inventory/.test(location.pathname)) { console.info("Card Shelf prices: not a steamcommunity.com inventory page, nothing added."); return; }
  const CACHE = "cardShelfInvCache";
  const persist = () => { try { localStorage.setItem(CACHE, JSON.stringify(S.data)); } catch (e) { console.warn("Card Shelf: could not save the price cache", e); } };
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
      el.title = "Card Shelf cached price: " + money(c.cur, c.p) + " at " + longStamp(c.at) + " (" + ago(c.at) + ")" +
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
        const t = document.createElement("span"); t.textContent = "  \u00b7  cached " + longStamp(at) + " (" + ago(at) + ")" + (extra || "");
        t.style.color = ageColour(at); row.append(t); box.append(row);
      };
      const head = document.createElement("div"); head.textContent = "Card Shelf cached price"; head.style.cssText = "color:#66c0f4;font-weight:bold";
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

  // ---------- v1.5: sortable price list + refreshing the cache ----------
  // Lists the cards in the inventory Steam has loaded (one row per card), with
  // the cached price and time stamp, sortable. Refresh asks Steam's public
  // /market/priceoverview/ for one card at a time - the same request as Card
  // Shelf's Refresh prices - with your Delay between requests; the first 429
  // ("slow down") stops it and starts a cool-down (1 h, doubling, max 24 h).
  // New prices update the labels at once and are saved to Downloads as a
  // steam_market_prices_*.json capture, which Card Shelf imports.
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const LS = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
               set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
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
  const holdings = () => {
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
      "#cs-pl .hd{padding:10px 12px;border-bottom:1px solid #2a475e}#cs-pl .hd b.t{color:#fff;font-size:14px}" +
      "#cs-pl select,#cs-pl input[type=text]{background:#0e1620;color:#c6d4df;border:1px solid #2a475e;border-radius:3px;padding:2px 4px;font-size:12px}" +
      "#cs-pl button{background:#2a475e;color:#fff;border:0;border-radius:3px;padding:4px 10px;cursor:pointer;font-size:12px}#cs-pl button.go{background:#5c7e10}#cs-pl button.stop{background:#a33}" +
      "#cs-pl .row{margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}" +
      "#cs-pl .bd{flex:1;overflow:auto}#cs-pl table{width:100%;border-collapse:collapse}" +
      "#cs-pl th{position:sticky;top:0;background:#1b2838;color:#8fa3b5;text-align:left;padding:5px 6px;cursor:pointer;user-select:none;white-space:nowrap}" +
      "#cs-pl td{color:#c6d4df;padding:4px 6px;border-top:1px solid #1f2f40;white-space:nowrap}#cs-pl td.n{white-space:normal}" +
      "#cs-pl tr.r:hover td{background:#1f3044;cursor:pointer}#cs-pl .num{text-align:right}#cs-pl .st{padding:6px 12px;border-top:1px solid #2a475e;min-height:16px}";
    document.head.appendChild(st);
    const btn = document.createElement("button"); btn.id = "cs-pl-btn"; btn.textContent = "Card Shelf prices"; document.body.appendChild(btn);
    const box = document.createElement("div"); box.id = "cs-pl";
    box.innerHTML =
      '<div class="hd"><b class="t">Card Shelf prices</b> <span class="cnt"></span><span style="float:right"><button class="imp" title="Load CardShelf_prices.json (Card Shelf data folder) or cardshelf-prices.json (CardShelfHelper folder). Newer prices win.">Load Card Shelf prices\u2026</button> <button class="rl" title="Re-read the cards Steam has loaded">Reload list</button> <button class="x">Close</button></span>' +
      '<div class="row">Sort <select class="sort"><option value="pd">Cached price: high \u2192 low</option><option value="pa">Cached price: low \u2192 high</option>' +
      '<option value="ao">Cached: oldest first</option><option value="an">Cached: newest first</option><option value="q">Quantity held</option><option value="nm">Name</option></select>' +
      '<label><input type="checkbox" class="hide"> hide cards with no cached price</label></div>' +
      '<div class="row">Refresh <select class="which"><option value="ticked">ticked cards</option><option value="none">cards with no cached price</option>' +
      '<option value="old">cached over a day ago</option><option value="shown">every card listed</option></select>' +
      ' max <select class="max"><option>10</option><option selected>25</option><option>50</option><option>100</option><option value="0">all</option></select>' +
      ' Delay <input type="text" class="dl" size="5"> ms <button class="go">Refresh</button></div></div>' +
      '<div class="bd"><table><thead><tr><th style="width:18px"><input type="checkbox" class="all" title="Tick every card listed"></th>' +
      '<th data-s="nm">Card</th><th data-s="q" class="num">Qty</th><th data-s="pd" class="num">Cached price</th><th data-s="ao">Cached at</th><th class="num">Buy order</th></tr></thead><tbody></tbody></table></div>' +
      '<div class="st"></div>';
    document.body.appendChild(box);
    const $ = (sel) => box.querySelector(sel);
    S.ui = { btn, box, $, ticked: new Set() };
    $(".sort").value = LS.get("cardShelfPlSort", "pd");
    $(".hide").checked = !!LS.get("cardShelfPlHide", false);
    $(".dl").value = String(LS.get("cardShelfPlDelay", 3500));
    btn.onclick = () => { const open = box.style.display !== "flex"; box.style.display = open ? "flex" : "none"; if (open) S.renderList(); };
    $(".x").onclick = () => { box.style.display = "none"; };
    $(".rl").onclick = () => S.renderList();
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
        S.status("Loaded " + f.name + ": " + added + " price(s) newer than what was cached.");
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
    $(".go").onclick = () => { if (S.run && !S.run.done) { S.run.stop = true; S.status("Stopping after this card\u2026"); } else S.refresh(); };
    window.addEventListener("hashchange", () => { if (box.style.display === "flex") setTimeout(() => S.renderList(), 800); });
  }
  S.status = (t) => { S.ui.$(".st").textContent = t || ""; };
  S.renderList = () => {
    const $ = S.ui.$, mode = $(".sort").value, hide = $(".hide").checked;
    S.held = holdings();
    let rows = Object.keys(S.held).map((n) => { const h = S.held[n], c = lookup(n); return { name: n, label: h.label, qty: h.qty, c }; });
    const total = rows.length, cached = rows.filter((r) => r.c).length;
    if (hide) rows = rows.filter((r) => r.c);
    const cmpName = (a, b) => a.label.localeCompare(b.label);
    const price = (r) => (r.c ? r.c.p : null), at = (r) => (r.c ? r.c.at : null);
    const nullsLast = (f, dir) => (a, b) => { const x = f(a), y = f(b); if (x == null && y == null) return cmpName(a, b); if (x == null) return 1; if (y == null) return -1; return (x - y) * dir || cmpName(a, b); };
    rows.sort(mode === "pd" ? nullsLast(price, -1) : mode === "pa" ? nullsLast(price, 1) : mode === "ao" ? nullsLast(at, 1) :
              mode === "an" ? nullsLast(at, -1) : mode === "q" ? ((a, b) => b.qty - a.qty || cmpName(a, b)) : cmpName);
    S.shown = rows;
    $(".cnt").textContent = "\u00b7 " + total + " cards, " + cached + " with a cached price";
    $("tbody").innerHTML = rows.map((r) => {
      const c = r.c;
      return '<tr class="r" data-n="' + esc(r.name) + '" title="Click to select it in the inventory"><td><input type="checkbox"' + (S.ui.ticked.has(r.name) ? " checked" : "") + '></td>' +
        '<td class="n">' + esc(r.label) + '</td><td class="num">' + r.qty + '</td>' +
        '<td class="num" style="color:#fff;font-weight:bold">' + (c ? money(c.cur, c.p) : '<span style="color:#56636f">\u2014</span>') + '</td>' +
        '<td style="color:' + (c ? ageColour(c.at) : "#56636f") + '" title="' + (c ? esc(longStamp(c.at) + " (" + ago(c.at) + ")" + (c.src ? " \u2014 " + c.src : "")) : "") + '">' + (c ? shortStamp(c.at) : "not cached") + '</td>' +
        '<td class="num">' + (c && c.bid ? money(c.bid.cur, c.bid.p) : "") + '</td></tr>';
    }).join("") || '<tr><td colspan="6" style="padding:12px">No cards loaded yet \u2014 wait for the inventory to finish loading, then press Reload list.</td></tr>';
  };
  S.refresh = async () => {
    const $ = S.ui.$, which = $(".which").value, max = Number($(".max").value) || 0;
    let delay = parseInt($(".dl").value, 10); if (isNaN(delay)) delay = 3500; delay = Math.max(2000, Math.min(60000, delay));
    $(".dl").value = String(delay); LS.set("cardShelfPlDelay", delay);
    const cool = LS.get("cardShelfPriceCool", { until: 0, blocks: 0 });
    if (cool.until > Date.now()) { S.status("Steam asked to slow down. Refresh is paused until " + longStamp(cool.until) + "."); return; }
    if (!S.shown) S.renderList();
    let list = S.shown.filter((r) => S.held[r.name] && S.held[r.name].marketable);
    if (which === "ticked") list = list.filter((r) => S.ui.ticked.has(r.name));
    else if (which === "none") list = list.filter((r) => !r.c);
    else if (which === "old") list = list.filter((r) => !r.c || Date.now() - r.c.at > 86400000);
    if (max) list = list.slice(0, max);
    if (!list.length) { S.status(which === "ticked" ? "Tick some cards first (or choose another Refresh option)." : "Nothing to refresh."); return; }
    const cur = walletCur(), curNum = Number(cur) - 2000;
    const run = S.run = { stop: false, done: false, got: 0, miss: 0, items: [] };
    const go = $(".go"); go.textContent = "Stop"; go.className = "stop";
    const save = () => {
      if (!run.items.length) return;
      const stamp = new Date().toISOString();
      const out = { cardShelfPrices: 1, capturedAt: stamp, page: { url: location.href, title: document.title }, items: run.items };
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: "application/json" }));
      a.download = "steam_market_prices_inventory_refresh_" + stamp.replace(/[:.]/g, "-") + ".json";
      document.body.appendChild(a); a.click(); a.remove(); run.items = [];
    };
    let why = "";
    for (let i = 0; i < list.length && !run.stop; i++) {
      const r = list[i], h = S.held[r.name];
      S.status("Refreshing " + (i + 1) + " of " + list.length + ": " + r.label + "\u2026  (" + run.got + " updated" + (run.miss ? ", " + run.miss + " with no price" : "") + ")");
      if (i) { await new Promise((res) => setTimeout(res, delay)); if (run.stop) break; }
      let resp = null;
      try { resp = await fetch("/market/priceoverview/?appid=" + encodeURIComponent(h.appid) + "&currency=" + curNum + "&market_hash_name=" + encodeURIComponent(r.name), { credentials: "same-origin" }); }
      catch (e) { why = "the request failed (" + (e.message || e) + ")"; break; }
      if (resp.status === 429) {
        const blocks = Math.min((cool.blocks || 0) + 1, 6), wait = Math.min(3600000 * Math.pow(2, blocks - 1), 86400000);
        LS.set("cardShelfPriceCool", { until: Date.now() + wait, blocks });
        why = "Steam said slow down (429). Paused until " + longStamp(Date.now() + wait) + "."; break;
      }
      const j = resp.ok ? await resp.json().catch(() => null) : null;
      const low = j && j.lowest_price ? pence(j.lowest_price) : null, med = j && j.median_price ? pence(j.median_price) : null, p = low || med;
      if (!p) { run.miss++; continue; }
      const now = Date.now(), src = low ? "Steam price refresh (inventory page)" : "Steam price refresh (median sale, none listed)";
      S.data.prices[r.name] = [p, cur, now, src]; S.data.savedAt = now; persist();
      run.items.push({ market_hash_name: r.name, appid: h.appid, buyer: p, currency: cur, listings: null, price_text: j.lowest_price || j.median_price, source: src });
      run.got++; S.gen++; draw(); S.renderList();
      if (run.items.length >= 50) save();
    }
    if (!why && run.got) LS.set("cardShelfPriceCool", { until: 0, blocks: 0 });
    save(); run.done = true; go.textContent = "Refresh"; go.className = "go";
    S.status((run.stop ? "Stopped. " : why ? "Stopped: " + why + " " : "Done. ") + run.got + " price(s) updated" + (run.miss ? ", " + run.miss + " with no price on the Market" : "") +
      (run.got ? ". Saved to Downloads \u2014 Card Shelf imports them (or click \u201ccheck Downloads for price captures\u201d)." : "."));
  };
  if (S.ui.box.style.display === "flex") S.renderList();

  const n = Object.keys(data.prices).length;
  toast("Card Shelf prices: button added (bottom-left). " + (n ? n + " cached price(s)" + (data.savedAt ? ", last saved " + longStamp(data.savedAt) : "") + "." :
        "No prices cached yet \u2014 open it and use Load Card Shelf prices\u2026 or Refresh.") +
        "\nDate colour: green under 2 days old, amber under 2 weeks, red older.");
})(null);

// ---------------------------------------------------------------------------
// Green "Quick sell" button: for each card design on each inventory page, click
// one copy and press Augmented Steam's "Quick sell this for x" button when x is
// over QS_MIN_PRICE (0.14 = 14p), then turn the page. Click it again to stop.
// Needs the Augmented Steam extension and the full-width page layout.
// ---------------------------------------------------------------------------
(() => {
  if (!/steamcommunity\.com$/.test(location.hostname) || !/\/inventory/.test(location.pathname)) return;
  const QS_MIN_PRICE = 0.14;          // sell only when the Quick sell price is OVER this
  const DELAY = { afterSelect: 1500, afterSell: 4000, afterPage: 3000, buttonTimeout: 10000 };

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
    if (!confirm("Quick sell every card design whose Quick sell price is over " + Math.round(QS_MIN_PRICE * 100) + "p?\n\n" +
                 "It works through every page from the one you're on, one copy per design, and lists each on the Market at that price.\n" +
                 "Click the button again to stop.")) return;
    running = true; window.stopQuickSell = false;
    btn.style.background = "#a33";
    const seen = new Set();
    let sold = 0, skipped = 0, noBtn = 0;
    const show = (pg) => { btn.textContent = "Stop quick sell \u00b7 page " + pg + " \u00b7 sold " + sold; };
    try {
      for (let pg = 1; pg <= 1000 && !window.stopQuickSell; pg++) {
        show(pg);
        for (const item of pageItems()) {
          if (window.stopQuickSell) break;
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
