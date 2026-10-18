const $ = (id) => document.getElementById(id);
const li = (html) => { const e = document.createElement("li"); e.innerHTML = html; return e; };
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const win = (f) => esc("sites\\" + f.replace(/\//g, "\\"));
const STATE = {
  ran: '<span class="ok">✓ running</span>', waiting: '<span class="wait">? waiting for your permission</span>', pending: '<span class="wait">checking…</span>',
  rejected: '<span class="bad">✕ rejected this time</span>', blocked: '<span class="bad">✕ blocked</span>', failed: '<span class="bad">failed — see the log</span>'
};
$("manage").onclick = () => chrome.runtime.openOptionsPage();
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  $("review").onclick = () => chrome.runtime.sendMessage({ siteWorks: "review", tabId: tab.id }, () => window.close());
  chrome.runtime.sendMessage({ siteWorks: "status", tab: { id: tab.id, url: tab.url } }, (r) => {
    if (!r) return;
    $("url").textContent = r.parts ? r.parts.host + (r.parts.segs.length ? " / " + r.parts.segs.join(" / ") : " /") : "";
    $("site").textContent = r.sites.length ? "Site folder: sites\\" + r.sites.join(", sites\\") : "No site folder matches this website.";
    if (r.pending) $("review").classList.remove("hide");
    if (!r.match.length) $("match").append(li('<span class="dim">None match this URL.</span>'));
    r.match.forEach((f) => {
      const s = r.state[f] && r.state[f].s;
      const saved = r.saved[f] === "allow" ? '<span class="tag ok">always allowed here</span>' : r.saved[f] === "block" ? '<span class="tag bad">always blocked here</span>' : "";
      $("match").append(li(win(f) + " " + (STATE[s] || '<span class="dim">not checked yet</span>') + saved));
    });
    if (!r.idx.files.length) $("all").append(li('<span class="dim">' + (r.idx.missing ? "No sites\\index.json yet: double-click Rebuild index.cmd." : "No scripts found.") + "</span>"));
    r.idx.files.forEach((f) => $("all").append(li(win(f))));
    if (r.idx.built) $("built").textContent = "Index built " + new Date(r.idx.built).toLocaleString();
  });
});
