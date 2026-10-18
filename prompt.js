// Site Works request window: shows the scripts waiting for a decision on one tab.
const tabId = Number(new URLSearchParams(location.search).get("tab"));
const key = "req:" + tabId;
const root = document.getElementById("root");
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
let busy = false, current = null;
const ticked = {};   // keeps "Do not ask again" ticks when the list redraws

function send(file, allow, remember) {
  return new Promise((res) => chrome.runtime.sendMessage({ siteWorks: "decide", tabId, docId: current.docId, file, allow, remember }, () => res()));
}

async function decide(files, allow, rememberOf) {
  if (busy) return; busy = true;
  document.querySelectorAll("button").forEach((b) => { b.disabled = true; });
  for (const f of files) await send(f, allow, rememberOf(f));
  busy = false; render();
}

function render() {
  chrome.storage.session.get(key, (o) => {
    const req = o[key]; current = req;
    root.textContent = "";
    if (!req || !req.scripts.length) { root.append(el("div", "empty", "Nothing is waiting for a decision.")); setTimeout(() => window.close(), 600); return; }
    root.append(el("h1", null, req.scripts.length === 1 ? "A script is requesting permission to run on:" : req.scripts.length + " scripts are requesting permission to run on:"));
    root.append(el("div", "host", req.host));
    root.append(el("div", "url", req.url));
    const boxes = {};
    req.scripts.forEach((s) => {
      const c = el("div", "card");
      c.append(el("div", "lbl", "Requested script"));
      c.append(el("div", "path", s.file.split("/").join(" / ")));
      c.append(el("span", "why " + (s.reason === "changed" ? "changed" : "new"),
        s.reason === "changed" ? "Changed since you allowed it — check the code" : "No permission yet on this website"));
      const meta = el("div", "meta");
      meta.append("Website access: modify the current page (runs inside it, with its data and your sign-in) · SHA-256 " + s.hash.slice(0, 12) + "… · ");
      const a = el("a", null, "view code"); a.href = chrome.runtime.getURL("sites/" + s.file); a.target = "_blank"; meta.append(a);
      c.append(meta);
      const rem = el("label", "rem"), cb = el("input"); cb.type = "checkbox"; boxes[s.file] = cb;
      const txt = el("span"); txt.append(el("b", null, "Do not ask again")); txt.append(el("small", null, "Remember the decision for this script on " + req.host + "."));
      rem.append(cb, txt);
      const btns = el("div", "btns");
      const ok = el("button", "allow"), no = el("button", "reject");
      const label = () => {
        ok.innerHTML = "<b>ALLOW</b><span></span>"; ok.lastChild.textContent = cb.checked ? "Always run here" : "Run this time";
        no.innerHTML = "<b>REJECT</b><span></span>"; no.lastChild.textContent = cb.checked ? "Always block here" : "Do not run this time";
      };
      cb.checked = !!ticked[s.file];
      cb.onchange = () => { ticked[s.file] = cb.checked; label(); }; label();
      ok.onclick = () => decide([s.file], true, () => cb.checked);
      no.onclick = () => decide([s.file], false, () => cb.checked);
      btns.append(ok, no); c.append(btns, rem); root.append(c);
    });
    if (req.scripts.length > 1) {
      const all = el("div", "btns all"), ok = el("button", "allow"), no = el("button", "reject");
      ok.innerHTML = "<b>ALLOW ALL</b><span>each as ticked above</span>"; no.innerHTML = "<b>REJECT ALL</b><span>each as ticked above</span>";
      const files = req.scripts.map((s) => s.file), r = (f) => boxes[f].checked;
      ok.onclick = () => decide(files, true, r); no.onclick = () => decide(files, false, r);
      all.append(ok, no); root.append(all);
    }
  });
}

chrome.storage.onChanged.addListener((ch, area) => { if (area === "session" && ch[key] && !busy) render(); });
render();
