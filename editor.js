// Site Works script editor: new scripts for a page, or edits to an existing one.
// Saving goes through the file helper, which writes into sites\ and rebuilds the index.
const { $, el, winPath } = UI;
const q = new URLSearchParams(location.search);
const tabId = q.get("tab") ? Number(q.get("tab")) : null;
let pageUrl = q.get("url") || "";
let file = q.get("file") || "";            // set = editing an existing script
let idx = null, loadedHash = null, loadedHosts = "", dirty = false, nameTouched = false;
const NEW = "__new__", ROOT = "__root__";
let parts = [];                             // [{ name, on, custom }]
let hostOnly = false;

let page = null; try { if (pageUrl) page = SW.urlParts(pageUrl); } catch (e) { page = null; }

function template(where) {
  return "// " + ($("name").value || "my-script.js").replace(/\.js$/i, "") + " - what this script does.\n" +
    "// Runs on: " + where + "\n" +
    "// Site Works runs it inside the page once it has loaded (like pasting it into the\n" +
    "// Console), once per page load, after you allow it.\n" +
    "(() => {\n  \"use strict\";\n\n  \n})();\n";
}

// ---------------------------------------------------------------- "where it runs"

function chosenSite() {
  const v = $("site").value;
  if (v === ROOT) return "";
  if (v === NEW) return $("newSite").value.trim();
  return v;
}
function pathNow() {
  if (file) return file;
  const site = chosenSite(), name = ($("name").value.trim() || "my-script.js").replace(/[\\/]/g, "-");
  const nm = /\.js$/i.test(name) ? name : name + ".js";
  if ($("site").value === ROOT) return nm;
  const segs = [site];
  if (hostOnly && page) segs.push(page.host);
  parts.filter((p) => p.on).forEach((p) => segs.push(p.name));
  return segs.concat(nm).filter(Boolean).join("/");
}
function hostsFromBox() { return $("hostsBox").value.split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith("#")); }

// A copy of the index as it will be after saving, to check the match before writing anything.
function futureIndex(path) {
  const o = { sites: JSON.parse(JSON.stringify(idx.sites)), files: idx.files.concat(idx.files.includes(path) ? [] : [path]) };
  const site = path.includes("/") ? path.split("/")[0] : null;
  if (site && !$("hostsRow").classList.contains("hide")) o.sites[site] = { hosts: hostsFromBox() };
  return o;
}

function renderWhere() {
  const path = pathNow();
  $("path").textContent = winPath(path);
  const root = !file && $("site").value === ROOT;
  $("partsRow").classList.toggle("hide", !!file || root);
  $("newSite").classList.toggle("hide", !!file || $("site").value !== NEW);
  const site = path.includes("/") ? path.split("/")[0] : "";
  // "Only on <host>" when the site folder covers more than this exact host.
  const multi = !file && page && site && !root && site.toLowerCase() !== page.host && SW.siteMatches(site, futureIndex(path), page.host);
  $("hostRow").classList.toggle("hide", !multi);
  if (!multi) hostOnly = false;
  $("hostChip").textContent = "";
  if (multi) { const c = el("span", "chip" + (hostOnly ? " on" : ""), page.host); c.onclick = () => { hostOnly = !hostOnly; renderWhere(); }; $("hostChip").append(c); }
  // chips
  const pc = $("parts"); pc.textContent = "";
  parts.forEach((p, i) => {
    const c = el("span", "chip" + (p.on ? " on" : ""), p.name);
    c.title = p.on ? "Lit: the URL path must contain this part" : "Click to require this part";
    c.onclick = () => { p.on = !p.on; autoName(); renderWhere(); };
    if (p.custom) { const x = el("span", "x", "×"); x.onclick = (e) => { e.stopPropagation(); parts.splice(i, 1); renderWhere(); }; c.append(x); }
    pc.append(c);
  });
  if (!parts.length) pc.append(el("span", "dim", page ? "(this page has no path)" : "(no page: type parts)"));
  // hosts.txt row: any site folder
  $("hostsRow").classList.toggle("hide", !!file || root || !site);
  // verdict
  const v = $("verdict");
  if (!page) { v.textContent = "—"; v.className = "dim"; }
  else {
    const ok = SW.fileMatches(futureIndex(path), path, page);
    v.textContent = ok ? "✓ will run on this page (after you allow it)" : "✗ won't run on this page with these folders";
    v.className = ok ? "ok" : "bad";
  }
  const rel = !root && site ? (site.includes(".") ? "matches " + site + " and its subdomains" + (hostsFromBox().length ? " — but hosts.txt decides" : "") :
    hostsFromBox().length ? "matches the hosts in hosts.txt" : "matches any host with “" + site + "” as one part (e.g. www." + site.toLowerCase() + ".com)") : root ? "runs on every page of every website" : "";
  $("siteNote").textContent = rel;
}

function autoName() {
  if (nameTouched || file) return;
  const lit = parts.filter((p) => p.on).map((p) => p.name);
  const base = (lit[lit.length - 1] || chosenSite() || "everywhere").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "") || "my";
  $("name").value = base + "-tweaks.js";
}

async function loadHostsTxt(site) {
  loadedHosts = "";
  if (!site) { $("hostsBox").value = ""; return; }
  try { const r = await fetch(chrome.runtime.getURL("sites/" + site + "/hosts.txt") + "?t=" + Date.now(), { cache: "no-store" }); if (r.ok) loadedHosts = (await r.text()).split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#")).map((l) => l.trim()).join("\n"); } catch (e) {}
  $("hostsBox").value = loadedHosts;
}

// ---------------------------------------------------------------- saving

function showNoHelper(err) {
  const b = $("noHelper"); b.classList.remove("hide"); b.textContent = "";
  b.append(el("b", null, "Couldn't save: "), err.message, el("br"));
  b.append("Until the helper is installed you can Copy code or Download .js, then put the file at ");
  b.append(el("code", null, winPath(pathNow())), " and double-click Rebuild index.cmd.");
}
async function save(reload) {
  const path = pathNow(), text = $("code").value;
  if (!file && $("site").value === NEW && !chosenSite()) { UI.toast("Type a name for the new site folder.", "bad"); $("newSite").focus(); return; }
  $("status").textContent = "Saving…"; $("noHelper").classList.add("hide");
  const attempt = (overwrite, expectHash) => UI.helper("write", { path, text, overwrite, expectHash });
  let r;
  try { r = await attempt(!!file, file ? loadedHash : undefined); }
  catch (e) {
    if (e.code === "exists" && confirm(e.message + "\n\nReplace it with this code?")) r = await attempt(true).catch((e2) => { $("status").textContent = e2.message; });
    else if (e.code === "changed" && confirm(e.message + "\n\nOverwrite it anyway?")) r = await attempt(true).catch((e2) => { $("status").textContent = e2.message; });
    else if (e.code === "missing" || e.code === "forbidden" || e.code === "failed" && /helper/i.test(e.message)) { showNoHelper(e); $("status").textContent = ""; return; }
    else { $("status").textContent = ""; UI.toast(e.message, "bad"); return; }
    if (!r) return;
  }
  // hosts.txt for the site folder, if changed
  const site = path.includes("/") ? path.split("/")[0] : "";
  if (!file && site && !$("hostsRow").classList.contains("hide") && hostsFromBox().join("\n") !== loadedHosts) {
    try { await UI.helper("hosts", { site, hosts: hostsFromBox() }); loadedHosts = hostsFromBox().join("\n"); } catch (e) { UI.toast("Saved the script, but not hosts.txt: " + e.message, "bad"); }
  }
  let kept = 0;
  if (file && $("keep").checked && r.hash && r.hash !== loadedHash) { try { kept = (await UI.bg("rehash", { file: path, hash: r.hash })).n; } catch (e) {} }
  loadedHash = r.hash; dirty = false;
  const wasNew = !file;
  if (wasNew) { file = path; const u = new URL(location.href); u.searchParams.set("file", path); history.replaceState(null, "", u); await setupEdit(); }
  $("status").textContent = (wasNew ? "Created " : "Saved ") + winPath(path) + " · index rebuilt (" + (r.files || []).length + " scripts)" + (kept ? " · kept “always allow” on " + kept + " website(s)" : "");
  UI.toast("Saved " + winPath(path), "good");
  if (reload && tabId != null) { try { await chrome.tabs.reload(tabId); await chrome.tabs.update(tabId, { active: true }); } catch (e) { UI.toast("That tab is gone.", "bad"); } }
}

// ---------------------------------------------------------------- modes

async function setupEdit() {
  document.title = "Site Works — " + file.split("/").pop();
  $("intro").textContent = "Editing " + winPath(file) + ".";
  ["site", "newSite", "extra"].forEach((id) => { $(id).disabled = true; });
  $("name").value = file.split("/").pop(); $("name").disabled = true;
  ["openEd", "trash"].forEach((id) => $(id).classList.remove("hide"));
  const perms = (await chrome.storage.local.get("perms")).perms || {};
  $("keepWrap").classList.toggle("hide", !Object.keys(perms).some((k) => k.endsWith("|" + file) && perms[k].d === "allow"));
  if (!page) $("urlRow").classList.add("hide");
  renderWhere();
}

async function init() {
  idx = await SW.loadIndex();
  if (file) {
    if (!idx.files.includes(file)) UI.toast("That script isn't in the index (was it removed?).", "bad");
    try { $("code").value = await SW.scriptText(file); loadedHash = await SW.scriptHash(file); } catch (e) { UI.toast("Couldn't read " + winPath(file), "bad"); }
    $("pageUrl").textContent = pageUrl;
    await setupEdit();
  } else {
    $("intro").textContent = page ? "A new script for this page. Pick the folders it lives in — that's what decides where it runs." : "A new script. Pick the folders it lives in — that's what decides where it runs.";
    $("pageUrl").textContent = pageUrl || "(none)";
    if (!pageUrl) $("urlRow").classList.add("hide");
    const s = $("site");
    s.append(new Option("Every website (sites\\ itself)", ROOT));
    const names = Object.keys(idx.sites).concat(idx.files.filter((f) => f.includes("/")).map((f) => f.split("/")[0])).filter((x, i, a) => a.indexOf(x) === i).sort((a, b) => a.localeCompare(b));
    const covering = page ? names.filter((n) => SW.siteMatches(n, idx, page.host)) : [];
    names.forEach((n) => s.append(new Option(n + (covering.includes(n) ? "   ✓ covers this page" : ""), n)));
    s.append(new Option("New site folder…", NEW));
    if (covering.length) s.value = covering[0];
    else { s.value = NEW; $("newSite").value = page ? page.host.replace(/^www\./, "") : ""; }
    if (page) parts = page.segs.map((n) => ({ name: n, on: false }));
    await loadHostsTxt(s.value === NEW || s.value === ROOT ? "" : s.value);
    autoName();
    const where = () => { const p = pathNow(); return p.includes("/") ? winPath(p).replace(/\\[^\\]+$/, "\\") : "every website"; };
    $("code").value = template(where());
    renderWhere();
  }
}

// ---------------------------------------------------------------- events

$("site").onchange = async () => { const v = $("site").value; await loadHostsTxt(v === NEW || v === ROOT ? "" : v); autoName(); renderWhere(); };
$("newSite").oninput = () => { autoName(); renderWhere(); };
$("name").oninput = () => { nameTouched = true; renderWhere(); };
$("hostsBox").oninput = renderWhere;
$("extra").onkeydown = (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  $("extra").value.split(/[\\/]/).map((s) => s.trim()).filter(Boolean).forEach((n) => parts.push({ name: n.toLowerCase(), on: true, custom: true }));
  $("extra").value = ""; autoName(); renderWhere();
};
$("code").oninput = () => { dirty = true; };
$("code").onkeydown = (e) => {
  if (e.key === "Tab" && !e.ctrlKey && !e.altKey) { e.preventDefault(); document.execCommand("insertText", false, "  "); }
};
document.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(false); } });
window.addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
$("save").onclick = () => save(false);
$("saveReload").onclick = () => save(true);
if (tabId == null) $("saveReload").classList.add("hide");
$("copy").onclick = async () => { if (await UI.copy($("code").value)) UI.toast("Code copied."); };
$("dl").onclick = () => UI.download(pathNow().split("/").pop(), $("code").value);
$("openEd").onclick = () => UI.helper("edit", { path: file }).then(() => UI.toast("Opened in your text editor. Reload this editor after saving there."), (e) => UI.toast(e.message, "bad"));
$("reveal").onclick = () => UI.helper("reveal", { path: file || undefined }).catch((e) => UI.toast(e.message, "bad"));
$("trash").onclick = async () => {
  if (!confirm("Move " + winPath(file) + " to the SiteWorks trash folder?\n\nIt stops running everywhere. You can move it back from SiteWorks\\trash.")) return;
  try { await UI.helper("trash", { path: file }); dirty = false; UI.toast("Moved to trash.", "good"); setTimeout(() => { location.href = "manage.html"; }, 800); } catch (e) { UI.toast(e.message, "bad"); }
};

init();
