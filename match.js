// Site Works: folder -> URL matching, shared by the background worker and the
// extension's pages (the editor uses it to show what a folder will match).
//
//   sites\*.js                   every page of every website
//   sites\<Site>\*.js            every page of that site
//   sites\<Site>\A\B\name.js     pages whose path holds A then B (gaps allowed)
//
// <Site>: its hosts.txt hosts (plus subdomains); else a name with a dot is that
// host; else the name must be one dot-separated part of the host (Google ->
// mail.google.co.uk). A level-2 folder named after a host the site covers
// narrows to that host. Matching ignores case.

/* exported SW */
var SW = (() => {
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

  function siteHosts(site, idx) {
    const info = idx.sites[site] || idx.sites[Object.keys(idx.sites).find((k) => k.toLowerCase() === site.toLowerCase())] || {};
    return Array.isArray(info.hosts) ? info.hosts.filter(Boolean) : [];
  }
  function siteMatches(site, idx, host) {
    const hosts = siteHosts(site, idx);
    if (hosts.length) return hosts.some((h) => hostIs(host, h));
    if (site.includes(".")) return hostIs(host, site);
    return host.split(".").includes(site.toLowerCase());
  }
  function pathMatches(site, idx, folder, host, segs) {
    let f = folder.map((s) => s.toLowerCase());
    if (f.length && f[0].includes(".") && siteMatches(site, idx, f[0])) { if (!hostIs(host, f[0])) return false; f = f.slice(1); }
    let i = 0;
    for (const s of segs) if (i < f.length && s === f[i]) i++;
    return i === f.length;
  }
  function fileMatches(idx, file, p) {
    const parts = file.split("/");
    if (parts.length === 1) return true;
    return siteMatches(parts[0], idx, p.host) && pathMatches(parts[0], idx, parts.slice(1, -1), p.host, p.segs);
  }
  function matchingScripts(idx, url) {
    let p; try { p = urlParts(url); } catch (e) { return []; }
    return idx.files.filter((f) => fileMatches(idx, f, p))
      .sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b));
  }
  // Site folders (listed or used by a script) that cover this host.
  function sitesFor(idx, host) {
    return Object.keys(idx.sites).concat(idx.files.filter((f) => f.includes("/")).map((f) => f.split("/")[0]))
      .filter((s, i, a) => a.indexOf(s) === i).filter((s) => siteMatches(s, idx, host));
  }

  async function sha256(buf) {
    const d = new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
    return Array.from(d, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  async function scriptText(file) {
    const r = await fetch(chrome.runtime.getURL("sites/" + file) + "?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error("file not found");
    return r.text();
  }
  async function scriptHash(file) {
    const r = await fetch(chrome.runtime.getURL("sites/" + file) + "?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error("file not found");
    return sha256(await r.arrayBuffer());
  }
  const textHash = (text) => sha256(new TextEncoder().encode(text));

  // Saved decisions: perms["<host>|<file>"] or perms["*|<file>"] (every website).
  // A decision for this website wins over an every-website one.
  const permKey = (host, file) => host + "|" + file;
  const ALL = "*";
  function decisionFor(perms, host, file) {
    return perms[permKey(host, file)] || perms[permKey(ALL, file)] || null;
  }
  // "block" | "allow" | "changed" (allowed, file changed since) | "new"
  function verdict(perms, host, file, hash) {
    const p = decisionFor(perms, host, file);
    if (p && p.d === "block") return "block";
    if (p && p.d === "allow") return p.hash === hash ? "allow" : "changed";
    return "new";
  }
  const isPaused = (paused, host) => (paused || []).some((h) => hostIs(host, h));

  return { loadIndex, urlParts, hostIs, siteHosts, siteMatches, pathMatches, fileMatches, matchingScripts, sitesFor,
           sha256, scriptText, scriptHash, textHash, permKey, ALL, decisionFor, verdict, isPaused };
})();
