// Guards against the failure that sank the first handover: every place that states
// the version must agree with manifest.json. Expected values are DERIVED, never
// hard-coded, so a release bump cannot silently leave a stale label behind.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');

const manifest = JSON.parse(read('manifest.json'));
const pkg = JSON.parse(read('package.json'));
const headings = [...read('RELEASE_NOTES.md').matchAll(/^# Site Works (\d+\.\d+\.\d+) — (.+)$/gm)];
const newest = headings[headings.length - 1];

test('package.json and manifest.json versions agree', () => {
  assert.strictEqual(pkg.version, manifest.version);
});

test('newest RELEASE_NOTES.md entry is the manifest version', () => {
  assert.ok(newest, 'no release headings');
  assert.strictEqual(newest[1], manifest.version);
});

test('popup shows the current build and the previous build it was built on', () => {
  const popup = read('popup.html');
  const m = /<strong>Site Works ([\d.]+) · ([^<]+)<\/strong><span class="base">Built on Site Works ([\d.]+) · ([^<]+)<\/span>/.exec(popup);
  assert.ok(m, 'build identity block not found in popup.html');
  assert.strictEqual(m[1], manifest.version, 'popup version');
  assert.strictEqual(m[2].trim(), newest[2].trim(), 'popup hotfix label');
  assert.strictEqual(m[3], headings[headings.length - 2][1], 'popup "built on" version');
});

test('README.md states the current version', () => {
  assert.ok(read('README.md').includes(`Release ${manifest.version}`));
});

test('README.txt states the current version', () => {
  assert.ok(read('README.txt').split('\n')[0].includes(manifest.version));
});

test('release-notes.html is generated from RELEASE_NOTES.md and is current', () => {
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'build-release-notes.cjs'), '--check'], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
});

test('sites/index.json lists exactly the .js files under sites/', () => {
  const found = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.js')) found.push(path.relative(path.join(root, 'sites'), full).split(path.sep).join('/'));
    }
  })(path.join(root, 'sites'));
  const index = JSON.parse(read('sites/index.json'));
  assert.deepStrictEqual([...index.files].sort(), found.sort());
});

test('no machine-specific absolute paths or Windows user names are tracked in source', () => {
  const offenders = [];
  const skip = new Set(['.git', 'node_modules', 'trash']);
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (!/\.(js|cjs|json|ps1|cmd|html)$/.test(e.name) || e.name === 'com.siteworks.helper.json') continue;
      if (/C:\\\\?Users\\\\?[^\\"'\s]+/i.test(fs.readFileSync(full, 'utf8'))) offenders.push(path.relative(root, full));
    }
  })(root);
  assert.deepStrictEqual(offenders, []);
});
