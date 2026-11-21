const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'sites/Steamworks/inventory/steam-inventory-prices.js'), 'utf8');

test('R2.2 throttle state remains persistent and migrates the earlier cooldown record', () => {
  assert.ok(source.includes('PRICE_COOLDOWN_KEY = "cardShelfPriceCool"'));
  assert.ok(source.includes('Migrate the earlier R2.1'));
  assert.ok(source.includes('old.blocks || 0) > 0 ? "throttled" : "ready"'));
});
test('R2.2 stops market-price enrichment on throttling, access blocks and invalid responses', () => {
  assert.ok(source.includes('status === 429) return "throttled"'));
  assert.ok(source.includes('status === 403 || status === 503'));
  assert.ok(source.includes('payload.success !== true) return "invalid"'));
  assert.ok(source.includes('if (kind !== "valid")'));
  assert.ok(source.includes('no further requests will be sent'));
});
test('R2.2 observes Retry-After and applies a bounded escalating fallback cooldown', () => {
  assert.ok(source.includes('headers.get("Retry-After")'));
  assert.ok(source.includes('7 * 86400000'));
  assert.ok(source.includes('throttleDuration = (blocks) => Math.min'));
});
test('HF19 removes manual recovery probes; no probe request is sent', () => {
  assert.ok(!source.includes('Test Steam recovery'));
  assert.ok(!source.includes('S.recoveryProbe'));
  assert.ok(source.includes('A user-started enrichment batch may be attempted'));
});
test('HF19 allows a user-started price batch after cooldown expiry without a probe', () => {
  assert.ok(source.includes('lastCooldownElapsedAt: Date.now()'));
  assert.ok(!source.includes('Cooldown elapsed, but Steam recovery has not been tested'));
  assert.ok(!source.includes('Use Test Steam recovery before refreshing'));
});
