const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'sites/Steamworks/inventory/steam-inventory-prices.js'), 'utf8');
test('R2 Hotfix 6 derives total pages from Steam item-range or page-count labels', () => {
  assert.match(source, /const totalInventoryPages = \(\) =>/);
  assert.match(source, /Math\.ceil\(Number\(range\[1\]\.replace\(\/,\/g, ""\)\) \/ 25\)/);
});
test('discovery uses the 25 items per page less 24 final-page allowance threshold', () => {
  assert.match(source, /const completionThreshold = totalPagesAtStart \? \(25 \* totalPagesAtStart\) - 24 : 0/);
  assert.match(source, /processedAssetIds\.add\(id\)/);
  assert.match(source, /processedItems >= minimum/);
});
test('zero-new-design page does not stop discovery before inventory threshold', () => {
  assert.match(source, /if \(!additions\.length\)/);
  assert.match(source, /threshold has not been reached\. Continuing/);
});
test('discovery persists progress and displays warning when completeness is not established', () => {
  assert.match(source, /processedItems: processedCount\(\), completionThreshold: minimum, updatedAt/);
  assert.match(source, /⚠️ No new designs on page/);
});
