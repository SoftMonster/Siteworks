const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'sites/Steamworks/inventory/steam-inventory-prices.js'), 'utf8');
test('R2 Hotfix 4 keeps inventory-description cooldown independent from market-price cooldown', () => {
  assert.match(source, /INVENTORY_COOLDOWN_KEY = "siteworksInventoryLoadCooldown_v1"/);
  assert.match(source, /PRICE_COOLDOWN_KEY = "cardShelfPriceCool"/);
});
test('R2 Hotfix 4 persists inventory throttling and applies bounded escalating cooldown', () => {
  assert.match(source, /markInventoryBlocked/);
  assert.match(source, /inventoryBackoff = \(n\) => Math\.min/);
  assert.match(source, /No automatic retry/);
});



