// Site Works: small helpers shared by the extension's own pages.
/* exported UI */
var UI = (() => {
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const winPath = (f) => "sites\\" + String(f).replace(/\//g, "\\");
  const nicePath = (f) => String(f).split("/").join(" / ");

  // Message the background worker (only Site Works' own pages are listened to).
  const send = (msg) => new Promise((res, rej) => chrome.runtime.sendMessage(Object.assign({ siteWorks: true }, msg), (r) => {
    const e = chrome.runtime.lastError; if (e) rej(new Error(e.message)); else if (r && r.error) rej(new Error(r.error)); else res(r);
  }));
  const bg = (name, args) => send(Object.assign({}, args || {}, { siteWorks: name }));

  // The file helper (helper\siteworks-host.ps1), reached through native messaging.
  const HOST = "com.siteworks.helper";
  function helper(cmd, args) {
    return new Promise((res, rej) => {
      try {
        chrome.runtime.sendNativeMessage(HOST, Object.assign({ cmd }, args || {}), (r) => {
          const e = chrome.runtime.lastError;
          if (e) {
            const m = e.message || "";
            const err = new Error(/not found/i.test(m) ? "The file helper isn't installed. Double-click \"Install file helper.cmd\" in your SiteWorks folder, then try again."
              : /forbidden/i.test(m) ? "The file helper is installed for a different copy of Site Works. Run \"Install file helper.cmd\" again."
              : /exited/i.test(m) ? "The file helper stopped unexpectedly (is PowerShell blocked?)." : m);
            err.code = /not found/i.test(m) ? "missing" : /forbidden/i.test(m) ? "forbidden" : "failed";
            rej(err); return;
          }
          if (!r) { const err = new Error("No reply from the file helper."); err.code = "failed"; rej(err); return; }
          if (r.error) { const err = new Error(r.message || r.error); err.code = r.error; rej(err); return; }
          res(r);
        });
      } catch (e) { const err = new Error("This browser blocked native messaging: " + e.message); err.code = "missing"; rej(err); }
    });
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    const ta = el("textarea"); ta.value = text; ta.style.cssText = "position:fixed;top:-1000px"; document.body.append(ta); ta.select();
    const ok = document.execCommand("copy"); ta.remove(); return ok;
  }

  function toast(text, kind) {
    let t = $("sw-toast");
    if (!t) { t = el("div"); t.id = "sw-toast"; document.body.append(t); }
    t.textContent = text; t.className = "show " + (kind || "");
    clearTimeout(t._h); t._h = setTimeout(() => { t.className = ""; }, kind === "bad" ? 7000 : 3500);
  }

  function download(name, text) {
    const a = el("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/javascript" })); a.download = name;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  return { $, el, winPath, nicePath, send, bg, helper, copy, toast, download };
})();
