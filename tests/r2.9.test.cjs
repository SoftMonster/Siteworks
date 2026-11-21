const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../sites/Steamworks/inventory/steam-inventory-prices.js"), "utf8");

test("HF19 recognises numeric Steam app IDs for price eligibility", () => {
  assert.match(source, /\/\^\\d\+\$\//);
  assert.doesNotMatch(source, /\/\^\\\\d\+\$\//);
});

test("HF19 describes prices as separate optional enrichment", () => {
  assert.match(source, /MARKET PRICE ENRICHMENT/);
  assert.match(source, /Inventory webdata does not contain live prices/);
  assert.match(source, /Enrich prices/);
});

test("HF19 removes manual recovery probes", () => {
  assert.doesNotMatch(source, /Test Steam recovery/);
  assert.doesNotMatch(source, /S\.recoveryProbe/);
  assert.doesNotMatch(source, /\\.probe/);
});

test("HF19 projects price data into shared filedata", () => {
  assert.match(source, /fd\.prices = S\.data\.prices/);
  assert.match(source, /fd\.priceHistory = S\.data\.history/);
  assert.match(source, /data\.prices/);
});

test("HF19 keeps market cooldown separate from inventory synchronisation", () => {
  assert.match(source, /Market-price endpoint is paused/);
  assert.match(source, /Inventory webdata and existing filedata remain usable/);
  assert.match(source, /user-started enrichment batch may be attempted/);
});

test("HF19 saves price enrichment locally without intermediate Downloads exports", () => {
  assert.match(source, /Saved locally and projected into shared filedata/);
  assert.doesNotMatch(source, /steam_market_prices_inventory_refresh_/);
  assert.doesNotMatch(source, /Saved to Downloads/);
});

test("HF19 labels the price tab as enrichment, not a second inventory capture", () => {
  assert.match(source, /Price enrichment/);
  assert.match(source, /Inventory webdata does not contain live market prices/);
});
