// Site Works - background service worker.
//
//   sites\<Site>\<A>\<B>\...\*.js        (matching rules: see match.js / README)
//
// PERMISSION GATE. No script runs until it has a decision:
//   - Every matching script is checked against the saved decisions immediately
//     before it is injected: first for (this website, script), then for
//     (every website, script). A decision for this website wins.
//   - "Always allow" is tied to the script's SHA-256: if the file changes, it
//     asks again. "Always block" holds whatever the file contains.
//   - Anything else opens the Site Works request window (an extension window the
//     page cannot see or click). Closing it rejects for this page.
//   - Every decision and run is logged (Manage page).
// MASTER SWITCH AND PAUSE. Site Works can be turned off everywhere, or paused on
// a website; then nothing new runs there (scripts already running in a page
// keep running until it reloads).
// Per-page state lives in the extension's isolated world, out of the page's reach.
//
// Privileged controls (on/off, decisions, the file helper) are only reachable
// from Site Works' own pages, menus and shortcuts - never from a website or a
// script running in one.

importScripts("match.js");

const PROMPT = "prompt.html";
const TOOLBOX = "00-toolbox.js";        // sites\00-toolbox.js, opened by Alt+Shift+K / the right-click menu
const LOG_MAX = 1000;

// ---------------------------------------------------------------- storage helpers

async function getPerms() { return (await chrome.storage.local.get("perms")).perms || {}; }
async function getSettings() {
  const o = await chrome.storage.local.get(["enabled", "paused"]);
  return { enabled: o.enabled !== false, paused: Array.isArray(o.paused) ? o.paused : [] };
}

let permChain = Promise.resolve();
function updatePerms(fn) {
  permChain = permChain.then(async () => { const perms = await getPerms(); fn(perms); await chrome.storage.local.set({ perms }); }).catch((e) => console.warn("Site Works:", e));
  return permChain;
}

let logChain = Promise.resolve();
function log(entry) {
  entry = Object.assign({ t: Date.now() }, entry);
  logChain = logChain.then(async () => {
    const list = (await chrome.storage.local.get("log")).log || [];
    list.push(entry); if (list.length > LOG_MAX) list.splice(0, list.length - LOG_MAX);
    await chrome.storage.local.set({ log: list });
  }).catch(() => {});
  return logChain;
}

const reqKey = (tabId) => "req:" + tabId;
async function getReq(tabId) { return (await chrome.storage.session.get(reqKey(tabId)))[reqKey(tabId)] || null; }
async function allReqs() { const all = await chrome.storage.session.get(null); return Object.keys(all).filter((k) => k.startsWith("req:")).map((k) => all[k]); }

// ---------------------------------------------------------------- per-page state (isolated world)
// globalThis.__siteWorks[file] = { s: "pending" | "waiting" | "ran" | "rejected" | "blocked" | "failed", t }

async function inPage(ctx, func, args) {
  const [res] = await chrome.scripting.executeScript({ target: { tabId: ctx.tabId, documentIds: [ctx.docId] }, world: "ISOLATED", func, args: args || [] });
  return res && res.result;
}
// Claims the scripts this page hasn't handled yet, in one step, so two quick URL changes can
// never handle a script twice. Failed ones get another go; so do ones left "waiting" when
// their request was dropped (Site Works turned off and on again).
const claim = (ctx, list, reclaimWaiting) => inPage(ctx, (l, rw) => {
  const L = globalThis.__siteWorks || (globalThis.__siteWorks = {});
  const out = l.filter((f) => !L[f] || L[f].s === "failed" || (rw && L[f].s === "waiting")); out.forEach((f) => { L[f] = { s: "pending", t: Date.now() }; }); return out;
}, [list, !!reclaimWaiting]);
const mark = (ctx, files, s) => inPage(ctx, (l, st) => {
  const L = globalThis.__siteWorks || (globalThis.__siteWorks = {}); l.forEach((f) => { L[f] = { s: st, t: Date.now() }; });
}, [files, s]).catch(() => {});
const pageStateOf = (ctx) => inPage(ctx, () => globalThis.__siteWorks || {}).catch(() => ({}));

async function docOf(tabId) {
  try { const f = await chrome.webNavigation.getFrame({ tabId, frameId: 0 }); return (f && f.documentId) || null; } catch (e) { return null; }
}
async function ctxOf(tab) {
  if (!tab || !/^https?:/.test(tab.url || "")) return null;
  const docId = await docOf(tab.id); if (!docId) return null;
  return { tabId: tab.id, docId, url: tab.url, host: SW.urlParts(tab.url).host };
}

// ---------------------------------------------------------------- the gate

const busy = {};   // one job per tab at a time
function queue(tabId, job) {
  const next = (busy[tabId] || Promise.resolve()).then(job, job).catch((e) => console.warn("Site Works:", e));
  busy[tabId] = next; return next;
}

async function apply(tabId, url, docId) {
  if (!url || !/^https?:/.test(url)) return;
  docId = docId || await docOf(tabId);
  if (!docId) return;
  let host; try { host = SW.urlParts(url).host; } catch (e) { return; }
  const ctx = { tabId, docId, url, host };
  const set = await getSettings();
  if (!set.enabled || SW.isPaused(set.paused, host)) { await refreshBadge(ctx, set); return; }
  const idx = await SW.loadIndex();
  const want = SW.matchingScripts(idx, url);
  if (!want.length) { await refreshBadge(ctx, set); return; }
  let claimed;
  const req = await getReq(tabId);
  try { claimed = (await claim(ctx, want, !req || req.docId !== docId)) || []; } catch (e) { return; }  // tab closed, navigated away, or a page the browser protects
  const perms = await getPerms(), ask = [];
  for (const file of claimed) {
    let hash;
    try { hash = await SW.scriptHash(file); }
    catch (e) { await mark(ctx, [file], "failed"); log({ host, url, file, ev: "failed", note: "listed in index.json but the file is missing - rebuild the index" }); continue; }
    const v = SW.verdict(perms, host, file, hash);
    if (v === "block") { await mark(ctx, [file], "blocked"); log({ host, url, file, ev: "blocked", note: perms[SW.permKey(host, file)] ? "always blocked on this website" : "always blocked on every website" }); }
    else if (v === "allow") await run(ctx, file, hash, false);
    else ask.push({ file, hash, reason: v });
  }
  if (ask.length) await request(ctx, ask);
  await refreshBadge(ctx);
}

// Final check immediately before execution, then inject.
async function run(ctx, file, approvedHash, once, how) {
  const set = await getSettings();
  if (!set.enabled || SW.isPaused(set.paused, ctx.host)) { await mark(ctx, [file], "rejected"); return; }
  let hash;
  try { hash = await SW.scriptHash(file); } catch (e) { await mark(ctx, [file], "failed"); log({ host: ctx.host, url: ctx.url, file, ev: "failed", note: "file missing" }); return; }
  if (hash !== approvedHash) { await request(ctx, [{ file, hash, reason: "changed" }]); return; }
  if (!once && SW.verdict(await getPerms(), ctx.host, file, hash) !== "allow") { await request(ctx, [{ file, hash, reason: "new" }]); return; }
  try {
    await chrome.scripting.executeScript({ target: { tabId: ctx.tabId, documentIds: [ctx.docId] }, world: "MAIN", files: ["sites/" + file] });
    await mark(ctx, [file], "ran");
    log({ host: ctx.host, url: ctx.url, file, ev: "ran", note: how || (once ? "allowed this time" : "always allowed") });
  } catch (e) {
    await mark(ctx, [file], "failed");
    log({ host: ctx.host, url: ctx.url, file, ev: "failed", note: (e && e.message) || String(e) });
  }
}

async function request(ctx, items) {
  let req = await getReq(ctx.tabId);
  if (!req || req.docId !== ctx.docId) req = { tabId: ctx.tabId, docId: ctx.docId, url: ctx.url, host: ctx.host, scripts: [], windowId: req ? req.windowId : null };
  req.url = ctx.url;
  for (const it of items) { const i = req.scripts.findIndex((s) => s.file === it.file); if (i >= 0) req.scripts[i] = it; else req.scripts.push(it); }
  await chrome.storage.session.set({ [reqKey(ctx.tabId)]: req });
  await mark(ctx, items.map((i) => i.file), "waiting");
  await showPrompt(req, false);
}

async function showPrompt(req, force) {
  if (req.windowId != null) {
    try { await chrome.windows.get(req.windowId); if (force) await chrome.windows.update(req.windowId, { focused: true, drawAttention: true }); return; } catch (e) {}
  }
  if (!force) { try { if (!(await chrome.tabs.get(req.tabId)).active) return; } catch (e) { return; } }
  const h = Math.min(760, 270 + 190 * req.scripts.length);
  const w = await chrome.windows.create({ url: chrome.runtime.getURL(PROMPT) + "?tab=" + req.tabId, type: "popup", width: 520, height: h, focused: true });
  const cur = await getReq(req.tabId);
  if (cur) { cur.windowId = w.id; await chrome.storage.session.set({ [reqKey(req.tabId)]: cur }); }
}

async function dropReq(tabId, closeWindow) {
  const req = await getReq(tabId); if (!req) return null;
  await chrome.storage.session.remove(reqKey(tabId));
  if (closeWindow && req.windowId != null) chrome.windows.remove(req.windowId).catch(() => {});
  return req;
}

// One decision from the request window. msg.scope: "site" (this website) or "all" (every website).
async function decide(msg) {
  const req = await getReq(msg.tabId);
  if (!req || req.docId !== msg.docId) return;
  const it = req.scripts.find((s) => s.file === msg.file); if (!it) return;
  req.scripts = req.scripts.filter((s) => s !== it);
  if (req.scripts.length) await chrome.storage.session.set({ [reqKey(msg.tabId)]: req });
  else await dropReq(msg.tabId, true);
  const ctx = { tabId: req.tabId, docId: req.docId, url: req.url, host: req.host };
  if (msg.remember) {
    const where = msg.scope === "all" ? SW.ALL : req.host;
    await updatePerms((p) => { p[SW.permKey(where, it.file)] = msg.allow ? { d: "allow", hash: it.hash, at: Date.now() } : { d: "block", at: Date.now() }; });
    log({ host: where === SW.ALL ? "every website" : req.host, url: req.url, file: it.file, ev: msg.allow ? "always allowed" : "always blocked", note: "chosen in the request window" });
  }
  if (msg.allow) await run(ctx, it.file, it.hash, !msg.remember);
  else { await mark(ctx, [it.file], msg.remember ? "blocked" : "rejected"); if (!msg.remember) log({ host: req.host, url: req.url, file: it.file, ev: "rejected", note: "this time" }); }
  await refreshBadge(ctx);
}

// ---------------------------------------------------------------- badge = the running indicator

async function refreshBadge(ctx, set) {
  set = set || await getSettings();
  let text = "", colour = "#4c6b22", title = "Site Works: no scripts for this page";
  const L = await pageStateOf(ctx), v = Object.keys(L).map((f) => ({ f, s: L[f].s }));
  const by = (s) => v.filter((x) => (Array.isArray(s) ? s.includes(x.s) : x.s === s)).map((x) => x.f);
  const ran = by("ran"), wait = by(["waiting", "pending"]), failed = by("failed"), off = by(["rejected", "blocked"]);
  if (!set.enabled) { text = "OFF"; colour = "#56636f"; title = "Site Works is turned OFF everywhere" + (ran.length ? " (" + ran.length + " script(s) still running here until reload)" : ""); }
  else if (SW.isPaused(set.paused, ctx.host)) { text = "II"; colour = "#56636f"; title = "Site Works is paused on " + ctx.host + (ran.length ? " (" + ran.length + " script(s) still running here until reload)" : ""); }
  else if (failed.length) { text = "ERR"; colour = "#c0392b"; title = "Site Works: " + failed.length + " script(s) failed - see the log or the page's Console"; }
  else if (wait.length) { text = "?"; colour = "#d18b00"; title = "Site Works: " + wait.length + " script(s) waiting for your permission - click to review"; }
  else if (ran.length) { text = String(ran.length); title = "Site Works: RUNNING on this page:\n" + ran.join("\n"); }
  else if (off.length) { text = "off"; colour = "#56636f"; title = "Site Works: " + off.length + " script(s) not run on this page (rejected or blocked)"; }
  if (set.enabled && ran.length && !failed.length && !wait.length && off.length) title += "\nNot run: " + off.join(", ");
  try {
    await chrome.action.setBadgeText({ tabId: ctx.tabId, text });
    await chrome.action.setBadgeBackgroundColor({ tabId: ctx.tabId, color: colour });
    await chrome.action.setTitle({ tabId: ctx.tabId, title });
  } catch (e) {}
}

async function forEachWebTab(fn) {
  try { (await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] })).forEach((t) => queue(t.id, () => fn(t))); } catch (e) {}
}
const sweepOpenTabs = () => forEachWebTab((t) => apply(t.id, t.url));
const refreshAllBadges = () => forEachWebTab(async (t) => { const c = await ctxOf(t); if (c) await refreshBadge(c); });

// ---------------------------------------------------------------- controls (own pages, menus, shortcuts only)

async function setEnabled(on) {
  await chrome.storage.local.set({ enabled: !!on });
  log({ host: "", url: "", file: "", ev: on ? "turned on" : "turned off", note: "everywhere" });
  if (on) { for (const r of await allReqs()) await dropReq(r.tabId, true); sweepOpenTabs(); }
  else { for (const r of await allReqs()) await dropReq(r.tabId, true); }
  refreshAllBadges(); updateMenus();
}
async function setPaused(host, pause) {
  const set = await getSettings();
  let paused = set.paused.filter((h) => h !== host);
  if (pause) paused.push(host);
  await chrome.storage.local.set({ paused });
  log({ host, url: "", file: "", ev: pause ? "paused" : "resumed", note: "on this website" });
  if (!pause) forEachWebTab((t) => { try { if (SW.urlParts(t.url).host === host) return apply(t.id, t.url); } catch (e) {} });
  refreshAllBadges(); updateMenus();
}
// Forget saved decisions. Any of host / file may be omitted (= all).
async function forget(host, file) {
  let n = 0;
  await updatePerms((p) => Object.keys(p).forEach((k) => {
    const i = k.indexOf("|"), h = k.slice(0, i), f = k.slice(i + 1);
    if ((host == null || h === host) && (file == null || f === file)) { delete p[k]; n++; }
  }));
  log({ host: host === SW.ALL ? "every website" : host || "", url: "", file: file || "", ev: "decision revoked", note: n + " decision(s) forgotten" });
  return n;
}
// Your own edit, saved from the Site Works editor: carry existing "always allow" over to the new contents.
async function rehash(file, hash) {
  let n = 0;
  await updatePerms((p) => Object.keys(p).forEach((k) => { if (k.endsWith("|" + file) && p[k].d === "allow") { p[k].hash = hash; n++; } }));
  if (n) log({ host: "", url: "", file, ev: "always allowed", note: "kept after your edit in the Site Works editor (" + n + " website(s))" });
  return n;
}

// The toolbox (sites\00-toolbox.js) on demand: you asked for it from Site Works' own
// menu or shortcut, which counts as "allow this time" unless you have blocked it here.
async function openToolbox(tab) {
  const c = await ctxOf(tab); if (!c) return;
  const idx = await SW.loadIndex();
  if (!idx.files.includes(TOOLBOX)) { await notifyPage(c, "Site Works: no sites\\" + TOOLBOX + " in your index."); return; }
  const call = () => inPageMain(c, () => { if (window.__swToolbox) { window.__swToolbox.open(); return true; } return false; });
  if (await call().catch(() => false)) return;
  let hash; try { hash = await SW.scriptHash(TOOLBOX); } catch (e) { return; }
  if (SW.verdict(await getPerms(), c.host, TOOLBOX, hash) === "block") { await notifyPage(c, "Site Works: the toolbox is blocked on " + c.host + " (Manage to change)."); return; }
  const L = await pageStateOf(c);
  if (!(L[TOOLBOX] && L[TOOLBOX].s === "ran")) await run(c, TOOLBOX, hash, true, "opened from the Site Works menu or shortcut");
  await call().catch(() => {});
  await refreshBadge(c);
}
async function inPageMain(ctx, func, args) {
  const [res] = await chrome.scripting.executeScript({ target: { tabId: ctx.tabId, documentIds: [ctx.docId] }, world: "MAIN", func, args: args || [] });
  return res && res.result;
}
// A small message drawn by the extension's isolated world (the page can't trigger it).
function notifyPage(ctx, text) {
  return inPage(ctx, (t) => {
    const d = document.createElement("div");
    d.textContent = t;
    d.style.cssText = "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#1b2838;color:#fff;border:1px solid #66c0f4;padding:10px 16px;border-radius:8px;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.5)";
    document.documentElement.appendChild(d); setTimeout(() => d.remove(), 3500);
  }, [text]).catch(() => {});
}
function copyInPage(ctx, text) {
  return inPage(ctx, (t) => {
    const ta = document.createElement("textarea"); ta.value = t; ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
    document.documentElement.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok;
  }, [text]).catch(() => false);
}

// ---------------------------------------------------------------- right-click menu

function buildMenus() {
  chrome.contextMenus.removeAll(() => {
    const all = ["page", "selection", "link", "image", "video", "audio", "frame", "editable"];
    const add = (o) => chrome.contextMenus.create(Object.assign({ contexts: all, documentUrlPatterns: ["http://*/*", "https://*/*"] }, o), () => void chrome.runtime.lastError);
    add({ id: "sw-toolbox", title: "Open toolbox on this page   (Alt+Shift+K)" });
    add({ id: "sw-copy-link", title: "Copy link as Markdown", contexts: ["link"] });
    add({ id: "sw-copy-page", title: "Copy page as Markdown link" });
    add({ id: "sw-new", title: "New script for this page…" });
    add({ id: "sw-sep", type: "separator" });
    add({ id: "sw-pause", title: "Pause Site Works on this website" });
    add({ id: "sw-enabled", title: "Site Works on", type: "checkbox", checked: true });
    add({ id: "sw-manage", title: "Manage permissions, scripts & log" });
    updateMenus();
  });
}
async function updateMenus() {
  const set = await getSettings();
  let host = "";
  try { const [t] = await chrome.tabs.query({ active: true, lastFocusedWindow: true }); if (t && /^https?:/.test(t.url || "")) host = SW.urlParts(t.url).host; } catch (e) {}
  const paused = host && SW.isPaused(set.paused, host);
  chrome.contextMenus.update("sw-enabled", { checked: set.enabled }, () => void chrome.runtime.lastError);
  chrome.contextMenus.update("sw-pause", { title: paused ? "Resume Site Works on " + host : "Pause Site Works on " + (host || "this website"), enabled: set.enabled }, () => void chrome.runtime.lastError);
}
function openPage(path) { return chrome.tabs.create({ url: chrome.runtime.getURL(path) }); }
const editorFor = (tab) => openPage("editor.html?tab=" + tab.id + "&url=" + encodeURIComponent(tab.url));

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const id = info.menuItemId;
  if (id === "sw-manage") return openPage("manage.html");
  if (id === "sw-enabled") return setEnabled(info.checked);
  if (!tab || !/^https?:/.test(tab.url || "")) return;
  if (id === "sw-toolbox") return queue(tab.id, () => openToolbox(tab));
  if (id === "sw-new") return editorFor(tab);
  if (id === "sw-pause") { const set = await getSettings(), h = SW.urlParts(tab.url).host; return setPaused(h, !SW.isPaused(set.paused, h)); }
  if (id === "sw-copy-link" || id === "sw-copy-page") {
    const c = await ctxOf(tab); if (!c) return;
    const label = id === "sw-copy-link" ? (info.selectionText || info.linkText || info.linkUrl) : (tab.title || tab.url);
    const url = id === "sw-copy-link" ? info.linkUrl : tab.url;
    const md = "[" + String(label).replace(/\s+/g, " ").trim().replace(/([\[\]])/g, "\\$1") + "](" + url.replace(/\)/g, "%29") + ")";
    if (await copyInPage(c, md)) notifyPage(c, "Copied: " + md.slice(0, 120));
  }
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (!tab) { try { [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true }); } catch (e) {} }
  if (command === "toggle-enabled") { const set = await getSettings(); return setEnabled(!set.enabled); }
  if (!tab || !/^https?:/.test(tab.url || "")) return;
  if (command === "open-toolbox") return queue(tab.id, () => openToolbox(tab));
  if (command === "toggle-pause") { const set = await getSettings(), h = SW.urlParts(tab.url).host; await setPaused(h, !SW.isPaused(set.paused, h)); const c = await ctxOf(tab); if (c) notifyPage(c, "Site Works " + (SW.isPaused((await getSettings()).paused, h) ? "paused" : "resumed") + " on " + h); }
  if (command === "new-script") return editorFor(tab);
});

// ---------------------------------------------------------------- events

chrome.webNavigation.onCommitted.addListener((d) => {
  if (d.frameId !== 0) return;
  queue(d.tabId, async () => {
    const req = await getReq(d.tabId);
    if (req && req.docId !== d.documentId) await dropReq(d.tabId, true);
    try { await chrome.action.setBadgeText({ tabId: d.tabId, text: "" }); await chrome.action.setTitle({ tabId: d.tabId, title: "Site Works" }); } catch (e) {}
  });
});
const onNav = (d) => { if (d.frameId === 0) queue(d.tabId, () => apply(d.tabId, d.url, d.documentId)); };
chrome.webNavigation.onCompleted.addListener(onNav);
chrome.webNavigation.onHistoryStateUpdated.addListener(onNav);
chrome.webNavigation.onReferenceFragmentUpdated.addListener(onNav);

chrome.tabs.onActivated.addListener(({ tabId }) => { updateMenus(); queue(tabId, async () => { const req = await getReq(tabId); if (req) await showPrompt(req, false); }); });
chrome.tabs.onUpdated.addListener((tabId, ch) => { if (ch.url) updateMenus(); });
chrome.windows.onFocusChanged.addListener(() => updateMenus());
chrome.tabs.onRemoved.addListener((tabId) => { queue(tabId, () => dropReq(tabId, true)).then(() => { delete busy[tabId]; }); });

chrome.windows.onRemoved.addListener(async (windowId) => {
  for (const req of await allReqs()) {
    if (req.windowId !== windowId) continue;
    queue(req.tabId, async () => {
      const cur = await getReq(req.tabId); if (!cur || cur.windowId !== windowId) return;
      await dropReq(req.tabId, false);
      const ctx = { tabId: cur.tabId, docId: cur.docId, url: cur.url, host: cur.host };
      await mark(ctx, cur.scripts.map((s) => s.file), "rejected");
      for (const s of cur.scripts) log({ host: cur.host, url: cur.url, file: s.file, ev: "rejected", note: "request window closed" });
      await refreshBadge(ctx);
    });
  }
});

chrome.runtime.onInstalled.addListener(() => { buildMenus(); sweepOpenTabs(); });
chrome.runtime.onStartup.addListener(() => { buildMenus(); sweepOpenTabs(); });

// Only Site Works' own pages (popup, request window, Manage, editor, clipboard) may talk to the gate.
const fromOwnPage = (sender) => sender && sender.id === chrome.runtime.id && typeof sender.url === "string" && sender.url.startsWith(chrome.runtime.getURL(""));
const fromPage = (sender, page) => sender.url.startsWith(chrome.runtime.getURL(page));

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!msg || !msg.siteWorks || !fromOwnPage(sender)) return;
  const done = (p) => { Promise.resolve(p).then((r) => reply(r === undefined ? { ok: true } : r), (e) => reply({ error: String(e && e.message || e) })); return true; };
  switch (msg.siteWorks) {
    case "decide": if (!fromPage(sender, PROMPT)) return; return done(queue(msg.tabId, () => decide(msg)));
    case "review": return done(queue(msg.tabId, async () => { const req = await getReq(msg.tabId); if (req) await showPrompt(req, true); }));
    case "setEnabled": return done(setEnabled(msg.on));
    case "setPaused": return done(setPaused(msg.host, msg.pause));
    case "forget": return done(forget(msg.host == null ? null : msg.host, msg.file == null ? null : msg.file).then((n) => ({ n })));
    case "rehash": if (!fromPage(sender, "editor.html")) return; return done(rehash(msg.file, msg.hash).then((n) => ({ n })));
    case "toolbox": return done(chrome.tabs.get(msg.tabId).then((t) => queue(t.id, () => openToolbox(t))));
    case "newScript": return done(chrome.tabs.get(msg.tabId).then(editorFor));
    case "status": return done((async () => {
      const idx = await SW.loadIndex(), tab = msg.tab, set = await getSettings();
      let parts = null, state = {}; try { parts = SW.urlParts(tab.url); } catch (e) {}
      const docId = await docOf(tab.id);
      if (docId) state = await pageStateOf({ tabId: tab.id, docId });
      const sites = parts ? SW.sitesFor(idx, parts.host) : [];
      const perms = await getPerms(), match = tab.url ? SW.matchingScripts(idx, tab.url) : [];
      const saved = {};
      if (parts) match.forEach((f) => { const own = perms[SW.permKey(parts.host, f)], all = perms[SW.permKey(SW.ALL, f)]; if (own || all) saved[f] = { d: (own || all).d, all: !own }; });
      const siteDecisions = parts ? Object.keys(perms).filter((k) => k.startsWith(parts.host + "|")).length : 0;
      return { idx, match, state, parts, sites, saved, siteDecisions, enabled: set.enabled, paused: !!(parts && SW.isPaused(set.paused, parts.host)), pending: !!(await getReq(tab.id)), toolbox: idx.files.includes(TOOLBOX) };
    })());
  }
});
