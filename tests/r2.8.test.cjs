const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'sites/Steamworks/inventory/steam-inventory-prices.js'), 'utf8');

test('R2 Hotfix 8 waits for complete, stable page snapshots before discovery', () => {
  assert.match(source, /const captureInventoryPage = \(\) =>/);
  assert.match(source, /const waitForStableInventoryPage = async \(expectedPage, timeout = 30000\)/);
  assert.match(source, /snap\.unresolved\.length === 0 && snap\.items\.length === snap\.tileCount/);
  assert.match(source, /stableSamples >= 3/);
  assert.match(source, /Date\.now\(\) - stableSince >= 1500/);
});

test('page discovery is based on visible page tiles, not the global active-inventory description count', () => {
  assert.match(source, /const pageTiles = \(\) =>/);
  assert.match(source, /const pageItemCount = \(snapshot\) => snapshot && Array\.isArray\(snapshot\.items\) \? snapshot\.items\.length : 0/);
  assert.doesNotMatch(source, /const pageItemCount = \(\) => inventoryDescriptionCount\(\)/);
});

test('incomplete pages are never recorded as zero-new-design results', () => {
  assert.match(source, /if \(!settled\.ok\)/);
  assert.match(source, /No zero-new-design result was recorded/);
  assert.match(source, /if \(!additions\.length\)/);
  assert.match(source, /const snapshot = settled\.snapshot/);
});



test('progress deduplicates inventory instances by app, context and asset ID', () => {
  assert.match(source, /processedAssetIds = new Set/);
  assert.match(source, /it\.appid \+ ":" \+ it\.contextid \+ ":" \+ it\.assetid/);
  assert.match(source, /processedAssetIds\.add\(id\)/);
  assert.match(source, /processedAssetIds: \[\.\.\.processedAssetIds\]/);
});

test('failed navigation or incomplete content preserves the current resume page', () => {
  assert.match(source, /nextPage: pageNo, lastSuccessfulPage: pageNo - 1/);
  assert.match(source, /current page was not marked complete/);
  assert.match(source, /Inventory page did not reach a stable, complete state/);
});

test('minimum expected inventory denominator remains labelled min', () => {
  assert.match(source, /\(25 \* totalPagesAtStart\) - 24/);
  assert.match(source, /minimum\.toLocaleString\(\) \+ " \(min\)"/);
});

test('design discovery remains independent of price caching', () => {
  const start = source.indexOf('S.discoverNewDesigns = async () =>');
  const end = source.indexOf('\n\n  S.renderList =', start);
  const block = source.slice(start, end);
  assert.doesNotMatch(block, /fetch\([^\n]*priceoverview/);
  assert.doesNotMatch(block, /S\.data\.prices\s*=/);
});


test('Stop after a committed page resumes at the following page and reports verified work', () => {
  const stopBlock = source.slice(source.indexOf('if (S.scanState.stop) {', source.indexOf('S.discoverNewDesigns')),
    source.indexOf('if (failed) logDiscovery', source.indexOf('S.discoverNewDesigns')));
  assert.match(stopBlock, /lastSuccessfulPage >= pageNo \? pageNo \+ 1 : pageNo/);
  assert.match(stopBlock, /resume at page /);
  assert.match(stopBlock, /verified page\(s\)/);
  assert.match(stopBlock, /resume position page /);
});




test('Card Shelf labels catalogue, price cache and inventory scope independently', () => {
  assert.match(source, /FILEdata · /);
  assert.match(source, /SAVED PRICE DATA · /);
  assert.match(source, /INVENTORY VIEW · /);
  assert.match(source, /Current-webdata estimated value/);
  assert.match(source, /Full-inventory estimated value/);
  assert.match(source, /known owned item instances/);
});

test('last discovery run records verified pages, discoveries and resume position', () => {
  assert.match(source, /lastRun: \{ pagesVerified: pages, newDesigns: discovered/);
  assert.match(source, /resumePage \}/);
});


test('Stop interrupts stable-page waits and page-change waits', () => {
  assert.match(source, /const sleepScanInterruptible = async \(ms\) =>/);
  assert.match(source, /if \(S\.scanState\.stop\) return \{ ok: false, cancelled: true/);
  assert.match(source, /if \(S\.scanState\.stop\) return false/);
  assert.match(source, /if \(!settled\.ok && settled\.cancelled\) break/);
});

test('Stop reports a safe resume page and prevents starting another navigation', () => {
  const start = source.indexOf('S.discoverByPageNavigation = async () =>');
  const end = source.indexOf('S.discoverNewDesigns = async () =>', start);
  const block = source.slice(start, end);
  assert.match(block, /pendingResumePage = pageNo \+ 1/);
  assert.match(block, /const resumePage = pendingResumePage \|\|/);
  assert.match(block, /resume at page /);
});




test('price list merges owned inventory, saved design catalogue and price-cache names', () => {
  const start = source.indexOf('S.renderList = () =>');
  const end = source.indexOf('S.refresh =', start);
  const block = source.slice(start, end);
  assert.match(block, /const ownedHoldings = holdings\(\)/);
  assert.match(block, /const catalogue = readDesignCatalog\(\)/);
  assert.match(block, /Object\.keys\(S\.data\.prices \|\| \{\}\)\.forEach/);
  assert.match(block, /S\.held = visibleHoldings/);
});

test('unknown ownership quantities are displayed as unknown, not zero or invented', () => {
  const start = source.indexOf('S.renderList = () =>');
  const end = source.indexOf('S.refresh =', start);
  const block = source.slice(start, end);
  assert.match(block, /qty: null, qtyKnown: false/);
  assert.match(block, /r\.qtyKnown \? r\.qty : "—"/);
  assert.match(block, /Current quantity is unknown|current quantity is unknown/);
});

test('inventory valuation and snapshots use owned holdings only, not catalogue union', () => {
  const start = source.indexOf('S.renderList = () =>');
  const end = source.indexOf('S.refresh =', start);
  const block = source.slice(start, end);
  assert.match(block, /Object\.entries\(ownedHoldings\)/);
  assert.match(block, /intelligence\.valuation\(ownedHoldings, S\.data\.prices\)/);
});






test('price controls and price statistics are grouped in a separate market-prices panel', () => {
  assert.match(source, /class="designpanel"/);
  assert.match(source, /class="pricepanel"/);
  assert.match(source, /class="row pricestats"/);
  assert.match(source, /class="row priceprogress"/);
  assert.match(source, /S\.updatePricePanel\(run\)/);
});








test('design list labels distinguish unique designs from individual inventory items', () => {
  assert.ok(source.includes('<th data-s="nm">Design</th>'));
  assert.ok(source.includes('>Items</th>'));
  assert.ok(source.includes('designs, "' ) || source.includes('unique designs listed'));
  assert.match(source, /Search designs/);
});




test('Hotfix 14 separates design capture, price capture and inventory list into tabs', () => {
  assert.match(source, /data-tab="design"/);
  assert.match(source, /data-tab="prices"/);
  assert.match(source, /data-tab="inventory"/);
  assert.match(source, /data-pane="design"/);
  assert.match(source, /data-pane="prices"/);
  assert.match(source, /data-pane="inventory"/);
  assert.match(source, /tabbtn/);
});








test('Hotfix 14 retains the discovery and price panels in their dedicated tabs', () => {
  assert.ok(source.includes('WEBdata INGESTION &amp; DESIGN DISCOVERY'));
  assert.ok(source.includes('MARKET PRICE ENRICHMENT'));
  assert.ok(source.includes('scanprogresslabel'));
  assert.ok(source.includes('sessionstats'));
  assert.ok(source.includes('pricestats'));
  assert.ok(source.includes('priceprogress'));
});

test('Hotfix 14 keeps discovered designs eligible for market-price lookup', () => {
  assert.ok(source.includes('appid: String(d.appid || "753")'));
  assert.ok(source.includes('ownership === "discovered"'));
  assert.ok(source.includes('S.shown.filter((r) => S.held[r.name] &&'));
});

test('Hotfix 14 exposes a full-height independently scrollable inventory tab', () => {
  assert.ok(source.includes('data-tab="inventory"'));
  assert.ok(source.includes('data-pane="inventory"'));
  assert.ok(source.includes('#cs-pl .tabcontent{display:flex;flex:1 1 auto;min-height:0;overflow:hidden}'));
  assert.ok(source.includes('#cs-pl .inventorypane .bd{display:block;flex:1 1 auto;min-height:0;max-height:none;overflow:auto'));
  assert.ok(source.includes('class="row inventorysummary"'));
  assert.ok(source.includes('unique designs listed'));
});




test('Hotfix 15 puts header actions on their own row above the navigation tabs', () => {
  assert.ok(source.includes('class="headrow"'));
  assert.ok(source.includes('class="headactions"'));
  assert.ok(source.includes('class="tabbar"'));
  assert.ok(source.indexOf('class="headrow"') < source.indexOf('class="tabbar"'));
  assert.ok(source.includes('#cs-pl .headrow{display:flex;align-items:center;justify-content:space-between'));
});

test('Hotfix 15 resets legacy No price filter so cached designs are visible by default', () => {
  assert.ok(source.includes('$(".freshness").value = "all";'));
  assert.ok(source.includes('LS.set("cardShelfPlFreshness", "all");'));
  assert.ok(source.includes('ageFilter = $(".freshness").value'));
  assert.ok(source.includes('All price ages'));
});

test('Hotfix 15 reports the complete design total and cached/missing price counts', () => {
  assert.ok(source.includes('total + " designs · " + cached + " priced · " + (total - cached) + " without prices"'));
});




test('Hotfix 18 uses one inventory synchronisation action and no per-tab acquisition buttons', () => {
  assert.ok(source.includes('class="newdesigns"'));
  assert.ok(source.includes('>Synchronise inventory</button>'));
  assert.ok(!source.includes('class="loadcurrent go"'));
  assert.ok(!source.includes('>Load cached inventory data</button>'));
  assert.ok(source.includes('class="scanstop stop"'));
  assert.ok(source.includes('class="pricego"'));
});

test('Hotfix 18 journals webdata deltas and consolidates saved inventory into filedata', () => {
  assert.ok(source.includes('siteworks_webdata_journal'));
  assert.ok(source.includes('appendWebdataBatch'));
  assert.ok(source.includes('siteworksFiledata_v1'));
  assert.ok(source.includes('S.rebuildFiledataFromWebdataJournal'));
  assert.ok(source.includes('source:"steam-webdata-journal"'));
});

test('Hotfix 17 uses Steam native cache loading when capabilities are present', () => {
  assert.ok(source.includes('typeof inv.LoadMoreAssets === "function"'));
  assert.ok(source.includes('typeof inv.m_bFullyLoaded === "boolean"'));
  assert.ok(source.includes('awaitSteamNativeLoad(inv)'));
  assert.ok(source.includes('inv.m_ActivePromise'));
  assert.ok(source.includes('Steam native inventory loader failed'));
  assert.ok(source.includes('No automatic retries'));
});

test('Hotfix 17 records complete inventory only when Steam marks its cache fully loaded', () => {
  const start = source.indexOf('S.scanSteamInventoryCache = async');
  const end = source.indexOf('S.discoverByPageNavigation = async', start);
  const fn = source.slice(start, end);
  assert.ok(fn.includes('if(inv.m_bFullyLoaded && !S.scanState.stop)'));
  assert.ok(fn.includes('if(!final.supported || final.unresolved)'));
  assert.ok(fn.includes('source:"steam-webdata-journal"'));
  assert.ok(fn.includes('saveFullScan({version:3,source:"steam-webdata-journal"'));
});

test('Hotfix 16 price lookup accepts explicit page design names regardless of list filters', () => {
  assert.ok(source.includes('S.refresh = async (onlyNames)'));
  assert.ok(source.includes('Array.isArray(onlyNames)'));
  assert.ok(source.includes('onlyNames.map((name)'));
});


test('Hotfix 16 only requests missing prices during page capture and does not overwrite fresh cache entries', () => {
  const start = source.indexOf('S.refresh = async (onlyNames)');
  const end = source.indexOf('if (!list.length)', start);
  const fn = source.slice(start, end);
  assert.ok(fn.includes('Array.isArray(onlyNames)'));
  assert.ok(fn.includes('list = list.filter((r) => !r.c'));
});

test('Hotfix 16 identifies exact build lineage in the extension popup', () => {
  const popup = fs.readFileSync(path.join(__dirname, '..', 'popup.html'), 'utf8');
  assert.ok(popup.includes('Site Works 1.6.8 · R2 Hotfix 18'));
  assert.ok(popup.includes('Built on Site Works 1.6.7 · R2 Hotfix 17'));
});
