// Site Works: pick files (your scripts, and any files from your computer) and copy them as text.
const { $, el } = UI;
const items = [];      // { key, label, kind: "site"|"local", path?, file?, text?, size, image? }
const picked = new Set();
const LS = "siteWorksClip";
const load = () => { try { return JSON.parse(localStorage.getItem(LS) || "{}"); } catch (e) { return {}; } };
const store = (o) => { try { localStorage.setItem(LS, JSON.stringify(Object.assign(load(), o))); } catch (e) {} };
const lang = (n) => ({ js: "js", mjs: "js", ts: "ts", json: "json", html: "html", htm: "html", css: "css", md: "markdown", ps1: "powershell", cmd: "bat", bat: "bat", py: "python", txt: "", xml: "xml", csv: "csv", yml: "yaml", yaml: "yaml", sh: "bash" }[String(n).split(".").pop().toLowerCase()] ?? "");
const kb = (n) => n < 1024 ? n + " B" : (n / 1024).toFixed(n < 10240 ? 1 : 0) + " KB";

async function loadSiteFiles() {
  const idx = await SW.loadIndex();
  const paths = idx.files.slice();
  Object.keys(idx.sites).forEach((s) => { if ((idx.sites[s].hosts || []).length) paths.push(s + "/hosts.txt"); });
  paths.sort((a, b) => a.localeCompare(b));
  for (const p of paths) {
    let text = "";
    try { const r = await fetch(chrome.runtime.getURL("sites/" + p) + "?t=" + Date.now(), { cache: "no-store" }); if (!r.ok) continue; text = await r.text(); } catch (e) { continue; }
    items.push({ key: "s:" + p, label: p, kind: "site", path: p, text, size: new Blob([text]).size });
  }
  (load().picked || []).forEach((k) => { if (items.some((i) => i.key === k)) picked.add(k); });
}

async function addLocal(files) {
  for (const f of files) {
    const key = "l:" + f.name + ":" + f.size + ":" + f.lastModified;
    if (items.some((i) => i.key === key)) continue;
    const it = { key, label: f.name, kind: "local", file: f, size: f.size };
    if (/^image\//.test(f.type)) it.image = true;
    else if (f.size > 5 * 1024 * 1024) { UI.toast(f.name + " is over 5 MB - skipped.", "bad"); continue; }
    else {
      const buf = new Uint8Array(await f.arrayBuffer());
      if (buf.subarray(0, 8000).includes(0)) { UI.toast(f.name + " looks like a binary file - skipped.", "bad"); continue; }
      it.text = new TextDecoder().decode(buf).replace(/^﻿/, "");
    }
    items.push(it); picked.add(key);
  }
  render();
}

function shownPath(it) {
  if (it.kind === "local") return it.label;
  return $("pathStyle").value === "win" ? UI.winPath(it.path) : it.path;
}
function build() {
  const sel = items.filter((i) => picked.has(i.key)), fmt = $("fmt").value, text = sel.filter((i) => !i.image);
  if (fmt === "paths") return sel.map(shownPath).join("\n");
  return text.map((i) => {
    const body = i.text.replace(/\s+$/, "");
    if (fmt === "md") { const fence = body.includes("```") ? "````" : "```"; return "**" + shownPath(i) + "**\n" + fence + lang(i.label) + "\n" + body + "\n" + fence; }
    if (fmt === "hdr") return "// ===== " + shownPath(i) + " =====\n" + body;
    return body;
  }).join(fmt === "raw" ? "\n\n" : "\n\n");
}

function render() {
  const f = $("filter").value.trim().toLowerCase(), list = $("list"); list.textContent = "";
  const groups = [["Your sites folder", items.filter((i) => i.kind === "site")], ["From your computer", items.filter((i) => i.kind === "local")]];
  for (const [title, arr] of groups) {
    const shown = arr.filter((i) => !f || i.label.toLowerCase().includes(f));
    if (!arr.length) continue;
    list.append(el("div", "grp", title + " (" + arr.length + ")"));
    shown.forEach((i) => {
      const row = el("label", "item"), cb = el("input"); cb.type = "checkbox"; cb.checked = picked.has(i.key);
      cb.onchange = () => { cb.checked ? picked.add(i.key) : picked.delete(i.key); store({ picked: [...picked].filter((k) => k.startsWith("s:")) }); update(); };
      row.append(cb, el("span", "n", i.kind === "site" ? UI.nicePath(i.label) : i.label), el("span", "s", (i.image ? "image · " : "") + kb(i.size)));
      if (i.kind === "local") { const x = el("span", "x", "×"); x.title = "Remove from the list"; x.onclick = (e) => { e.preventDefault(); items.splice(items.indexOf(i), 1); picked.delete(i.key); render(); }; row.append(x); }
      list.append(row);
    });
  }
  if (!items.length) list.append(el("div", "empty", "No files yet."));
  update();
}

function update() {
  const out = build(), sel = items.filter((i) => picked.has(i.key)), imgs = sel.filter((i) => i.image);
  $("preview").value = out;
  const lines = out ? out.split("\n").length : 0;
  $("stats").textContent = sel.length + " file(s) · " + out.length.toLocaleString() + " characters · " + lines.toLocaleString() + " lines · about " + Math.ceil(out.length / 4).toLocaleString() + " tokens" +
    (imgs.length && $("fmt").value !== "paths" ? " · images aren't included in text" : "");
  $("copyImg").classList.toggle("hide", imgs.length !== 1);
  $("copy").disabled = !out;
}

async function copyImage() {
  const it = items.find((i) => picked.has(i.key) && i.image);
  try {
    const bmp = await createImageBitmap(it.file), c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
    c.getContext("2d").drawImage(bmp, 0, 0);
    const png = await new Promise((r) => c.toBlob(r, "image/png"));
    await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
    UI.toast("Image copied.", "good");
  } catch (e) { UI.toast("Couldn't copy the image: " + e.message, "bad"); }
}

$("filter").oninput = render;
$("all").onclick = () => { items.forEach((i) => { if (!$("filter").value || i.label.toLowerCase().includes($("filter").value.toLowerCase())) picked.add(i.key); }); store({ picked: [...picked].filter((k) => k.startsWith("s:")) }); render(); };
$("none").onclick = () => { picked.clear(); store({ picked: [] }); render(); };
$("fmt").onchange = () => { store({ fmt: $("fmt").value }); update(); };
$("pathStyle").onchange = () => { store({ pathStyle: $("pathStyle").value }); update(); };
$("pick").onclick = () => $("fileIn").click();
$("fileIn").onchange = () => { addLocal([...$("fileIn").files]); $("fileIn").value = ""; };
const drop = $("drop");
["dragenter", "dragover"].forEach((t) => document.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((t) => document.addEventListener(t, (e) => { e.preventDefault(); if (t === "drop" || !e.relatedTarget) drop.classList.remove("over"); }));
document.addEventListener("drop", (e) => { if (e.dataTransfer && e.dataTransfer.files.length) addLocal([...e.dataTransfer.files]); });
$("copy").onclick = async () => { const t = build(); if (t && await UI.copy(t)) UI.toast("Copied " + items.filter((i) => picked.has(i.key) && !i.image).length + " file(s) to the clipboard.", "good"); };
$("copyImg").onclick = copyImage;

const saved = load();
if (saved.fmt) $("fmt").value = saved.fmt;
if (saved.pathStyle) $("pathStyle").value = saved.pathStyle;
loadSiteFiles().then(render);
