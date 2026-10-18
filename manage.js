// Site Works: review and revoke remembered decisions, read the log.
const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const when = (t) => new Date(t).toLocaleString();
const hashes = {};

async function hashOf(file) {
  if (file in hashes) return hashes[file];
  try {
    const r = await fetch(chrome.runtime.getURL("sites/" + file) + "?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return (hashes[file] = null);
    const d = new Uint8Array(await crypto.subtle.digest("SHA-256", await r.arrayBuffer()));
    return (hashes[file] = Array.from(d, (b) => b.toString(16).padStart(2, "0")).join(""));
  } catch (e) { return (hashes[file] = null); }
}
async function loadIndex() {
  try { const r = await fetch(chrome.runtime.getURL("sites/index.json") + "?t=" + Date.now(), { cache: "no-store" }); if (r.ok) return await r.json(); } catch (e) {}
  return { files: [] };
}
const getPerms = async () => (await chrome.storage.local.get("perms")).perms || {};
async function setPerm(k, v) {
  const perms = await getPerms(); if (v) perms[k] = v; else delete perms[k];
  await chrome.storage.local.set({ perms });
}
async function note(host, file, ev) {
  const list = (await chrome.storage.local.get("log")).log || [];
  list.push({ t: Date.now(), host, url: "", file, ev, note: "changed on the Manage page" });
  if (list.length > 1000) list.splice(0, list.length - 1000);
  await chrome.storage.local.set({ log: list });
}

async function renderPerms() {
  const perms = await getPerms(), tb = $("perms"); tb.textContent = "";
  for (const k in hashes) delete hashes[k];
  const keys = Object.keys(perms).sort();
  if (!keys.length) { const td = el("td", "empty", "None yet. Tick “Do not ask again” in a request window to remember a decision."); td.colSpan = 6; tb.append(el("tr")).append(td); return; }
  for (const k of keys) {
    const i = k.indexOf("|"), host = k.slice(0, i), file = k.slice(i + 1), p = perms[k];
    const tr = el("tr");
    tr.append(el("td", null, host), el("td", "f", file.split("/").join(" / ")),
      el("td", p.d === "allow" ? "allow" : "block", p.d === "allow" ? "Always allow" : "Always block"), el("td", "dim", when(p.at)));
    const cur = el("td", "dim", "…"); tr.append(cur);
    const act = el("td"), revoke = el("button", null, "Revoke"), flip = el("button", null, p.d === "allow" ? "Block" : "Allow");
    revoke.title = "Forget this decision: Site Works will ask next time";
    revoke.onclick = async () => { await setPerm(k); await note(host, file, "decision revoked"); };
    flip.onclick = async () => {
      if (p.d === "allow") { await setPerm(k, { d: "block", at: Date.now() }); await note(host, file, "always blocked"); return; }
      const h = await hashOf(file); if (!h) { alert("That script file no longer exists."); return; }
      if (!confirm("Always allow " + file + " on " + host + "?\n\nThis approves the file as it is now. If it changes, Site Works will ask again.")) return;
      await setPerm(k, { d: "allow", hash: h, at: Date.now() }); await note(host, file, "always allowed");
    };
    act.append(flip, " ", revoke); tr.append(act); tb.append(tr);
    hashOf(file).then((h) => {
      if (h == null) { cur.textContent = "missing"; cur.className = "warn"; }
      else if (p.d !== "allow") cur.textContent = "—";
      else if (h === p.hash) { cur.textContent = "unchanged since allowed"; }
      else { cur.textContent = "changed — will ask again"; cur.className = "warn"; }
    });
  }
}

async function renderScripts() {
  const idx = await loadIndex(), perms = await getPerms(), tb = $("scripts"); tb.textContent = "";
  const files = Array.isArray(idx.files) ? idx.files : [];
  $("built").textContent = idx.built ? "Index built " + when(idx.built) + ". Add or remove scripts, then double-click Rebuild index.cmd." : "No sites\\index.json yet: double-click Rebuild index.cmd.";
  if (!files.length) { const td = el("td", "empty", "No scripts listed."); td.colSpan = 3; tb.append(el("tr")).append(td); return; }
  for (const f of files) {
    const on = (d) => Object.keys(perms).filter((k) => k.endsWith("|" + f) && perms[k].d === d).map((k) => k.split("|")[0]);
    const a = on("allow"), b = on("block");
    const tr = el("tr");
    tr.append(el("td", "f", f.split("/").join(" / ")), el("td", a.length ? "allow" : "dim", a.join(", ") || "nowhere (asks first)"), el("td", b.length ? "block" : "dim", b.join(", ") || "—"));
    tb.append(tr);
  }
}

async function renderLog() {
  const list = ((await chrome.storage.local.get("log")).log || []).slice().reverse();
  const q = $("filter").value.trim().toLowerCase(), tb = $("log"); tb.textContent = "";
  const rows = q ? list.filter((e) => [e.host, e.file, e.ev, e.note, e.url].join(" ").toLowerCase().includes(q)) : list;
  $("count").textContent = rows.length + " of " + list.length + " entries (newest first; the last 1000 are kept)";
  if (!rows.length) { const td = el("td", "empty", "Nothing logged yet."); td.colSpan = 5; tb.append(el("tr")).append(td); return; }
  for (const e of rows.slice(0, 500)) {
    const tr = el("tr"), cls = /^always/.test(e.ev) ? "ev-always" : "ev-" + String(e.ev).split(" ")[0];
    const det = el("td", "dim f", e.note || ""); if (e.url) det.title = e.url;
    tr.append(el("td", "dim", when(e.t)), el("td", null, e.host || ""), el("td", "f", (e.file || "").split("/").join(" / ")), el("td", cls, e.ev), det);
    tb.append(tr);
  }
}

$("forget").onclick = async () => { if (confirm("Forget every remembered decision? Every script will ask again before it runs.")) { await chrome.storage.local.set({ perms: {} }); await note("", "", "all decisions forgotten"); } };
$("clear").onclick = async () => { if (confirm("Clear the whole log?")) await chrome.storage.local.set({ log: [] }); };
$("filter").oninput = renderLog;
chrome.storage.onChanged.addListener((ch, area) => {
  if (area !== "local") return;
  if (ch.perms) { renderPerms(); renderScripts(); }
  if (ch.log) renderLog();
});
renderPerms(); renderScripts(); renderLog();
