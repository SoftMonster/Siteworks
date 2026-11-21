# Data Dictionary and Domain Terms

## Mandatory terminology

| Term | Meaning |
|---|---|
| Webdata | Data currently exposed by the Steam webpage in memory |
| Filedata | Site Works locally persisted, reconciled inventory model |
| Webdata journal | Append-only, versioned IndexedDB records of serialisable asset/description data captured from Steam |
| Saved price data | Separate market-price observations; not inventory webdata |
| Asset | Individual Steam inventory asset record, identified by asset ID; may represent a stack |
| Design | Unique item identity, commonly `market_hash_name` |
| Holding / quantity | Owned amount grouped by design; quantity is sum of asset `amount` values |
| Description | Steam metadata record used to resolve an asset to a design |
| Complete inventory | Steam reports fully loaded and all non-currency assets resolve to design identities |

Avoid the ambiguous user-facing word “cache” for inventory state. Legacy identifiers may retain the word for compatibility.

## Steam webdata fields (observed names)

| Field | Observed role | Caveat |
|---|---|---|
| `window.g_ActiveInventory` | Active Steam inventory controller | Undocumented page implementation |
| `m_rgAssets` | Asset dictionary keyed by asset ID | Runtime structure may change |
| `m_rgDescriptions` | Description dictionary, keys include class/instance identity | Count need not equal asset count |
| `m_cItems` | Steam-reported item count | Session-specific; do not infer completion from it |
| `m_ulLastAssetID` | Continuation/last asset marker | Validate semantics after Steam changes |
| `m_bFullyLoaded` | Steam fully-loaded indicator | Required completion signal in current design |
| `m_ActivePromise` | Active load promise/state | Runtime implementation detail |
| `LoadMoreAssets()` | Steam page loader method observed | Not a public API guarantee |
| `AddInventoryData(data)` | Steam page method observed for adding loaded data | Not a public API guarantee |

## Filedata shape

The architecture document defines the core localStorage key `siteworksFiledata_v1` and schema version 1:

```json
{
  "schemaVersion": 1,
  "designs": {
    "market_hash_name": {
      "label": "...",
      "firstSeenAt": 0
    }
  },
  "inventory": {
    "complete": false,
    "holdings": {
      "market_hash_name": { "qty": 1 }
    }
  },
  "updatedAt": 0
}
```

HF19 additionally projects price information under `prices` and `priceHistory`, as documented in the architecture file. Inspect the implementation's `readFiledata` / `writeFiledata` and migration logic before relying on exact optional fields or timestamp units.

## Journal

IndexedDB database: `siteworks_webdata_journal`, version 1. Object stores: `batches`, `meta`. Batch metadata documented in the architecture includes app/context identity, timestamp, batch number, completion flag, reported item count, asset/description counts, continuation marker, and changed asset/description records.

The journal captures serialisable records, not the live Steam controller object, DOM references, methods or cyclic references.

## Price states

- Saved price: valid observation stored with source and timestamp.
- Not yet enriched: no valid market observation saved.
- Market endpoint throttled: further requests paused until recorded cooldown expires.
- Inconclusive response: cannot safely classify response.
- No listing/no price: only claim when a valid response establishes it. Missing saved price is not proof of no market listing.

## Count semantics

- Asset count is not unique design count.
- Description count is not expected to equal asset count.
- Visual page count is not a completeness signal.
- Inventory reported item count may differ from asset dictionary entry count because stacks have `amount`.
- Unknown quantity is not zero.
- Catalogue designs are not necessarily owned holdings.
- Valuation must use owned holdings and available prices; missing prices must be reported separately.
