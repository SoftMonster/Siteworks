// Generates release-notes.html (opened from the popup) from RELEASE_NOTES.md,
// newest release first. RELEASE_NOTES.md is the single source of truth.
//   node scripts/build-release-notes.cjs          write release-notes.html
//   node scripts/build-release-notes.cjs --check  exit 1 if it is out of date
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const md = fs.readFileSync(path.join(root, 'RELEASE_NOTES.md'), 'utf8').replace(/\r\n/g, '\n');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

// Split into releases on "# Site Works <version> — <label>".
const releases = [];
for (const line of md.split('\n')) {
  const h = /^# Site Works (\d+\.\d+\.\d+) — (.+)$/.exec(line);
  if (h) releases.push({ version: h[1], label: h[2].trim(), lines: [] });
  else if (releases.length) releases[releases.length - 1].lines.push(line);
}
if (!releases.length) throw new Error('No release headings found in RELEASE_NOTES.md');

function body(lines) {
  let out = '', inList = false, para = [];
  const flushPara = () => { if (para.length) { out += `<p>${inline(para.join(' '))}</p>\n`; para = []; } };
  const closeList = () => { if (inList) { out += '</ul>\n'; inList = false; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flushPara(); closeList(); }
    else if ((m = /^## (.+)$/.exec(line))) { flushPara(); closeList(); out += `<h3>${inline(m[1])}</h3>\n`; }
    else if ((m = /^[-*] (.+)$/.exec(line))) { flushPara(); if (!inList) { out += '<ul>\n'; inList = true; } out += `<li>${inline(m[1])}</li>\n`; }
    else { closeList(); para.push(line.trim()); }
  }
  flushPara(); closeList();
  return out;
}

const newest = releases[releases.length - 1];
const articles = releases.slice().reverse().map((r, i) =>
  `<article>\n<h2>${i === 0 ? '🟢 ' : ''}Site Works ${esc(r.version)} · ${inline(r.label)}</h2>\n${body(r.lines)}</article>`).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Site Works — Release notes</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#1b2838;color:#c6d4df;font:14px/1.6 "Segoe UI",Arial,sans-serif}
header{position:sticky;top:0;background:#172433;border-bottom:1px solid #30465a;padding:16px 22px;z-index:2}
h1{margin:0;color:#fff;font-size:21px}header p{margin:4px 0 0;color:#9fb3c5;font-size:12px}
main{max-width:980px;margin:20px auto;padding:0 18px 50px}
article{background:#202f40;border:1px solid #30465a;border-radius:7px;padding:16px 18px;margin:12px 0}
h2{margin:0 0 9px;color:#66c0f4;font-size:17px}
h3{margin:12px 0 4px;color:#fff;font-size:13px}
ul{margin:5px 0;padding-left:22px}li{margin:4px 0}
code{background:#0e1620;border-radius:3px;padding:0 4px}
</style>
</head>
<body>
<header><h1>📜 Site Works release notes</h1><p>Installed build: ${esc(newest.version)} · ${esc(newest.label)} · generated from RELEASE_NOTES.md</p></header>
<main>
${articles}
</main>
</body></html>
`;

const target = path.join(root, 'release-notes.html');
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(target) ? fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') : '';
  if (cur !== html) { console.error('release-notes.html is out of date. Run: npm run release-notes'); process.exit(1); }
  console.log('release-notes.html is up to date.');
} else {
  fs.writeFileSync(target, html);
  console.log(`Wrote release-notes.html (${releases.length} releases, newest ${newest.version}).`);
}
