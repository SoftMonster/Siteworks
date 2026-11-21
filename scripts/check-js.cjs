const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const ignored = new Set(['.git', 'node_modules', 'trash']);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.cjs'))) files.push(full);
  }
}
walk(root);
let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(`${path.relative(root, file)}\n${result.stderr}`);
  }
}
if (failed) process.exitCode = 1;
else console.log(`Syntax OK: ${files.length} JavaScript files checked.`);
