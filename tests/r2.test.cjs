const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function load() {
  const context = { Date, Math, Number, Object, Set, window: null };
  context.window = context; context.globalThis = context; vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'inventory-intelligence.js'), 'utf8'), context);
  return context.SiteWorksInventory;
}
test('inventory valuation multiplies design price by held quantity and tracks missing prices', () => {
  const api = load();
  const v = api.valuation({ A:{qty:3}, B:{qty:2} }, { A:[125,'2002',1] });
  assert.equal(v.designs, 2); assert.equal(v.quantity, 5); assert.equal(v.totalMinor, 375);
  assert.equal(v.pricedDesigns, 1); assert.equal(v.unpricedDesigns, 1);
});
test('price freshness has missing, fresh, aging and stale bands', () => {
  const api = load(), now = 20 * 86400000;
  assert.equal(api.freshness(0, now), 'missing');
  assert.equal(api.freshness(now - 86400000, now), 'fresh');
  assert.equal(api.freshness(now - 5 * 86400000, now), 'aging');
  assert.equal(api.freshness(1, now), 'stale');
});
test('inventory snapshot comparison detects additions, removals and quantity changes', () => {
  const d = load().compareSnapshots({A:{qty:2},B:{qty:1},C:{qty:4}}, {A:{qty:5},C:{qty:0},D:{qty:1}});
  assert.deepEqual(JSON.parse(JSON.stringify(d.added)), [{name:'D',qty:1}]);
  assert.deepEqual(JSON.parse(JSON.stringify(d.removed)), [{name:'B',qty:1},{name:'C',qty:4}]);
  assert.deepEqual(JSON.parse(JSON.stringify(d.quantityChanged)), [{name:'A',before:2,after:5,delta:3}]);
});
test('buy-order spread requires matching currency', () => {
  const api = load();
  assert.equal(api.priceSpread([150,'2002'],[110,'2002']),40);
  assert.equal(api.priceSpread([150,'2002'],[110,'2003']),null);
});
test('inventory script includes searchable and freshness-filtered list controls', () => {
  const s = fs.readFileSync(path.join(root,'sites/Steamworks/inventory/steam-inventory-prices.js'),'utf8');
  assert.match(s,/class="search"/); assert.match(s,/class="freshness"/);
  assert.match(s,/siteworksInventorySnapshot/); assert.match(s,/data\.history/);
});

test('inventory list labels current-page data as incomplete until a full scan is saved', () => {
  const s = fs.readFileSync(path.join(root,'sites/Steamworks/inventory/steam-inventory-prices.js'),'utf8');
  assert.match(s,/CURRENT WEBdata ONLY/);
  assert.match(s,/COMPLETE INVENTORY/);
  assert.match(s,/saved && saved.holdings/);
});
