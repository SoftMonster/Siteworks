// Site Works - background service worker.
//
//   sites\<Site>\<A>\<B>\...\*.js
//
// Level 1 - the site. sites\Steamworks\ applies to the hosts listed in its
// hosts.txt (steamcommunity.com, steampowered.com; subdomains included). A site
// folder without hosts.txt matches hosts that contain its name as one part:
// sites\Google\ matches www.google.com, mail.google.com, google.co.uk... A site
// folder whose name has a dot (sites\github.com\) is that host name.
// Files directly in sites\<Site>\ run on every page of that site; files directly
// in sites\ run on every page of every website.
//
// Levels 2+ - the URL path. A script in sites\<Site>\A\B\C\ runs when the URL's
// path contains A, B and C in that order (other parts may sit between them).
// A level-2 folder named after a host the site covers narrows to that host
// (sites\Steamworks\store.steampowered.com\app\); any other name, even one with
// a dot such as index.html, is an ordinary path part. Matching ignores case.
//
// PERMISSION GATE. No script runs until it has a decision:
//   - Every matching script is checked against the saved decisions for
//     (website host, script path) immediately before it is injected.
//   - "Always allow" is tied to the script's SHA-256: if the file changes, it
//     asks again. "Always block" holds whatever the file contains.
//   - Anything else - a new script, a new website, a changed file - opens the
//     Site Works request window (an extension window the page cannot see or
//     click). Allow / Reject there apply to this page load only unless
//     "Do not ask again" is ticked. Closing the window rejects for this page.
//   - Every decision and every run is written to the log (Manage page).
// Per-page state (what ran, what was rejected) lives in the extension's own
// isolated world in the page, so the website's scripts cannot read or change it.
//
// Each script runs at most ONCE per page load, inside the page (as if pasted
// into the Console). When the URL changes without a new page (#hash, history),
// newly matching scripts are checked and added; ones already handled are left
// alone. Shallower folders run first; within a folder, files run in name order.
//
// Browsers don't let an extension list its own folders, so the list comes from
// sites\index.json, written by "Rebuild index.cmd". Run it after adding,
// renaming or removing scripts or editing hosts.txt; no extension reload needed.

const PROMPT = "prompt.html";
const LOG_MAX = 1000;

// ---------------------------------------------------------------- index + matching

async function loadIndex() {
  try {
    const r = await fetch(chrome.runtime.getURL("sites/index.json") + "?t=" + Date.now(), { cache: "no-store" });
    if (r.ok) {
      const o = await r.json();
      let files = o && o.files; if (typeof files === "string") files = [files];
      const sites = (o && o.sites && typeof o.sites === "object") ? o.sites : {};
      return { built: (o && o.built) || "", sites, files: Array.isArray(files) ? files.filter((f) => typeof f === "string" && /\.js$/i.test(f) && !f.split("/").includes("..")) : [] };
    }
  } catch (e) {}
  return { built: "", sites: {}, files: [], missing: true };
}

function urlParts(url) {
  const u = new URL(url);
  const segs = u.pathname.split("/").filter(Boolean).map((s) => { try { return decodeURIComponent(s).toLowerCase(); } catch (e) { return s.toLowerCase(); } });
  return { host: u.hostname.toLowerCase(), segs };
}
const hostIs = (host, h) => { h = String(h).trim().toLowerCase().replace(/^\*\./, "").replace(/^https?:\/\//, "").replace(/\/.*$/, ""); return !!h && (host === h || host.endsWith("." + h)); };

function siteMatches(site, idx, host) {
  const info = idx.sites[site] || idx.sites[Object.keys(idx.sites).find((k) => k.toLowerCase() === site.toLowerCase())] || {};
  const hosts = Array.isArray(info.hosts) ? info.hosts.filter(Boolean) : [];
  if (hosts.length) return hosts.some((h) => hostIs(host, h));
  if (site.includes(".")) return hostIs(host, site);
  return host.split(".").includes(site.toLowerCase());
}

// folder: ["id", "inventory"] -> true when the path holds those parts in that order.
// A first part that is a host covered by the site narrows to that host instead.
function pathMatches(site, idx, folder, host, segs) {
  let f = folder.map((s) => s.toLowerCase());
  if (f.length && f[0].includes(".") && siteMatches(site, idx, f[0])) { if (!hostIs(host, f[0])) return false; f = f.slice(1); }
  let i = 0;
  for (const s of segs) if (i < f.length && s === f[i]) i++;
  return i === f.length;
}

function matchingScripts(idx, url) {
  let p; try { p = urlParts(url); } catch (e) { return []; }
  return idx.files.filter((f) => {
    const parts = f.split("/");
    if (parts.length === 1) return true;                                   // sites\*.js: every website
    return siteMatches(parts[0], idx, p.host) && pathMatches(parts[0], idx, parts.slice(1, -1), p.host, p.segs);
  }).sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b));
}

// ---------------------------------------------------------------- storage helpers

const permKey = (host, file) => host + "|" + file;
async function getPerms() { return (await chrome.storage.local.get("perms")).perms || {}; }

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

async function scriptHash(file) {
  const r = await fetch(chrome.runtime.getURL("sites/" + file) + "?t=" + Date.now(), { cache: "no-store" });
  if (!r.ok) throw new Error("file not found");
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", await r.arrayBuffer()));
  return Array.from(d, (b) => b.toString(16).padStart(2, "0")).join("");
}

// "block" | "allow" | "changed" (allowed, but the file has changed since) | "new"
function verdict(perms, host, file, hash) {
  const p = perms[permKey(host, file)];
  if (p && p.d === "block") return "block";
  if (p && p.d === "allow") return p.hash === hash ? "allow" : "changed";
  return "new";
}

// ---------------------------------------------------------------- per-page state (isolated world)
// window.__siteWorks[file] = { s: "pending" | "waiting" | "ran" | "rejected" | "blocked" | "failed", t }

async function inPage(ctx, func, args) {
  const [res] = await chrome.scripting.executeScript({ target: { tabId: ctx.tabId, documentIds: [ctx.docId] }, world: "ISOLATED", func, args: args || [] });
  return res && res.result;
}
// Claims the scripts this page hasn't handled yet (failed ones get another go), in one step,
// so two quick URL changes can never handle a script twice.
const claim = (ctx, list) => inPage(ctx, (l) => {
  const L = globalThis.__siteWorks || (globalThis.__siteWorks = {});
  const out = l.filter((f) => !L[f] || L[f].s === "failed"); out.forEach((f) => { L[f] = { s: "pending", t: Date.now() }; }); return out;
}, [list]);
const mark = (ctx, files, s) => inPage(ctx, (l, st) => {
  const L = globalThis.__siteWorks || (globalThis.__siteWorks = {}); l.forEach((f) => { L[f] = { s: st, t: Date.now() }; });
}, [files, s]).catch(() => {});
const pageStateOf = (ctx) => inPage(ctx, () => globalThis.__siteWorks || {}).catch(() => ({}));

async function docOf(tabId) {
  try { const f = await chrome.webNavigation.getFrame({ tabId, frameId: 0 }); return (f && f.documentId) || null; } catch (e) { return null; }
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
  let host; try { host = urlParts(url).host; } catch (e) { return; }
  const ctx = { tabId, docId, url, host };
  const idx = await loadIndex();
  const want = matchingScripts(idx, url);
  if (!want.length) { await refreshBadge(ctx); return; }
  let claimed;
  try { claimed = (await claim(ctx, want)) || []; } catch (e) { return; }  // tab closed, navigated away, or a page the browser protects
  const perms = await getPerms(), ask = [];
  for (const file of claimed) {
    let hash;
    try { hash = await scriptHash(file); }
    catch (e) { await mark(ctx, [file], "failed"); log({ host, url, file, ev: "failed", note: "listed in index.json but the file is missing - run Rebuild index.cmd" }); continue; }
    const v = verdict(perms, host, file, hash);
    if (v === "block") { await mark(ctx, [file], "blocked"); log({ host, url, file, ev: "blocked", note: "always blocked on this website" }); }
    else if (v === "allow") await run(ctx, file, hash, false);
    else ask.push({ file, hash, reason: v });
  }
  if (ask.length) await request(ctx, ask);
  await refreshBadge(ctx);
}

// Final check immediately before execution, then inject.
async function run(ctx, file, approvedHash, once) {
  let hash;
  try { hash = await scriptHash(file); } catch (e) { await mark(ctx, [file], "failed"); log({ host: ctx.host, url: ctx.url, file, ev: "failed", note: "file missing" }); return; }
  if (hash !== approvedHash) { await request(ctx, [{ file, hash, reason: "changed" }]); return; }
  if (!once && verdict(await getPerms(), ctx.host, file, hash) !== "allow") { await request(ctx, [{ file, hash, reason: "new" }]); return; }
  try {
    await chrome.scripting.executeScript({ target: { tabId: ctx.tabId, documentIds: [ctx.docId] }, world: "MAIN", files: ["sites/" + file] });
    await mark(ctx, [file], "ran");
    log({ host: ctx.host, url: ctx.url, file, ev: "ran", note: once ? "allowed this time" : "always allowed" });
  } catch (e) {
    await mark(ctx, [file], "failed");
    log({ host: ctx.host, url: ctx.url, file, ev: "failed", note: (e && e.message) || String(e) });
  }
}

// Add scripts to this tab's pending request and show the request window.
async function request(ctx, items) {
  let req = await getReq(ctx.tabId);
  if (!req || req.docId !== ctx.docId) req = { tabId: ctx.tabId, docId: ctx.docId, url: ctx.url, host: ctx.host, scripts: [], windowId: req ? req.windowId : null };
  req.url = ctx.url;
  for (const it of items) { const i = req.scripts.findIndex((s) => s.file === it.file); if (i >= 0) req.scripts[i] = it; else req.scripts.push(it); }
  await chrome.storage.session.set({ [reqKey(ctx.tabId)]: req });
  await mark(ctx, items.map((i) => i.file), "waiting");
  await showPrompt(req, false);
}

// Opens the request window, or brings it forward if it's already open. Unless forced
// (popup's Review button) it only opens for the tab you're looking at; background tabs
// wait with a "?" badge until you switch to them.
async function showPrompt(req, force) {
  if (req.windowId != null) {
    try { await chrome.windows.get(req.windowId); if (force) await chrome.windows.update(req.windowId, { focused: true, drawAttention: true }); return; } catch (e) {}
  }
  if (!force) { try { if (!(await chrome.tabs.get(req.tabId)).active) return; } catch (e) { return; } }
  const h = Math.min(720, 250 + 170 * req.scripts.length);
  const w = await chrome.windows.create({ url: chrome.runtime.getURL(PROMPT) + "?tab=" + req.tabId, type: "popup", width: 500, height: h, focused: true });
  const cur = await getReq(req.tabId);
  if (cur) { cur.windowId = w.id; await chrome.storage.session.set({ [reqKey(req.tabId)]: cur }); }
}

async function dropReq(tabId, closeWindow) {
  const req = await getReq(tabId); if (!req) return null;
  await chrome.storage.session.remove(reqKey(tabId));
  if (closeWindow && req.windowId != null) chrome.windows.remove(req.windowId).catch(() => {});
  return req;
}

// One decision from the request window.
async function decide(msg) {
  const req = await getReq(msg.tabId);
  if (!req || req.docId !== msg.docId) return;
  const it = req.scripts.find((s) => s.file === msg.file); if (!it) return;
  req.scripts = req.scripts.filter((s) => s !== it);
  if (req.scripts.length) await chrome.storage.session.set({ [reqKey(msg.tabId)]: req });
  else await dropReq(msg.tabId, true);
  const ctx = { tabId: req.tabId, docId: req.docId, url: req.url, host: req.host };
  if (msg.remember) {
    await updatePerms((p) => { p[permKey(req.host, it.file)] = msg.allow ? { d: "allow", hash: it.hash, at: Date.now() } : { d: "block", at: Date.now() }; });
    log({ host: req.host, url: req.url, file: it.file, ev: msg.allow ? "always allowed" : "always blocked", note: "chosen in the request window" });
  }
  if (msg.allow) await run(ctx, it.file, it.hash, !msg.remember);
  else { await mark(ctx, [it.file], msg.remember ? "blocked" : "rejected"); if (!msg.remember) log({ host: req.host, url: req.url, file: it.file, ev: "rejected", note: "this time" }); }
  await refreshBadge(ctx);
}

// ---------------------------------------------------------------- badge = the running indicator

async function refreshBadge(ctx) {
  const L = await pageStateOf(ctx), v = Object.keys(L).map((f) => ({ f, s: L[f].s }));
  const by = (s) => v.filter((x) => (Array.isArray(s) ? s.includes(x.s) : x.s === s)).map((x) => x.f);
  const ran = by("ran"), wait = by(["waiting", "pending"]), failed = by("failed"), off = by(["rejected", "blocked"]);
  let text = "", colour = "#4c6b22", title = "Site Works: no scripts for this page";
  if (failed.length) { text = "ERR"; colour = "#c0392b"; title = "Site Works: " + failed.length + " script(s) failed - see the log or the page's Console"; }
  else if (wait.length) { text = "?"; colour = "#d18b00"; title = "Site Works: " + wait.length + " script(s) waiting for your permission - click to review"; }
  else if (ran.length) { text = String(ran.length); title = "Site Works: RUNNING on this page:\n" + ran.join("\n"); }
  else if (off.length) { text = "off"; colour = "#56636f"; title = "Site Works: " + off.length + " script(s) not run on this page (rejected or blocked)"; }
  if (ran.length && !failed.length && !wait.length && off.length) title += "\nNot run: " + off.join(", ");
  try {
    await chrome.action.setBadgeText({ tabId: ctx.tabId, text });
    await chrome.action.setBadgeBackgroundColor({ tabId: ctx.tabId, color: colour });
    await chrome.action.setTitle({ tabId: ctx.tabId, title });
  } catch (e) {}
}

// ---------------------------------------------------------------- events

chrome.webNavigation.onCommitted.addListener((d) => {
  if (d.frameId !== 0) return;
  // A new page: the old page's request is void. Reset the badge until the gate runs.
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

chrome.tabs.onActivated.addListener(({ tabId }) => queue(tabId, async () => { const req = await getReq(tabId); if (req) await showPrompt(req, false); }));
chrome.tabs.onRemoved.addListener((tabId) => { queue(tabId, () => dropReq(tabId, true)).then(() => { delete busy[tabId]; }); });

// Closing the request window = reject everything still in it, for this page only.
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

// Tabs already open when the extension starts or is reloaded.
async function sweepOpenTabs() {
  try { (await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] })).forEach((t) => queue(t.id, () => apply(t.id, t.url))); } catch (e) {}
}
chrome.runtime.onInstalled.addListener(sweepOpenTabs);
chrome.runtime.onStartup.addListener(sweepOpenTabs);

// Only Site Works' own pages (popup, request window, Manage) may talk to the gate.
const fromOwnPage = (sender) => sender && sender.id === chrome.runtime.id && typeof sender.url === "string" && sender.url.startsWith(chrome.runtime.getURL(""));

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!msg || !msg.siteWorks || !fromOwnPage(sender)) return;
  if (msg.siteWorks === "decide") {
    if (!sender.url.startsWith(chrome.runtime.getURL(PROMPT))) return;
    queue(msg.tabId, () => decide(msg)).then(() => reply({ ok: true }));
    return true;
  }
  if (msg.siteWorks === "review") {
    queue(msg.tabId, async () => { const req = await getReq(msg.tabId); if (req) await showPrompt(req, true); }).then(() => reply({ ok: true }));
    return true;
  }
  if (msg.siteWorks === "status") {
    (async () => {
      const idx = await loadIndex(), tab = msg.tab;
      let parts = null, state = {}; try { parts = urlParts(tab.url); } catch (e) {}
      const docId = await docOf(tab.id);
      if (docId) state = await pageStateOf({ tabId: tab.id, docId });
      const sites = Object.keys(idx.sites).concat(idx.files.filter((f) => f.includes("/")).map((f) => f.split("/")[0]))
        .filter((s, i, a) => a.indexOf(s) === i).filter((s) => parts && siteMatches(s, idx, parts.host));
      const perms = await getPerms(), match = tab.url ? matchingScripts(idx, tab.url) : [];
      const saved = {}; if (parts) match.forEach((f) => { const p = perms[permKey(parts.host, f)]; if (p) saved[f] = p.d; });
      reply({ idx, match, state, parts, sites, saved, pending: !!(await getReq(tab.id)) });
    })();
    return true;
  }
});
