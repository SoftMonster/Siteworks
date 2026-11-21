#!/usr/bin/env node
// Black-box test of the Site Works native-messaging helper (helper/siteworks-host.ps1).
//
// It copies the helper into a throw-away sandbox and talks to it exactly as a browser
// does: a 4-byte little-endian length, then UTF-8 JSON, one fresh process per message.
// Hostile inputs must be refused AND must change nothing anywhere on disk.
//
//   node scripts/helper-selftest.cjs                 run, print a report
//   node scripts/helper-selftest.cjs --json out.json also write machine-readable evidence
//   node scripts/helper-selftest.cjs --keep          keep the sandbox for inspection
//
// Windows: launches helper\siteworks-host.cmd (so Windows PowerShell 5.1 is exercised).
// Elsewhere: needs PowerShell 7 (`pwsh`) on PATH. It never touches the real project:
// only the sandbox under the OS temp directory.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');

const repo = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const args = process.argv.slice(2);
const keep = args.includes('--keep');
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const ORIGIN = 'chrome-extension://falhkcegdkgfjmgnebblkjdhikgefoaf/';

// ---------- environment ----------
let engine;
if (isWin) engine = { label: 'Windows: helper\\siteworks-host.cmd (powershell.exe)' };
else {
  const r = spawnSync('pwsh', ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.ToString()'], { encoding: 'utf8' });
  if (r.status !== 0) { console.error('PowerShell 7 (pwsh) not found on PATH; cannot run the helper.'); process.exit(2); }
  engine = { label: `pwsh ${r.stdout.trim()} on ${process.platform} (NOT Windows PowerShell 5.1)` };
}

// ---------- sandbox ----------
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'swtest-'));
const root = path.join(base, 'root');
const outside = path.join(base, 'outside');
fs.mkdirSync(path.join(root, 'helper'), { recursive: true });
fs.mkdirSync(path.join(root, 'sites', 'Site'), { recursive: true });
fs.mkdirSync(outside);
for (const f of fs.readdirSync(path.join(repo, 'helper'))) {
  if (f === 'com.siteworks.helper.json') continue;
  fs.copyFileSync(path.join(repo, 'helper', f), path.join(root, 'helper', f));
}
fs.copyFileSync(path.join(repo, 'manifest.json'), path.join(root, 'manifest.json'));
fs.writeFileSync(path.join(root, 'sites', 'Site', 'seed.js'), '// seed\n');
fs.writeFileSync(path.join(outside, 'canary.js'), 'CANARY');
fs.writeFileSync(path.join(outside, 'victim.js'), 'VICTIM');
const manifestVersion = JSON.parse(fs.readFileSync(path.join(repo, 'manifest.json'), 'utf8')).version;

// symlinks / junctions that point OUT of sites (skipped where the OS refuses)
const links = { dir: false, file: false };
try { fs.symlinkSync(outside, path.join(root, 'sites', 'Evil'), isWin ? 'junction' : 'dir'); links.dir = true; } catch (e) {}
try { fs.symlinkSync(path.join(outside, 'victim.js'), path.join(root, 'sites', 'Site', 'link.js'), 'file'); links.file = true; } catch (e) {}

// ---------- on-disk snapshot (does not follow links) ----------
function snapshot() {
  const out = {};
  (function walk(dir) {
    for (const e of fs.readdirSync(dir)) {
      const p = path.join(dir, e), rel = path.relative(base, p).split(path.sep).join('/');
      const st = fs.lstatSync(p);
      if (st.isSymbolicLink()) out[rel] = 'link->' + fs.readlinkSync(p);
      else if (st.isDirectory()) { out[rel] = 'dir'; walk(p); }
      else out[rel] = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    }
  })(base);
  return out;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => a[k] !== b[k]);

// ---------- protocol client ----------
function launch() {
  if (isWin) {
    const cmd = path.join(root, 'helper', 'siteworks-host.cmd');
    return spawn('cmd.exe', ['/d', '/s', '/c', `""${cmd}" "${ORIGIN}""`], { windowsVerbatimArguments: true });
  }
  return spawn('pwsh', ['-NoProfile', '-NonInteractive', '-File', path.join(root, 'helper', 'siteworks-host.ps1'), ORIGIN]);
}
function frame(obj) {
  const b = Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj), 'utf8');
  const h = Buffer.alloc(4); h.writeInt32LE(b.length); return Buffer.concat([h, b]);
}
// Sends raw bytes, closes stdin, collects whatever the host answers until it exits.
function exchange(raw, timeoutMs = 90000) {
  return new Promise((resolve) => {
    const p = launch(); let out = Buffer.alloc(0), err = '', done = false;
    const finish = (extra) => { if (done) return; done = true; clearTimeout(t); resolve({ out, err, ...extra }); };
    const t = setTimeout(() => { try { p.kill(); } catch (e) {} finish({ timedOut: true }); }, timeoutMs);
    p.stdout.on('data', (d) => { out = Buffer.concat([out, d]); });
    p.stderr.on('data', (d) => { err += d; });
    p.on('error', () => finish({ spawnError: true }));
    p.on('close', (code) => finish({ code }));
    p.stdin.on('error', () => {});
    p.stdin.write(raw); p.stdin.end();
  });
}
function parseReplies(buf) {
  const replies = []; let o = 0;
  while (buf.length - o >= 4) {
    const n = buf.readInt32LE(o); if (n < 0 || buf.length - o - 4 < n) break;
    try { replies.push(JSON.parse(buf.subarray(o + 4, o + 4 + n).toString('utf8'))); } catch (e) { replies.push({ __unparseable: true }); }
    o += 4 + n;
  }
  return replies;
}
async function call(msg) { const r = await exchange(frame(msg)); return { reply: parseReplies(r.out)[0] || null, raw: r }; }

// ---------- scenario runner ----------
const results = [];
function record(group, name, status, detail) { results.push({ group, name, status, detail: detail || '' }); console.log(`${status.padEnd(5)} ${group} :: ${name}${detail ? '  -- ' + detail : ''}`); }
const refused = (r) => !!(r && r.error && !r.ok);

async function hostile(group, name, msg, extraCheck) {
  const before = snapshot();
  const { reply, raw } = await call(msg);
  const after = snapshot();
  const changed = diff(before, after);
  const ok = refused(reply) && changed.length === 0 && !raw.timedOut && (!extraCheck || extraCheck());
  record(group, name, ok ? 'PASS' : 'FAIL', ok ? (reply.message || reply.error).toString().slice(0, 70) : `reply=${JSON.stringify(reply)} changed=${JSON.stringify(changed)}${raw.timedOut ? ' TIMEOUT' : ''}`);
}

(async () => {
  console.log(`Engine : ${engine.label}\nNode   : ${process.version}\nSandbox: ${base}\nLinks  : dir=${links.dir} file=${links.file}\n`);
  const helperHash = snapshot();

  // ---- A. legitimate behaviour ----
  let { reply: r } = await call({ cmd: 'ping' });
  record('legit', 'ping reports the manifest version', r && r.ok && r.version === manifestVersion ? 'PASS' : 'FAIL', JSON.stringify(r));
  record('legit', 'ping reports the sandbox as root, not the real repo', r && r.root && path.resolve(r.root) === path.resolve(root) ? 'PASS' : 'FAIL', r && r.root);
  const body = '// hello\nconsole.log("x");\n';
  ({ reply: r } = await call({ cmd: 'write', path: 'Site/ok.js', text: body }));
  const okFile = path.join(root, 'sites', 'Site', 'ok.js');
  const okHash = crypto.createHash('sha256').update(Buffer.from(body)).digest('hex');
  record('legit', 'write creates the file with exact bytes and returns its SHA-256', r && r.ok && r.created && fs.existsSync(okFile) && fs.readFileSync(okFile, 'utf8') === body && r.hash === okHash ? 'PASS' : 'FAIL', JSON.stringify(r && { ok: r.ok, created: r.created, hash: r.hash }));
  ({ reply: r } = await call({ cmd: 'write', path: 'Site/ok.js', text: 'other' }));
  record('legit', 'write refuses to overwrite without the overwrite flag', r && r.error === 'exists' && fs.readFileSync(okFile, 'utf8') === body ? 'PASS' : 'FAIL', JSON.stringify(r));
  ({ reply: r } = await call({ cmd: 'write', path: 'Site/ok.js', text: 'other', overwrite: true, expectHash: 'deadbeef' }));
  record('legit', 'overwrite with a stale expectHash is refused (lost-update guard)', r && r.error === 'changed' && fs.readFileSync(okFile, 'utf8') === body ? 'PASS' : 'FAIL', JSON.stringify(r));
  ({ reply: r } = await call({ cmd: 'write', path: 'Site/ok.js', text: 'v2', overwrite: true, expectHash: okHash }));
  record('legit', 'overwrite with the correct expectHash succeeds', r && r.ok && fs.readFileSync(okFile, 'utf8') === 'v2' ? 'PASS' : 'FAIL', JSON.stringify(r && { ok: r.ok }));
  ({ reply: r } = await call({ cmd: 'hosts', site: 'Site', hosts: ['example.com', ' sub.example.org ', ''] }));
  const hostsFile = path.join(root, 'sites', 'Site', 'hosts.txt');
  record('legit', 'hosts writes sites/<Site>/hosts.txt', r && r.ok && fs.existsSync(hostsFile) && /example\.com/.test(fs.readFileSync(hostsFile, 'utf8')) ? 'PASS' : 'FAIL', JSON.stringify(r && { ok: r.ok }));
  ({ reply: r } = await call({ cmd: 'rebuild' }));
  let idx = null; try { idx = JSON.parse(fs.readFileSync(path.join(root, 'sites', 'index.json'), 'utf8')); } catch (e) {}
  record('legit', 'rebuild produces a valid index.json listing the written script', r && r.ok && idx && idx.files.includes('Site/ok.js') ? 'PASS' : 'FAIL', JSON.stringify(r && { ok: r.ok }));
  ({ reply: r } = await call({ cmd: 'trash', path: 'Site/ok.js' }));
  const trashDir = path.join(root, 'trash');
  record('legit', 'trash moves the file into trash/, never deletes it', r && r.ok && !fs.existsSync(okFile) && fs.existsSync(trashDir) && JSON.stringify(snapshot()).includes('ok.js') ? 'PASS' : 'FAIL', JSON.stringify(r && { ok: r.ok }));
  ({ reply: r } = await call({ cmd: 'format-c' }));
  record('legit', 'unknown command is refused', refused(r) && r.error === 'unknown' ? 'PASS' : 'FAIL', JSON.stringify(r));
  ({ reply: r } = await call({}));
  record('legit', 'missing command is refused', refused(r) ? 'PASS' : 'FAIL', JSON.stringify(r));

  // ---- B. hostile paths: must be refused and change NOTHING on disk ----
  const badPaths = [
    '../escape.js', '..\\escape.js', 'Site/../../escape.js', 'Site/..\\..\\escape.js', '../outside/escape.js',
    '/abs/escape.js', 'C:\\escape.js', 'C:/escape.js', '\\\\server\\share\\escape.js', '//server/share/escape.js',
    'Site//x.js', 'Site/./x.js', 'Site/x.txt', 'Site/x.js.', 'Site/x.js ', ' Site/x.js', 'Site/ x.js/y.js',
    'Site/con.js', 'Site/NUL.js', 'Site/com1.js', 'Site/lpt9.js', 'Site/aux', 'Site/x:stream.js',
    'Site/x*.js', 'Site/x?.js', 'Site/x"y.js', 'Site/x<y.js', 'Site/x>y.js', 'Site/x|y.js',
    'Site/x\u0001y.js', 'Site/x\ny.js', 'Site/x\u0000.js', ''
  ];
  for (const p of badPaths) await hostile('hostile write', JSON.stringify(p), { cmd: 'write', path: p, text: 'PWNED' });
  await hostile('hostile write', 'path field missing', { cmd: 'write', text: 'PWNED' });
  await hostile('hostile write', 'path is an object', { cmd: 'write', path: { a: 1 }, text: 'PWNED' });
  await hostile('hostile write', 'path is an array', { cmd: 'write', path: ['../x.js'], text: 'PWNED' });
  for (const s of ['../x', 'Site/sub', '', 'a:b', '..', 'C:\\x']) await hostile('hostile hosts', JSON.stringify(s), { cmd: 'hosts', site: s, hosts: ['evil.com'] });
  for (const p of ['../outside/canary.js', 'Site/../../outside/canary.js', '..\\outside\\canary.js', '/etc/passwd', 'C:\\Windows\\win.ini'])
    await hostile('hostile trash', JSON.stringify(p), { cmd: 'trash', path: p });
  for (const p of ['../outside/victim.js', '..\\x.js', 'C:\\Windows\\System32\\calc.exe']) await hostile('hostile edit', JSON.stringify(p), { cmd: 'edit', path: p });
  for (const p of ['../outside', '..\\outside\\canary.js']) await hostile('hostile reveal', JSON.stringify(p), { cmd: 'reveal', path: p });

  // ---- C. links that point out of sites/ ----
  if (links.dir) {
    await hostile('link escape', 'write through a directory link', { cmd: 'write', path: 'Evil/pwn.js', text: 'PWNED' }, () => !fs.existsSync(path.join(outside, 'pwn.js')));
    await hostile('link escape', 'trash through a directory link', { cmd: 'trash', path: 'Evil/victim.js' }, () => fs.readFileSync(path.join(outside, 'victim.js'), 'utf8') === 'VICTIM');
  } else record('link escape', 'directory link tests', 'SKIP', 'OS refused to create the link');
  if (links.file) {
    await hostile('link escape', 'overwrite a file link', { cmd: 'write', path: 'Site/link.js', text: 'PWNED', overwrite: true }, () => fs.readFileSync(path.join(outside, 'victim.js'), 'utf8') === 'VICTIM');
    await hostile('link escape', 'trash a file link', { cmd: 'trash', path: 'Site/link.js' });
  } else record('link escape', 'file link tests', 'SKIP', 'OS refused to create the link (Windows needs Developer Mode or admin)');

  // ---- D. odd but legal names are written literally and never executed ----
  const sentinelAnywhere = () => fs.existsSync(path.join(process.cwd(), 'SENTINEL')) || Object.keys(snapshot()).some((k) => k.split('/').pop() === 'SENTINEL');
  const odd = ['Site/$(touch SENTINEL).js', 'Site/`touch SENTINEL`.js', 'Site/a;touch SENTINEL;.js', 'Site/a;b.js', "Site/a'b.js", 'Site/a&b.js', 'Site/a`b.js', 'Site/%PATH%.js', 'Site/$env_x.js'];
  for (const p of odd) {
    const { reply } = await call({ cmd: 'write', path: p, text: '//x' });
    const made = fs.existsSync(path.join(root, 'sites', ...p.split('/')));
    record('literal names', JSON.stringify(p), reply && reply.ok && made && !sentinelAnywhere() ? 'PASS' : 'FAIL', JSON.stringify(reply && { ok: reply.ok, error: reply.error }) + ` created=${made} sentinel=${sentinelAnywhere()}`);
  }

  // ---- E. malformed protocol frames: must not hang, crash-loop or write ----
  const hdr = (n) => { const b = Buffer.alloc(4); b.writeInt32LE(n); return b; };
  const protocol = [
    ['length over the 4 MB cap (header only)', hdr(4 * 1024 * 1024 + 1)],
    // A COMPLETE, valid write command just over the cap. If the cap exists it is dropped unread; if the cap is
    // removed the helper would execute it and the snapshot diff would show Site/big.js.
    ['complete valid write over the 4 MB cap is not executed', frame({ cmd: 'write', path: 'Site/big.js', text: 'A'.repeat(4 * 1024 * 1024 + 64) })],
    ['length 100 MB, no body', hdr(100 * 1024 * 1024)],
    ['negative length', hdr(-1)],
    ['zero length', hdr(0)],
    ['truncated body', Buffer.concat([hdr(100), Buffer.from('{"cmd":"pi')])],
    ['truncated header', Buffer.from([1, 0])],
    ['empty stdin', Buffer.alloc(0)],
    ['not JSON', frame('this is not json')],
    ['JSON null', frame('null')], ['JSON number', frame('42')], ['JSON string', frame('"ping"')], ['JSON array', frame('[1,2,3]')],
    ['binary garbage body', Buffer.concat([hdr(8), Buffer.from([255, 254, 0, 1, 2, 3, 4, 5])])]
  ];
  for (const [name, raw] of protocol) {
    const before = snapshot();
    const x = await exchange(raw, 60000);
    const changed = diff(before, snapshot());
    const ok = !x.timedOut && !x.spawnError && changed.length === 0;
    record('protocol', name, ok ? 'PASS' : 'FAIL', ok ? `exit=${x.code} replies=${parseReplies(x.out).length}` : `timedOut=${!!x.timedOut} changed=${JSON.stringify(changed)}`);
  }
  const two = await exchange(Buffer.concat([frame({ cmd: 'ping' }), frame({ cmd: 'ping' })]));
  record('protocol', 'two messages on one connection are both answered', parseReplies(two.out).length === 2 ? 'PASS' : 'FAIL', `replies=${parseReplies(two.out).length}`);

  // ---- F. the helper never modifies itself ----
  const final = snapshot();
  const selfChanged = Object.keys(helperHash).filter((k) => /^root\/(helper|manifest\.json)/.test(k) && helperHash[k] !== final[k]);
  record('integrity', 'helper scripts and manifest unchanged after the whole run', selfChanged.length === 0 ? 'PASS' : 'FAIL', selfChanged.join(','));
  record('integrity', 'files outside the sandbox root unchanged (canary, victim)', fs.readFileSync(path.join(outside, 'canary.js'), 'utf8') === 'CANARY' && fs.readFileSync(path.join(outside, 'victim.js'), 'utf8') === 'VICTIM' && fs.readdirSync(outside).sort().join() === 'canary.js,victim.js' ? 'PASS' : 'FAIL');

  // ---- report ----
  const n = (s) => results.filter((x) => x.status === s).length;
  console.log(`\nSummary: ${n('PASS')} passed, ${n('FAIL')} failed, ${n('SKIP')} skipped (of ${results.length}).`);
  console.log(`Engine : ${engine.label}`);
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ date: new Date().toISOString(), engine: engine.label, node: process.version, platform: process.platform, links, results }, null, 2));
  if (!keep) fs.rmSync(base, { recursive: true, force: true }); else console.log('Sandbox kept at', base);
  process.exit(n('FAIL') ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
