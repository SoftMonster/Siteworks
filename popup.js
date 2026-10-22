const { $, el, winPath } = UI;
const STATE = {
  ran: ["ok", "✓ running"], waiting: ["wait", "? waiting for your permission"], pending: ["wait", "checking…"],
  rejected: ["bad", "✕ rejected this time"], blocked: ["bad", "✕ blocked"], failed: ["bad", "failed - see the log"]
};
const msg = (t, cls) => { $("msg").textContent = t; $("msg").className = cls || "dim"; };
const openTab = (path) => { chrome.tabs.create({ url: chrome.runtime.getURL(path) }); window.close(); };

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const web = /^https?:/.test(tab.url || "");
  const render = () => UI.bg("status", { tab: { id: tab.id, url: tab.url } }).then(show, (e) => msg(e.message, "bad"));

  function show(r) {
    $("on").checked = r.enabled; $("onLbl").textContent = r.enabled ? "On" : "Off";
    $("url").textContent = r.parts ? r.parts.host + (r.parts.segs.length ? " / " + r.parts.segs.join(" / ") : " /") : (web ? "" : "Site Works only works on http(s) pages.");
    $("site").textContent = r.sites.length ? "Site folder: sites\\" + r.sites.join(", sites\\") : r.parts ? "No site folder matches this website." : "";
    $("pause").classList.toggle("hide", !r.parts || !r.enabled);
    $("pause").textContent = r.paused ? "Resume on this site" : "Pause on this site";
    const b = $("banner");
    b.classList.toggle("hide", r.enabled && !r.paused);
    b.textContent = !r.enabled ? "Site Works is OFF everywhere: nothing new runs. Scripts already in a page stop when it reloads." : r.paused ? "Paused on " + r.parts.host + ": nothing new runs here until you resume." : "";
    $("review").classList.toggle("hide", !r.pending);
    $("toolbox").disabled = !web || !r.toolbox; if (!r.toolbox) $("toolbox").title = "No sites\\00-toolbox.js in your index";
    $("newScript").disabled = !web;
    $("forgetSite").disabled = !r.siteDecisions; $("forgetSite").textContent = "Forget this site's decisions" + (r.siteDecisions ? " (" + r.siteDecisions + ")" : "");
    const m = $("match"); m.textContent = "";
    if (!r.match.length) m.append(el("li", "dim", "None match this URL."));
    r.match.forEach((f) => {
      const li = el("li"), s = r.state[f] && r.state[f].s, st = STATE[s] || ["dim", "not checked yet"];
      li.append(winPath(f) + " ", el("span", st[0], st[1]));
      const saved = r.saved[f];
      if (saved) {
        li.append(el("span", "tag " + (saved.d === "allow" ? "ok" : "bad"), "always " + (saved.d === "allow" ? "allowed" : "blocked") + (saved.all ? " everywhere" : " here")));
        const fg = el("a", "mini", "forget"); fg.title = "Ask again next time";
        fg.onclick = () => UI.bg("forget", { host: saved.all ? "*" : r.parts.host, file: f }).then(() => { msg("Forgot that decision - it will ask next time."); render(); });
        li.append(fg);
      }
      const ed = el("a", "mini", "edit"); ed.onclick = () => openTab("editor.html?file=" + encodeURIComponent(f) + "&tab=" + tab.id + "&url=" + encodeURIComponent(tab.url));
      li.append(ed); m.append(li);
    });
    const all = $("all"); all.textContent = "";
    if (!r.idx.files.length) all.append(el("li", "dim", r.idx.missing ? "No sites\\index.json yet: Rebuild index." : "No scripts found."));
    r.idx.files.forEach((f) => all.append(el("li", null, winPath(f))));
    $("built").textContent = r.idx.built ? "Index built " + new Date(r.idx.built).toLocaleString() : "";
    $("forgetSite").onclick = () => {
      if (!confirm("Forget all " + r.siteDecisions + " remembered decision(s) for " + r.parts.host + "?\nScripts will ask again next time.")) return;
      UI.bg("forget", { host: r.parts.host }).then((x) => { msg("Forgot " + x.n + " decision(s) for " + r.parts.host + "."); render(); });
    };
    $("pause").onclick = () => UI.bg("setPaused", { host: r.parts.host, pause: !r.paused }).then(render);
  }

  $("on").onchange = () => UI.bg("setEnabled", { on: $("on").checked }).then(render);
  $("review").onclick = () => UI.bg("review", { tabId: tab.id }).then(() => window.close());
  $("toolbox").onclick = () => UI.bg("toolbox", { tabId: tab.id }).then(() => window.close());
  $("newScript").onclick = () => openTab("editor.html?tab=" + tab.id + "&url=" + encodeURIComponent(tab.url));
  $("clip").onclick = () => openTab("clip.html");
  $("manage").onclick = () => openTab("manage.html");
  $("rebuild").onclick = async () => {
    msg("Rebuilding…");
    try { const r = await UI.helper("rebuild"); msg("Index rebuilt: " + r.files.length + " script(s). Reload the page to use new ones.", "ok"); render(); }
    catch (e) { msg(e.message, "bad"); }
  };
  render();
});
