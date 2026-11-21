const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'sites/Steamworks/inventory/steam-inventory-prices.js'), 'utf8');

test('design discovery persists its catalogue separately from price cache', () => {
  assert.match(source, /DESIGN_CATALOG_KEY = "siteworksKnownCardDesigns_v1"/);
  assert.match(source, /saveDesignCatalog\(catalog\)/);
  assert.match(source, /source: "inventory-discovery"/);
});
test('design discovery persists the next-page cursor when its stopping condition is met', () => {
  assert.match(source, /if \(!additions\.length\)/);
  assert.match(source, /nextPage: isLastPage \? 1 : pageNo \+ 1/);
  assert.match(source, /if \(thresholdReached \|\| isLastPage\)/);
});


