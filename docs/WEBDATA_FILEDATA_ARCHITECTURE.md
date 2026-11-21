# Webdata / Filedata Architecture

**Applies to:** Site Works 1.6.9 · R2 Hotfix 19  
**Previous build:** 1.6.7 · R2 Hotfix 17

## Terminology (mandatory)

- **Webdata**: the data currently exposed by the Steam webpage in memory. In the observed Steam implementation this includes `g_ActiveInventory`, `m_rgAssets`, `m_rgDescriptions`, `m_cItems`, `m_ulLastAssetID` and `m_bFullyLoaded`.
- **Filedata**: Site Works' locally persisted, reconciled inventory model.
- **Webdata journal**: append-only, versioned IndexedDB records of serialisable asset/description data captured as Steam streams batches.
- **Saved price data**: independent market-price observations. These are not part of Steam inventory webdata.

Do not use the ambiguous word “cache” in user-facing inventory labels, documentation or diagnostics. Existing internal identifiers and legacy storage keys may retain historical names for compatibility; do not expose them as terminology.

## Data flow

1. User starts **Synchronise inventory** in Design capture.
2. Site Works reads the current webdata immediately.
3. It writes a versioned webdata journal batch to IndexedDB, containing only serialisable asset and description fields. It does not serialise the live Steam controller object, methods, DOM references or cyclic references.
4. It reconciles the current webdata into the shared filedata model.
5. If Steam's native loader is available, Site Works asks it for the next batch using `LoadMoreAssets()`, one at a time. Steam remains responsible for request construction, continuation, delays, request merging and native error handling.
6. After each successful load, Site Works appends only changed/new asset and description records to the webdata journal, then updates filedata.
7. Completion is recorded only when Steam sets `m_bFullyLoaded` and all non-currency asset entries have resolvable design descriptions.
8. Price capture reads the shared design set and adds separate saved price data. Inventory list is a read-only view of filedata. Neither tab starts inventory acquisition.

## Persistence

### Webdata journal (IndexedDB)

Database: `siteworks_webdata_journal`, schema version 1.

Object stores:
- `batches`: append-only records with app/context identity, timestamp, batch number, completion flag, reported item count, asset/description counts, continuation marker, and changed asset/description records.
- `meta`: latest stream metadata.

The journal is a recoverable source record, not a direct serialisation of `window.g_ActiveInventory`. The live Steam object contains runtime-only properties and can contain object references unsuitable for persistence.

### Filedata (localStorage)

Canonical key: `siteworksFiledata_v1`.

Shape:

```json
{
  "schemaVersion": 1,
  "designs": { "market_hash_name": { "label": "...", "firstSeenAt": 0 } },
  "inventory": {
    "complete": false,
    "holdings": { "market_hash_name": { "qty": 1 } }
  },
  "updatedAt": 0
}
```

The `designs` and `inventory` views are fields in one filedata record, not independent inventories. The old `siteworksKnownCardDesigns_v1` and `siteworksInventoryFullScan_v1` keys are read once for migration. New writes go to the canonical filedata record. Saved price data remains separate because it has a separate source and refresh lifecycle.

The filedata model is a materialised view. `S.rebuildFiledataFromWebdataJournal()` replays the captured journal into a fresh projection if reconciliation logic changes. Do not treat the journal and filedata as two competing authorities: the journal preserves captured source records; filedata is the current application-facing projection.

## UI ownership

- **Design capture** owns the single **Synchronise inventory** operation and Stop.
- **Price capture** owns market-price requests only. It reads known designs from filedata; it must not start an inventory scan.
- **Inventory list** is a read-only presentation of filedata plus saved price data. Search, sort and filters must not initiate inventory requests.

A new inventory acquisition button must not be added to Price capture or Inventory list.

## Meaning of counts and completeness

- Asset entries are individual Steam asset records; a stack can have `amount > 1`.
- Designs are unique `market_hash_name` identities.
- Item quantity is the sum of asset `amount` values grouped by design.
- Description count is a dictionary count and is not expected to equal asset count.
- Missing descriptions mean unresolved metadata, not zero quantity.
- Partial filedata must remain visibly partial after a stop, failure or page reload.
- Complete means Steam reported `m_bFullyLoaded === true` and every non-currency asset could be resolved to a design identity. Never infer completion from a percentage, page count, stable asset count or absence of an active request.

## Website dependencies and assumptions

The observed Steam page on 21 November 2026 exposed:

- `window.g_ActiveInventory`
- `m_rgAssets`, keyed by asset ID
- `m_rgDescriptions`, keyed using class ID and sometimes instance ID
- `m_cItems`, `m_ulLastAssetID`, `m_bFullyLoaded`, `m_ActivePromise`
- `LoadMoreAssets()` and `AddInventoryData(data)`

The inspected `LoadMoreAssets()` checked active app identity, an active promise, fully-loaded state and a recent-error interval, then delegated to `LoadMoreAssetsMaster(1000)`. The inspected master method assembled `count` and `start_assetid` parameters and called `AddInventoryData()` on success. These are observations from one website build, not Valve guarantees.

The first observation reported 2,000 assets and 2,000 descriptions; a later observation reported 2,000 assets and 400 descriptions. The 60-second passive sample did not change. A separate inspection showed 17,318 reported items, 693 visual pages and 25 visible tiles. These figures are session-specific and must never be hard-coded.

## Future Steam update maintenance procedure

1. Use read-only DevTools inspection. Do not invoke Steam loader methods manually during diagnosis.
2. Check whether `g_ActiveInventory` exists and record the app/context identity.
3. Inspect the presence and types of `m_rgAssets`, `m_rgDescriptions`, `m_cItems`, `m_ulLastAssetID`, `m_bFullyLoaded` and `m_ActivePromise`.
4. Inspect current method source with `.toString()` only for methods that exist: `AddInventoryData`, `LoadMoreAssets`, `LoadMoreAssetsMaster`, `LoadCompleteInventory`.
5. Take two or more timed samples and compare counts, continuation markers and completion state.
6. Confirm description association by class/instance identity. Do not assume one description per asset.
7. Verify the active inventory guard, promise guard, delay/cooldown, request count and continuation behaviour before adapting the integration.
8. Prefer capability detection and a small adapter over hard-coded Steam version checks or brittle source-string matching.
9. Preserve the DOM-page fallback only as a fallback. Do not let it become a second inventory authority.
10. Test partial stop, loader rejection, tab switch, missing description, stack amount, duplicate design, fully-loaded completion, reload/recovery and IndexedDB write failure.

If a required field or method disappears, fail closed: preserve already committed filedata, report the missing capability, and do not guess a request URL or invent continuation state.

## Known limitations

- No live Brave/Steam test is performed by an offline build. The user must validate the native loader behaviour in their browser.
- A page refresh during a native request may interrupt the request; the webdata journal preserves batches already committed.
- The journal currently records changed/new serialisable records observed between samples. It is not a packet capture of Valve's HTTP response and cannot preserve fields Steam never exposes in its in-memory controller.
- Legacy DOM fallback remains structurally dependent on Steam's visual page controls and should be retired only after a verified alternative is available. It updates filedata only; market-price requests remain in the Price capture tab.


## Hotfix 19 — market-price boundary and shared projection

### Two distinct Steam data sources

Inventory webdata and market prices are not the same payload:

- **Inventory webdata** is supplied by Steam's inventory loader. It contains asset records and description records used to identify designs, ownership and quantities.
- **Market-price data** is obtained from Steam's separate `/market/priceoverview/` endpoint. Inventory descriptions do not guarantee a current lowest listing, median sale price, or buy-order value.

Consequently, a complete inventory synchronisation can correctly finish while some designs have no saved market price. This is not an inventory completeness failure. Price absence must remain a separate state and must not be converted into a zero price or a claim that no market listing exists.

### Hotfix 19 changes

- The market-price eligibility predicate now correctly recognises numeric app IDs. The earlier escaped regular expression could reject all IDs and show zero eligible designs despite existing inventory and saved price records.
- The price operation is labelled **Enrich prices** to describe its actual role: adding optional market data to designs already in shared filedata.
- The manual recovery-probe action has been removed. When a market-price cooldown expires, a user may explicitly start another enrichment batch; the extension does not send a probe request first.
- The cooldown is scoped to the market-price endpoint. It does not invalidate webdata, prevent filedata reads/rebuilds, or make inventory synchronisation dependent on market availability.
- Existing saved prices and history are projected into `siteworksFiledata_v1` (`prices` and `priceHistory`) while the legacy `cardShelfInvCache` store remains readable for compatibility. The shared filedata projection is the common read model; the legacy store is retained during migration rather than destructively removed.

### Price-state interpretation

| State | Meaning |
|---|---|
| Saved price | A valid price observation is stored with its source and timestamp |
| Price not yet enriched | No valid market-price observation has been saved |
| Market endpoint throttled | Further price requests are paused until the recorded time |
| Inconclusive response | The endpoint response could not safely be classified |
| No listing / no price | Only assert this when Steam returns a valid response that establishes it; absence of a saved price alone is insufficient |

### Maintenance after a Steam website change

1. Re-run the read-only webdata diagnostics in this document and confirm `g_ActiveInventory`, asset and description maps, app/context identity, and the native loader method still exist.
2. Verify that the native loader's promise contract and completion flag still behave as expected. Do not assume method names alone guarantee compatible semantics.
3. Check inventory response fields and description-key construction against a fresh observed sample.
4. Separately inspect the current market-price response shape and status codes before changing the price adapter.
5. Keep endpoint cooldowns isolated. A market-price throttle must never block local inventory viewing or webdata journal reconstruction.
6. Run automated tests, then perform a controlled live test with a small price batch. Never use a bulk probe to test recovery.
7. Preserve the previous webdata journal, filedata, price history and release ZIP until the new build passes acceptance.

### Acceptance checks added for HF19

- Numeric app IDs pass the eligibility predicate; blank/non-numeric IDs do not.
- The price panel's eligible and saved counts agree with the same shared design set.
- Existing legacy price records are merged into shared filedata by newest timestamp.
- Market-price cooldown messages name the market-price endpoint, not Steam inventory generally.
- An active price cooldown sends no request; after expiry, a user-started batch may proceed without a recovery probe.
- Inventory webdata remains readable and rebuildable while the market-price endpoint is throttled.

### Hotfix 19 additional correction: price persistence and UI

- The price tab is labelled **Price enrichment**, not a second capture/discovery process.
- Successful market-price responses are persisted locally immediately and projected into `siteworksFiledata_v1`. The legacy price store remains for compatibility.
- The previous intermediate JSON Downloads export has been removed from the enrichment batch. Price enrichment no longer requires exporting and re-importing a file to make saved values visible.
- The market-price eligibility regular expression now matches numeric app IDs. The previous escaped form could cause every design to fail eligibility checks, explaining the zero-eligible/zero-saved figures despite prices appearing in the inventory list.
- The price tab's saved-price counts are derived from the same `S.data.prices` records used by the list; filedata mirrors these records for rebuild/recovery. Do not infer that every missing saved price has no market listing.
