// Site Works: switch, file helper, remembered decisions, scripts and the log.
const { $, el, nicePath, winPath } = UI;
const when = (t) => new Date(t).toLocaleString();
const where = (h) => h === "*" ? "every website" : h;
const hashes = {};
const hashOf = async (file) => (file in hashes) ? hashes[file] : (hashes[file] = await SW.scriptHash(file).catch(() => null));
const getPerms = async () => (await chrome.storage.local.get("perms")).perms || {};
const td = (cls, text) => el("td", cls, text);
const emptyRow = (tb, n, text) => { const c = td("empty", text); c.colSpan = n; tb.append(el("tr")).append(c); };
async function setPerm(k, v) { const perms = await getPerms(); if (v) perms[k] = v; else delete perms[k]; await chrome.storage.local.set({ perms }); }
async function note(host, file, ev, detail) {
  const list = (await chrome.storage.local.get("log")).log || [];
  list.push({ t: Date.now(), host, url: "", file, ev, note: detail || "changed on the Manage page" });
  if (list.length > 1000) list.splice(0, list.length - 1000);
  await chrome.storage.local.set({ log: list });
}

// ---------------------------------------------------------------- switch + paused websites

async function renderSwitch() {
  const o = await chrome.storage.local.get(["enabled", "paused"]), on = o.enabled !== false, paused = o.paused || [];
  $("on").checked = on; $("onLbl").textContent = on ? "On" : "Off";
  $("onNote").textContent = on ? "Scripts run where you've allowed them." : "OFF everywhere: nothing new runs. Scripts already in a page stop when it reloads.";
  const p = $("paused"); p.textContent = "";
  if (!paused.length) { p.append(el("span", "dim", "Not paused on any website.")); return; }
  p.append(el("span", "dim", "Paused on: "));
  paused.forEach((h) => { const b = el("button", null, h + "  ▶ resume"); b.onclick = () => UI.bg("setPaused", { host: h, pause: false }); p.append(b, " "); });
}
$("on").onchange = () => UI.bg("setEnabled", { on: $("on").checked });

// ---------------------------------------------------------------- file helper

async function checkHelper() {
  const s = $("helperState"), n = $("helperNote");
  s.textContent = "checking…"; s.className = "pill";
  try {
    const r = await UI.helper("ping");
    s.textContent = "Connected"; s.className = "pill ok";
    n.textContent = "Version " + r.version + " · PowerShell " + r.ps + " · " + r.root;
    ["rebuild", "openFolder"].forEach((id) => { $(id).disabled = false; });
  } catch (e) {
    s.textContent = e.code === "missing" ? "Not installed" : "Problem"; s.className = "pill bad";
    n.textContent = "";
    n.append(e.message, el("br"), "Without it, add scripts by hand and double-click ", el("code", null, "Rebuild index.cmd"), ".");
    ["rebuild", "openFolder"].forEach((id) => { $(id).disabled = true; });
  }
}
$("recheck").onclick = checkHelper;
$("rebuild").onclick = async () => { try { const r = await UI.helper("rebuild"); UI.toast("Index rebuilt: " + r.files.length + " script(s).", "good"); renderScripts(); } catch (e) { UI.toast(e.message, "bad"); } };
$("openFolder").onclick = () => UI.helper("reveal", {}).catch((e) => UI.toast(e.message, "bad"));
$("keys").onclick = () => chrome.tabs.create({ url: "chrome://extensions/shortcuts" });

// ---------------------------------------------------------------- remembered decisions

async function renderPerms() {
  const perms = await getPerms(), tb = $("perms"); tb.textContent = "";
  for (const k in hashes) delete hashes[k];
  const keys = Object.keys(perms).sort((a, b) => (a.startsWith("*|") ? -1 : 0) - (b.startsWith("*|") ? -1 : 0) || a.localeCompare(b));
  if (!keys.length) { emptyRow(tb, 6, "None yet. Tick “Do not ask again” in a request window to remember a decision."); return; }
  for (const k of keys) {
    const i = k.indexOf("|"), host = k.slice(0, i), file = k.slice(i + 1), p = perms[k];
    const tr = el("tr");
    tr.append(td(host === "*" ? "warn" : null, where(host)), td("f", nicePath(file)),
      td(p.d === "allow" ? "allow" : "block", p.d === "allow" ? "Always allow" : "Always block"), td("dim", when(p.at)));
    const cur = td("dim", "…"); tr.append(cur);
    const act = td("act"), revoke = el("button", null, "Revoke"), flip = el("button", null, p.d === "allow" ? "Block" : "Allow");
    revoke.title = "Forget this decision: Site Works will ask next time";
    revoke.onclick = async () => { await setPerm(k); await note(where(host), file, "decision revoked"); };
    flip.onclick = async () => {
      if (p.d === "allow") { await setPerm(k, { d: "block", at: Date.now() }); await note(where(host), file, "always blocked"); return; }
      const h = await hashOf(file); if (!h) { UI.toast("That script file no longer exists.", "bad"); return; }
      if (!confirm("Always allow " + file + " on " + where(host) + "?\n\nThis approves the file as it is now. If it changes, Site Works will ask again.")) return;
      await setPerm(k, { d: "allow", hash: h, at: Date.now() }); await note(where(host), file, "always allowed");
    };
    act.append(flip, " ", revoke); tr.append(act); tb.append(tr);
    hashOf(file).then((h) => {
      if (h == null) { cur.textContent = "missing"; cur.className = "warn"; }
      else if (p.d !== "allow") cur.textContent = "—";
      else if (h === p.hash) cur.textContent = "unchanged since allowed";
      else { cur.textContent = "changed — will ask again"; cur.className = "warn"; }
    });
  }
}
$("forget").onclick = async () => { if (confirm("Forget every remembered decision? Every script will ask again before it runs.")) await UI.bg("forget", {}); };
$("export").onclick = async () => {
  const perms = await getPerms(), stamp = new Date().toISOString().slice(0, 10);
  const a = el("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify({ siteWorksDecisions: 1, exported: new Date().toISOString(), perms }, null, 2)], { type: "application/json" }));
  a.download = "siteworks-decisions-" + stamp + ".json"; document.body.append(a); a.click(); a.remove();
};
$("import").onclick = () => $("importFile").click();
$("importFile").onchange = async () => {
  const f = $("importFile").files[0]; $("importFile").value = ""; if (!f) return;
  let o; try { o = JSON.parse(await f.text()); } catch (e) { UI.toast("That isn't a JSON file.", "bad"); return; }
  const inc = o && o.siteWorksDecisions && o.perms; if (!inc || typeof inc !== "object") { UI.toast("No Site Works decisions in that file.", "bad"); return; }
  const good = Object.keys(inc).filter((k) => k.includes("|") && inc[k] && (inc[k].d === "block" || (inc[k].d === "allow" && typeof inc[k].hash === "string")));
  if (!confirm("Import " + good.length + " decision(s) from " + f.name + "?\nThey replace any you have for the same script and website. “Always allow” only applies while the script is unchanged.")) return;
  const perms = await getPerms(); good.forEach((k) => { perms[k] = { d: inc[k].d, hash: inc[k].hash, at: inc[k].at || Date.now() }; if (inc[k].d === "block") delete perms[k].hash; });
  await chrome.storage.local.set({ perms }); await note("", "", "decisions imported", good.length + " from " + f.name);
  UI.toast("Imported " + good.length + " decision(s).", "good");
};

// ---------------------------------------------------------------- scripts

async function renderScripts() {
  const idx = await SW.loadIndex(), perms = await getPerms(), tb = $("scripts"); tb.textContent = "";
  $("built").textContent = idx.built ? "Index built " + when(idx.built) + "." : "No sites\\index.json yet: Rebuild index.";
  if (!idx.files.length) { emptyRow(tb, 4, "No scripts listed."); return; }
  for (const f of idx.files) {
    const on = (d) => Object.keys(perms).filter((k) => k.endsWith("|" + f) && perms[k].d === d).map((k) => where(k.split("|")[0]));
    const a = on("allow"), b = on("block"), tr = el("tr");
    tr.append(td("f", nicePath(f)), td(a.length ? "allow" : "dim", a.join(", ") || "nowhere (asks first)"), td(b.length ? "block" : "dim", b.join(", ") || "—"));
    const act = td("act");
    const ed = el("a", "btn", "Edit"); ed.href = "editor.html?file=" + encodeURIComponent(f);
    const ext = el("button", null, "Text editor"); ext.title = "Open in VS Code or Notepad (file helper)";
    ext.onclick = () => UI.helper("edit", { path: f }).catch((e) => UI.toast(e.message, "bad"));
    const fg = el("button", null, "Forget"); fg.title = "Forget this script's decisions on every website"; fg.disabled = !a.length && !b.length;
    fg.onclick = () => { if (confirm("Forget every decision for " + f + "?")) UI.bg("forget", { file: f }); };
    const tr2 = el("button", "danger", "Trash"); tr2.title = "Move to SiteWorks\\trash (file helper)";
    tr2.onclick = async () => {
      if (!confirm("Move " + winPath(f) + " to the SiteWorks trash folder?\nIt stops running everywhere. You can move it back from SiteWorks\\trash.")) return;
      try { await UI.helper("trash", { path: f }); UI.toast("Moved to trash.", "good"); renderScripts(); } catch (e) { UI.toast(e.message, "bad"); }
    };
    act.append(ed, " ", ext, " ", fg, " ", tr2); tr.append(act); tb.append(tr);
  }
}

// ---------------------------------------------------------------- log

async function renderLog() {
  const list = ((await chrome.storage.local.get("log")).log || []).slice().reverse();
  const qq = $("filter").value.trim().toLowerCase(), tb = $("log"); tb.textContent = "";
  const rows = qq ? list.filter((e) => [e.host, e.file, e.ev, e.note, e.url].join(" ").toLowerCase().includes(qq)) : list;
  $("count").textContent = rows.length + " of " + list.length + " entries (newest first; the last 1000 are kept)";
  if (!rows.length) { emptyRow(tb, 5, "Nothing logged yet."); return; }
  for (const e of rows.slice(0, 500)) {
    const tr = el("tr"), cls = /^always/.test(e.ev) ? "ev-always" : "ev-" + String(e.ev).split(" ")[0];
    const det = td("dim f", e.note || ""); if (e.url) det.title = e.url;
    tr.append(td("dim", when(e.t)), td(null, e.host || ""), td("f", nicePath(e.file || "")), td(cls, e.ev), det);
    tb.append(tr);
  }
}
$("clear").onclick = async () => { if (confirm("Clear the whole log?")) await chrome.storage.local.set({ log: [] }); };
$("filter").oninput = renderLog;

chrome.storage.onChanged.addListener((ch, area) => {
  if (area !== "local") return;
  if (ch.perms) { renderPerms(); renderScripts(); }
  if (ch.log) renderLog();
  if (ch.enabled || ch.paused) renderSwitch();
});
renderSwitch(); checkHelper(); renderPerms(); renderScripts(); renderLog();
