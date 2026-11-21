const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function loadGlobal(file, name) {
  const context = { console, URL, setTimeout, clearTimeout };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  return context[name];
}

test('configuration defaults enforce mandatory confirmations and a 4-second request floor', () => {
  const cfg = loadGlobal('config.js', 'SWConfig');
  const d = cfg.defaults();
  assert.equal(d.market.quickSellMinPence, 14);
  assert.equal(d.market.undercutPence, 1);
  assert.equal(d.safety.requestIntervalMs, 4000);
  assert.equal(d.safety.requireSellConfirmation, true);
  assert.equal(d.safety.requireBulkDeleteConfirmation, true);
});

test('configuration normalization clamps invalid and unsafe values', () => {
  const cfg = loadGlobal('config.js', 'SWConfig');
  const n = cfg.normalize({ market: { currencyId: 999, quickSellMinPence: -5, undercutPence: 999999 }, safety: { maxListingsPerRun: 9999, requestIntervalMs: 10, requireSellConfirmation: false, requireBulkDeleteConfirmation: false }, notifications: { durationMs: 99999 } });
  assert.equal(n.market.currencyId, 2);
  assert.equal(n.market.quickSellMinPence, 1);
  assert.equal(n.market.undercutPence, 10000);
  assert.equal(n.safety.maxListingsPerRun, 500);
  assert.equal(n.safety.requestIntervalMs, 4000);
  assert.equal(n.safety.requireSellConfirmation, true);
  assert.equal(n.safety.requireBulkDeleteConfirmation, true);
  assert.equal(n.notifications.durationMs, 15000);
});

test('configuration merge preserves unspecified preferences', () => {
  const cfg = loadGlobal('config.js', 'SWConfig');
  const merged = cfg.merge(cfg.defaults(), { market: { quickSellMinPence: 18 } });
  assert.equal(merged.market.quickSellMinPence, 18);
  assert.equal(merged.market.undercutPence, 1);
  assert.equal(merged.safety.requestIntervalMs, 4000);
});

test('Steam fee calculator returns integer minor-unit amounts', () => {
  const finance = loadGlobal('steam-finance.js', 'SiteWorksFinance');
  const wallet = { wallet_fee_percent: 0.05, wallet_fee_base: 0, wallet_fee_minimum: 1 };
  assert.equal(finance.buyerTotal(100, 0.10, wallet), 115);
  assert.equal(finance.sellerReceives(115, 0.10, wallet), 100);
  assert.equal(finance.sellerReceives(1, 0.10, wallet), 0);
});

test('bulk listing remover never auto-confirms or overrides window.confirm', () => {
  const source = fs.readFileSync(path.join(root, 'sites/Steamworks/market/clear-steam-listings.js'), 'utf8');
  assert.doesNotMatch(source, /window\.confirm\s*=\s*\(\)\s*=>\s*true/);
  assert.doesNotMatch(source, /startAutoConfirm|confirmPopups|setInterval\(confirmPopups/);
  assert.match(source, /This operation is destructive/);
  assert.match(source, /will NOT be auto-approved/);
});

test('quick-sell script requires confirmation, caps a run and does not retry HTTP 429', () => {
  const source = fs.readFileSync(path.join(root, 'sites/Steamworks/inventory/steam-quick-sell.user.js'), 'utf8');
  assert.match(source, /const CONFIRM\s*=\s*true/);
  assert.match(source, /stats\.sold < MAX_LISTINGS/);
  assert.match(source, /No automatic retry was made/);
  assert.doesNotMatch(source, /attempt < 4/);
});
