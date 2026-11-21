const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'sites/Steamworks/inventory/steam-inventory-prices.js'), 'utf8');
test('R2 Hotfix 7 adds discovery progress and labels minimum inventory size', () => {
  assert.match(source, /class="scanprogress"/);
  assert.match(source, /minimum\.toLocaleString\(\) \+ " \(min\)"/);
  assert.match(source, /const updateDiscoveryProgress = \(processed, minimum\)/);
});
test('progress counts loaded inventory assets rather than aggregated quantities', () => {
  assert.match(source, /const pageItemCount = \(snapshot\) => snapshot && Array\.isArray\(snapshot\.items\)/);
});
test('R2 Hotfix 7 provides catalogue export without exporting price cache', () => {
  assert.match(source, /exportdesigns/);
  assert.match(source, /siteworks-card-designs-/);
  assert.match(source, /Market-price history was not included/);
});
test('discovery cursor reset preserves catalogue and price cache', () => {
  assert.match(source, /Reset the new-design discovery position to page one\?/);
  assert.match(source, /LS\.set\(DESIGN_CURSOR_KEY, \{ nextPage: 1, resetAt: Date\.now\(\) \}\)/);
  assert.doesNotMatch(source, /removeItem\(DESIGN_CATALOG_KEY\)/);
  assert.doesNotMatch(source, /removeItem\(CACHE\)/);
});
test('activity log is bounded and persisted', () => {
  assert.match(source, /const DESIGN_LOG_KEY = "siteworksDiscoveryActivityLog_v1"/);
  assert.match(source, /entries\.slice\(0, 30\)/);
});

test('discovery progress accumulates actual loaded item counts across resumable runs', () => {
  assert.match(source, /processedAssetIds = new Set/);
  assert.match(source, /processedAssetIds\.add\(id\)/);
  assert.match(source, /processedItems: processedCount\(\)/);
});
