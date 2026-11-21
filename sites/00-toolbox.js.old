// Site Works toolbox - handy tools on every website, for things Brave doesn't do
// itself (some of them are built into Vivaldi, Opera, Firefox or Edge).
//
// Open it with Alt+Shift+K, or right-click > Site Works > Open toolbox. Type to filter,
// arrow keys + Enter to run, Esc to close. It lives in sites\ (every website), so
// Site Works asks before it runs: choose "Do not ask again ... on every website".
//
// Settings marked "remembered" are kept per website in that site's localStorage
// (key __swToolbox) and come back next visit: unblock copy, dark mode, video speed.
// Auto-reload is kept for this tab only (sessionStorage) and stops when you close it.
//
// It has no access to Site Works' own controls; it only changes the page you're on.
(() => {
  "use strict";
  if (window.__swToolbox) return;

  // ------------------------------------------------------------ settings
  const KEY = "__swToolbox", RKEY = "__swToolboxReload";
  const getS = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
  const setS = (patch) => { const s = Object.assign(getS(), patch); Object.keys(s).forEach((k) => { if (s[k] == null || s[k] === false) delete s[k]; });
    try { Object.keys(s).length ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch (e) {} };

  // ------------------------------------------------------------ UI shell (shadow DOM: page styles can't reach it)
  const hostEl = document.createElement("sw-toolbox");
  hostEl.style.cssText = "all:initial;position:fixed;z-index:2147483646;top:0;left:0;width:0;height:0";
  const root = hostEl.attachShadow({ mode: "closed" });
  root.innerHTML = `<style>
    *{box-sizing:border-box;font-family:"Segoe UI",Arial,sans-serif}
    .ov{position:fixed;inset:0;background:rgba(0,0,0,.35);display:none;align-items:flex-start;justify-content:center;padding-top:12vh}
    .ov.on{display:flex}
    .pal{width:min(560px,calc(100vw - 32px));background:#16202d;color:#c6d4df;border:1px solid #2a475e;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.6);overflow:hidden}
    .hd{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #2a475e}
    .hd b{color:#66c0f4;font-size:11px;letter-spacing:.1em}
    input{flex:1;background:#0e1620;color:#fff;border:1px solid #2a475e;border-radius:6px;padding:7px 10px;font-size:14px;outline:none}
    input:focus{border-color:#66c0f4}
    ul{list-style:none;margin:0;padding:4px 0;max-height:56vh;overflow:auto}
    li{display:flex;gap:10px;align-items:baseline;padding:7px 14px;cursor:pointer}
    li.sel{background:#2a475e} li .t{color:#fff;font-size:13px;white-space:nowrap} li .d{color:#7a8a99;font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    li .k{color:#a4d007;font-size:11px;white-space:nowrap}
    .ft{padding:6px 12px;border-top:1px solid #2a475e;color:#7a8a99;font-size:11px}
    .pills{position:fixed;right:12px;bottom:12px;display:flex;flex-direction:column;gap:6px;align-items:flex-end}
    .pill{background:#1b2838;color:#fff;border:1px solid #2a475e;border-radius:14px;padding:4px 10px;font-size:12px;box-shadow:0 3px 12px rgba(0,0,0,.45);display:flex;gap:8px;align-items:center}
    .pill button{background:#2a475e;color:#fff;border:0;border-radius:10px;padding:1px 8px;font-size:11px;cursor:pointer}
    .toast{position:fixed;left:50%;top:16px;transform:translateX(-50%);background:#1b2838;color:#fff;border:1px solid #66c0f4;border-radius:8px;padding:9px 16px;font-size:13px;box-shadow:0 4px 18px rgba(0,0,0,.5);max-width:min(640px,calc(100vw - 32px));white-space:pre-line}
    .pick{position:fixed;pointer-events:none;border:2px solid #66c0f4;background:rgba(102,192,244,.12);border-radius:3px;display:none}
  </style>
  <div class="ov"><div class="pal"><div class="hd"><b>TOOLBOX</b><input placeholder="Type to find a tool…" spellcheck="false"></div><ul></ul>
  <div class="ft">↑↓ choose · Enter run · Esc close · “remembered” tools stay on for this website</div></div></div>
  <div class="pills"></div><div class="pick"></div>`;
  const $ = (s) => root.querySelector(s);
  const ov = $(".ov"), input = $("input"), list = $("ul"), pills = $(".pills"), pickBox = $(".pick");
  const mount = () => { if (!hostEl.isConnected) document.documentElement.appendChild(hostEl); };
  mount();

  let toastT;
  function toast(text) {
    let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; root.appendChild(t); }
    t.textContent = text; clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 3500);
  }
  async function copy(text, what) {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
      document.documentElement.appendChild(ta); ta.select(); ok = document.execCommand("copy"); ta.remove();
    }
    toast(ok ? "Copied " + (what || "") + (text.length > 90 ? "" : ":\n" + text) : "Couldn't copy - the browser blocked the clipboard.");
  }
  const pillMap = {};
  function pill(id, text, actions) {
    if (pillMap[id]) { pillMap[id].remove(); delete pillMap[id]; }
    if (text == null) return;
    const p = document.createElement("div"); p.className = "pill"; p.append(text);
    (actions || []).forEach(([label, fn]) => { const b = document.createElement("button"); b.textContent = label; b.onclick = fn; p.append(b); });
    pills.appendChild(p); pillMap[id] = p;
  }
  function addStyle(id, css) { let s = document.getElementById(id); if (!s) { s = document.createElement("style"); s.id = id; (document.head || document.documentElement).appendChild(s); } s.textContent = css; }
  const delStyle = (id) => { const s = document.getElementById(id); if (s) s.remove(); };

  // ------------------------------------------------------------ tools

  // Auto-reload (Vivaldi / Opera "Reload every…")
  let reloadTimer = null, tickTimer = null;
  function parseEvery(s) {
    const m = /^\s*(\d+(?:\.\d+)?)\s*(s|sec|secs|seconds?|m|min|mins|minutes?|h|hr|hrs|hours?)?\s*$/i.exec(s || ""); if (!m) return 0;
    const n = parseFloat(m[1]), u = (m[2] || "m")[0].toLowerCase();
    return Math.round(n * (u === "s" ? 1000 : u === "h" ? 3600000 : 60000));
  }
  const fmt = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return s >= 3600 ? Math.floor(s / 3600) + "h " + Math.floor(s % 3600 / 60) + "m" : Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  function startReload(ms) {
    stopReload(true);
    try { sessionStorage.setItem(RKEY, String(ms)); } catch (e) {}
    const due = Date.now() + ms;
    const busy = () => { const a = document.activeElement; return a && (a.isContentEditable || /^(input|textarea|select)$/i.test(a.tagName)) && a.type !== "button"; };
    const fire = () => { if (busy() || ov.classList.contains("on")) { pill("reload", "↻ waiting - you're typing", [["stop", () => stopReload()]]); reloadTimer = setTimeout(fire, 10000); return; } location.reload(); };
    reloadTimer = setTimeout(fire, ms);
    const tick = () => pill("reload", "↻ reload in " + fmt(due - Date.now()) + " (every " + fmt(ms).replace(/^0:/, "") + ")", [["stop", () => stopReload()]]);
    tick(); tickTimer = setInterval(tick, 1000);
  }
  function stopReload(quiet) {
    clearTimeout(reloadTimer); clearInterval(tickTimer); reloadTimer = tickTimer = null; pill("reload", null);
    if (!quiet) { try { sessionStorage.removeItem(RKEY); } catch (e) {} toast("Auto-reload stopped."); }
  }

  // Unblock copy / right-click / selecting text (Firefox can do this with a setting)
  const BLOCKED = ["copy", "cut", "paste", "contextmenu", "selectstart", "dragstart", "beforecopy"];
  const stopper = (e) => { e.stopImmediatePropagation(); };
  let unblocked = false;
  function setUnblock(on) {
    unblocked = on;
    BLOCKED.forEach((t) => { window.removeEventListener(t, stopper, true); if (on) window.addEventListener(t, stopper, true); });
    if (on) { addStyle("sw-tb-unblock", "*,*::before,*::after{-webkit-user-select:text!important;user-select:text!important}"); ["oncopy", "oncut", "onpaste", "oncontextmenu", "onselectstart"].forEach((p) => { try { document[p] = null; if (document.body) document.body[p] = null; } catch (e) {} }); }
    else delStyle("sw-tb-unblock");
    pill("unblock", on ? "✂ copy & right-click unblocked" : null, on ? [["off", () => { setUnblock(false); setS({ unblock: false }); }]] : null);
  }

  // Dark mode for this site
  function setDark(on) {
    if (on) addStyle("sw-tb-dark", "html{filter:invert(.92) hue-rotate(180deg)!important;background:#fff!important}" +
      "img,video,picture,canvas,svg image,iframe,[style*='background-image'],embed,object{filter:invert(1) hue-rotate(180deg)!important}");
    else delStyle("sw-tb-dark");
  }

  // Video speed (beyond Brave's menu)
  let speed = 0;
  function videos() { return [...document.querySelectorAll("video")]; }
  function applySpeed() { if (!speed) return; videos().forEach((v) => { if (v.playbackRate !== speed) v.playbackRate = speed; }); }
  function setSpeed(x) {
    speed = x && x !== 1 ? x : 0; applySpeed();
    if (!speed) videos().forEach((v) => { v.playbackRate = 1; });
    pill("speed", speed ? "▶ video " + speed + "×" : null, speed ? [["−", () => setSpeed(Math.max(0.25, +(speed - 0.25).toFixed(2)))], ["+", () => setSpeed(Math.min(16, +(speed + 0.25).toFixed(2)))], ["1×", () => setSpeed(1)]] : null);
    setS({ speed: speed || null });
  }
  document.addEventListener("ratechange", (e) => { if (speed && e.target.tagName === "VIDEO" && e.target.playbackRate !== speed) setTimeout(applySpeed, 0); }, true);
  document.addEventListener("play", (e) => { if (speed && e.target.tagName === "VIDEO") e.target.playbackRate = speed; }, true);

  async function pip() {
    const v = videos().filter((x) => x.readyState > 0).sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
    if (!v) { toast("No video on this page."); return; }
    try { if (document.pictureInPictureElement) await document.exitPictureInPicture(); else { v.disablePictureInPicture = false; await v.requestPictureInPicture(); } }
    catch (e) { toast("Picture-in-picture failed: " + e.message); }
  }

  // Reveal passwords
  let revealed = [];
  function togglePasswords() {
    if (revealed.length) { revealed.forEach((i) => { i.type = "password"; }); toast("Passwords hidden again."); revealed = []; pill("pw", null); return; }
    revealed = [...document.querySelectorAll("input[type=password]")]; revealed.forEach((i) => { i.type = "text"; });
    if (!revealed.length) { toast("No password fields here."); return; }
    pill("pw", "👁 " + revealed.length + " password field(s) shown", [["hide", togglePasswords]]);
  }

  // Edit page text
  function toggleEdit() {
    const on = document.designMode !== "on"; document.designMode = on ? "on" : "off";
    pill("edit", on ? "✎ editing page text" : null, on ? [["done", toggleEdit]] : null);
  }

  // Remove sticky headers, cookie walls and overlays
  function unstick() {
    let n = 0;
    document.querySelectorAll("body *").forEach((e) => {
      if (e === hostEl) return;
      const cs = getComputedStyle(e);
      if ((cs.position === "fixed" || cs.position === "sticky") && cs.display !== "none") { e.style.setProperty("display", "none", "important"); n++; }
    });
    [document.documentElement, document.body].forEach((e) => { if (e) { e.style.setProperty("overflow", "auto", "important"); e.style.setProperty("position", "static", "important"); } });
    toast(n ? "Removed " + n + " sticky or floating element(s). Reload to bring them back." : "Nothing sticky found.");
  }

  // Tables -> spreadsheet
  const cellText = (c) => c.innerText.replace(/\s+/g, " ").trim();
  function tableRows(t) { return [...t.rows].map((r) => [...r.cells].map(cellText)); }
  const tsv = (rows) => rows.map((r) => r.map((c) => c.replace(/\t/g, " ")).join("\t")).join("\n");
  const csv = (rows) => rows.map((r) => r.map((c) => /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c).join(",")).join("\r\n");
  function pickTable(then) {
    const tables = [...document.querySelectorAll("table")].filter((t) => t.rows.length && t.offsetParent !== null);
    if (!tables.length) { toast("No tables on this page."); return; }
    if (tables.length === 1) { then(tables[0]); return; }
    toast("Click the table you want (Esc to cancel).");
    const move = (e) => {
      const t = e.target.closest && e.target.closest("table"); if (!t) { pickBox.style.display = "none"; return; }
      const r = t.getBoundingClientRect(); Object.assign(pickBox.style, { display: "block", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
    };
    const done = () => { document.removeEventListener("mousemove", move, true); document.removeEventListener("click", click, true); document.removeEventListener("keydown", esc, true); pickBox.style.display = "none"; };
    const click = (e) => { const t = e.target.closest && e.target.closest("table"); if (!t) return; e.preventDefault(); e.stopPropagation(); done(); then(t); };
    const esc = (e) => { if (e.key === "Escape") { done(); toast("Cancelled."); } };
    document.addEventListener("mousemove", move, true); document.addEventListener("click", click, true); document.addEventListener("keydown", esc, true);
  }
  function downloadText(name, text, type) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + text], { type })); a.download = name;
    document.documentElement.appendChild(a); a.click(); a.remove();
  }

  // Links, URLs, text
  const TRACK = /^(utm_\w+|fbclid|gclid|dclid|gbraid|wbraid|msclkid|mc_cid|mc_eid|igshid|yclid|_hsenc|_hsmi|mkt_tok|ref_src|ref_url|si|spm|vero_id|oly_\w+|wickedid)$/i;
  function cleanUrl(u) { try { const x = new URL(u); [...x.searchParams.keys()].forEach((k) => { if (TRACK.test(k)) x.searchParams.delete(k); }); return x.toString(); } catch (e) { return u; } }
  const md = (label, url) => "[" + String(label).replace(/\s+/g, " ").trim().replace(/([\[\]])/g, "\\$1") + "](" + url.replace(/\)/g, "%29") + ")";
  function allLinks() {
    const seen = new Set(), out = [];
    document.querySelectorAll("a[href]").forEach((a) => { const h = a.href; if (!/^https?:/.test(h) || seen.has(h)) return; seen.add(h); out.push((a.innerText || a.title || "").replace(/\s+/g, " ").trim() + "\t" + h); });
    return out;
  }
  function counts() {
    const sel = String(getSelection() || "").trim(), text = sel || (document.body ? document.body.innerText : "");
    const words = (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
    toast((sel ? "Selection" : "Whole page") + ": " + words.toLocaleString() + " words · " + text.length.toLocaleString() + " characters · about " + Math.max(1, Math.round(words / 230)) + " min reading");
  }

  // ------------------------------------------------------------ commands
  const ask = (q, def) => { const v = prompt(q, def); return v == null ? null : v.trim(); };
  const tools = [
    { t: "Reload every…", d: "auto-reload this tab on a timer (e.g. 30s, 5m, 1h)", k: "tab", run: () => { const v = ask("Reload this tab every… (e.g. 30s, 5m, 1h)", "5m"); if (v == null) return; const ms = parseEvery(v); if (ms < 5000) { toast("Pick 5 seconds or more."); return; } startReload(ms); toast("This tab reloads every " + v + " until you stop it or close the tab."); } },
    { t: "Stop auto-reload", d: "", show: () => !!reloadTimer, run: () => stopReload() },
    { t: "Unblock copy, right-click & text selection", d: "for sites that stop you copying or right-clicking", k: "remembered", show: () => !unblocked, run: () => { setUnblock(true); setS({ unblock: true }); toast("Copy, right-click and selecting text are unblocked here (remembered for this site)."); } },
    { t: "Stop unblocking copy & right-click", d: "", show: () => unblocked, run: () => { setUnblock(false); setS({ unblock: false }); toast("Back to the site's own behaviour (reload to be sure)."); } },
    { t: "Dark mode for this site", d: "invert the page colours (pictures stay normal)", k: "remembered", run: () => { const on = !getS().dark; setDark(on); setS({ dark: on }); toast(on ? "Dark mode on for " + location.hostname + "." : "Dark mode off."); } },
    { t: "Video speed…", d: "any speed from 0.25× to 16×, kept as you move between videos", k: "remembered", run: () => { const v = ask("Video speed (e.g. 1.5, 2, 3). 1 = normal.", String(speed || 1.5)); if (v == null) return; const x = parseFloat(v); if (!(x >= 0.0625 && x <= 16)) { toast("Pick a speed from 0.25 to 16."); return; } setSpeed(x); } },
    { t: "Picture-in-picture", d: "pop the biggest video out into a floating window", run: pip },
    { t: "Copy page as Markdown link", d: "[Title](address)", run: () => copy(md(document.title || location.href, cleanUrl(location.href)), "Markdown link") },
    { t: "Copy clean address", d: "this page's URL without tracking bits (utm_, fbclid, …)", run: () => copy(cleanUrl(location.href), "address") },
    { t: "Copy selected text as plain text", d: "no formatting, whitespace tidied", run: () => { const s = String(getSelection() || "").replace(/[ \t]+\n/g, "\n").trim(); if (!s) { toast("Select some text first."); return; } copy(s, "text"); } },
    { t: "Copy all links on this page", d: "one per line: text, tab, address", run: () => { const l = allLinks(); if (!l.length) { toast("No links."); return; } copy(l.join("\n"), l.length + " links"); } },
    { t: "Copy a table for Excel / Sheets", d: "click a table; pastes as rows and columns", run: () => pickTable((t) => { const r = tableRows(t); copy(tsv(r), "table (" + r.length + " rows)"); }) },
    { t: "Download a table as CSV", d: "click a table; saves a .csv", run: () => pickTable((t) => { downloadText((document.title || "table").replace(/[\\/:*?"<>|]+/g, "-").slice(0, 60) + ".csv", csv(tableRows(t)), "text/csv"); toast("Saved to Downloads."); }) },
    { t: "Word count", d: "of the selection, or the whole page", run: counts },
    { t: "Remove sticky headers & overlays", d: "hide fixed bars, pop-ups and cookie walls; unlock scrolling", run: unstick },
    { t: "Show / hide passwords", d: "reveal what's typed in password fields on this page", run: togglePasswords },
    { t: "Edit page text", d: "type straight onto the page (for screenshots or notes); not saved", run: toggleEdit },
    { t: "Forget this site's toolbox settings", d: "turn off everything remembered for " + location.hostname, show: () => Object.keys(getS()).length > 0, run: () => { setS({ unblock: false, dark: false, speed: null }); setUnblock(false); setDark(false); setSpeed(1); toast("Toolbox settings for this site cleared."); } },
  ];

  // ------------------------------------------------------------ palette
  let shown = [], sel = 0;
  function render() {
    const q = input.value.trim().toLowerCase();
    shown = tools.filter((x) => (!x.show || x.show()) && (!q || (x.t + " " + x.d).toLowerCase().includes(q) || q.split(/\s+/).every((w) => (x.t + " " + x.d).toLowerCase().includes(w))));
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.textContent = "";
    shown.forEach((x, i) => {
      const li = document.createElement("li"); if (i === sel) li.className = "sel";
      const t = document.createElement("span"); t.className = "t"; t.textContent = x.t;
      const d = document.createElement("span"); d.className = "d"; d.textContent = x.d;
      li.append(t, d); if (x.k) { const k = document.createElement("span"); k.className = "k"; k.textContent = x.k; li.append(k); }
      li.onmouseenter = () => { sel = i; [...list.children].forEach((c, j) => { c.className = j === i ? "sel" : ""; }); };
      li.onclick = () => runSel(i);
      list.appendChild(li);
    });
    if (!shown.length) { const li = document.createElement("li"); li.innerHTML = '<span class="d">No tool matches.</span>'; list.appendChild(li); }
  }
  function runSel(i) { const x = shown[i]; if (!x) return; close(); setTimeout(() => { try { x.run(); } catch (e) { toast("That didn't work: " + e.message); console.warn("Site Works toolbox:", e); } }, 0); }
  function open() { mount(); input.value = ""; sel = 0; render(); ov.classList.add("on"); setTimeout(() => input.focus(), 0); }
  function close() { ov.classList.remove("on"); }
  input.addEventListener("input", () => { sel = 0; render(); });
  input.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); render(); list.children[sel] && list.children[sel].scrollIntoView({ block: "nearest" }); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); render(); list.children[sel] && list.children[sel].scrollIntoView({ block: "nearest" }); }
    else if (e.key === "Enter") { e.preventDefault(); runSel(sel); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
  });
  ["keyup", "keypress"].forEach((t) => input.addEventListener(t, (e) => e.stopPropagation()));
  ov.addEventListener("mousedown", (e) => { if (e.target === ov) close(); });

  window.__swToolbox = { open, close, toggle: () => (ov.classList.contains("on") ? close() : open()) };

  // ------------------------------------------------------------ restore remembered settings
  const s = getS();
  if (s.unblock) setUnblock(true);
  if (s.dark) setDark(true);
  if (s.speed) { setSpeed(s.speed); new MutationObserver(applySpeed).observe(document.documentElement, { childList: true, subtree: true }); }
  let again = 0; try { again = Number(sessionStorage.getItem(RKEY)) || 0; } catch (e) {}
  if (again >= 5000) startReload(again);
})();
