# Site Works — Architecture Reference

This is the consolidated reference for runtime structure, source components and domain/data terminology. The detailed inventory journal design remains in `WEBDATA_FILEDATA_ARCHITECTURE.md`.

## Source: `SYSTEM_ARCHITECTURE.md`

## 1. Product boundary

Site Works is a local Chromium/Brave Manifest V3 browser extension. Its stated purpose is to run user scripts selected by folder and URL match, subject to a user permission decision. The supplied manifest declares MV3, minimum Chrome 106, service worker `background.js`, popup `popup.html`, options page `manage.html`, and the permissions listed below.

This is not a server-hosted application. The browser extension, local extension files, target website, browser storage and optional Windows native-messaging helper form the system boundary.

## 2. Runtime components

```text
Brave / Chromium
├── Extension service worker: background.js
│   ├── permission/decision gate
│   ├── tab/navigation and command handling
│   ├── prompt/popup/manage/editor coordination
│   └── script injection via chrome.scripting
├── Extension UI pages
│   ├── popup.html + popup.js
│   ├── manage.html + manage.js
│   ├── editor.html + editor.js
│   ├── prompt.html + prompt.js
│   └── clip.html + clip.js
├── Shared page-side libraries
│   ├── match.js
│   ├── config.js
│   ├── siteworks-services.js
│   └── steam-finance.js
├── User scripts under sites/
│   └── Steamworks/inventory/steam-inventory-prices.js
└── Optional native messaging
    └── Windows PowerShell host + helper library
```

The diagram is a conceptual dependency view derived from file names and source inspection, not a generated runtime call graph.

## 3. Permission gate

**SOURCE-VERIFIED:** `background.js` contains decision storage, request queueing, prompt display, decision handling, script execution and SHA-related decision support. `match.js` provides folder/URL matching and script hashing/decision-key functions. The README describes default-deny and hash-bound remembered approvals.

The important security property is that a matching script should not be injected until the relevant decision permits it. A remembered approval tied to script content should become invalid when that content changes, subject to the editor's explicit preserve-decision option described by the README.

Do not describe this as a sandbox. Once injected, a script executes in the target page context and may have the capabilities of that context. The permission gate is an execution-approval control, not isolation from malicious or defective approved code.

## 4. Folder and URL routing

`sites/index.json` is the generated script index. `match.js` contains host/path matching, index loading, matching-script ordering, SHA-256 script hashing, permission key and verdict logic. The README documents the folder convention:

- `sites/<Site>/...` identifies a site grouping.
- `hosts.txt` can define exact host coverage.
- Nested folder names represent ordered URL path components.
- Shallower matches execute before deeper matches; file names order scripts within a folder.
- Host-specific subfolders narrow a site's coverage.

When adding, renaming or removing scripts or editing `hosts.txt`, rebuild the index with `Rebuild index.cmd` or the helper-backed rebuild action.

## 5. Steam inventory data flow (HF19)

The detailed source design is in `WEBDATA_FILEDATA_ARCHITECTURE.md`. The intended flow is:

1. User starts the single inventory synchronisation operation in Design capture.
2. The script reads the Steam page's in-memory inventory data.
3. Serializable changed/new asset and description records are appended to the IndexedDB webdata journal.
4. The data is reconciled into the application-facing filedata model.
5. When Steam's native loader capabilities are detected, the script requests further batches through the page's own loader, one at a time.
6. Completion is accepted only when Steam indicates fully loaded and all non-currency assets resolve to design identities.
7. Market-price enrichment is a separate operation and source. Inventory list is a read-only projection.

**Important:** this is the documented design and source implementation intent. It is not proof that every crash/interruption interleaving is recoverable. See R2 acceptance and live tests.

## 6. Persistence stores

| Store | Role | Current documentation |
|---|---|---|
| IndexedDB `siteworks_webdata_journal` | Versioned journal of captured webdata batches and metadata | Schema v1; stores `batches`, `meta` |
| localStorage `siteworksFiledata_v1` | Application-facing materialised filedata projection | Schema v1; designs, inventory and HF19 price projection |
| Legacy `siteworksKnownCardDesigns_v1` / `siteworksInventoryFullScan_v1` | Read-once migration inputs | Retained for compatibility/migration |
| Legacy `cardShelfInvCache` | Legacy price records read during HF19 migration/projection | Retained for compatibility |
| Extension storage | Decisions, preferences, logs and extension state | Inspect relevant storage calls in source before changing |

Do not assume cross-store atomicity. IndexedDB and localStorage do not share a transaction. A failure between writes must be explicitly tested and recovery behaviour must be verified before making stronger guarantees.

## 7. External dependencies

- Steam Community inventory page and its page-owned JavaScript objects/methods.
- Steam market price overview endpoint for optional price enrichment.
- Brave/Chromium extension APIs.
- Windows PowerShell and native messaging for optional file operations.

Steam page globals and methods are undocumented implementation details, not a stable Valve API contract. The architecture document records observed names and a maintenance procedure. Any Steam change requires capability revalidation.

## 8. Key invariants to preserve

- Default-deny script execution.
- No silent escalation of remembered permissions.
- Keep inventory acquisition in Design capture; price enrichment does not start an inventory scan.
- Do not call unknown quantity zero.
- Do not call a partial inventory complete.
- Keep market-price cooldown separate from inventory acquisition.
- Do not automatically retry after HTTP 429 where the documented safeguard applies.
- Preserve already committed data when an operation stops or fails.
- Fail closed when required Steam capabilities are absent.

---

## Source: `COMPONENT_CATALOGUE.md`

This catalogue covers every meaningful source area in the supplied archive. It is intentionally not a claim that every function has been exhaustively documented; inspect the named source before modifying behaviour.

| Path | Responsibility / observations |
|---|---|
| `manifest.json` | Manifest V3 metadata, extension entry points, permissions, host permissions, commands |
| `background.js` | Service worker: settings/config, decision storage, logs, permission requests, queue, injection, navigation, menus, badges, shortcuts |
| `match.js` | Site index, URL/host matching, script order, SHA-256 hashing, permission keys and verdicts |
| `config.js` | Shared configuration normalization, bounds and merge |
| `siteworks-services.js` | Shared page-side notification service (`show`) |
| `steam-finance.js` | Steam buyer/seller fee arithmetic |
| `inventory-intelligence.js` | Price freshness, valuation, snapshot comparison and buy-order spread calculations |
| `popup.html`, `popup.js` | Toolbar popup UI and controls |
| `manage.html`, `manage.js` | Management UI, permissions/scripts/log/config/helper operations |
| `editor.html`, `editor.js` | Script editor and file-helper interaction |
| `prompt.html`, `prompt.js` | Permission request UI |
| `clip.html`, `clip.js` | File/clipboard collection UI |
| `ui.js`, `ui.css` | Shared extension UI helpers and styling |
| `sites/index.json` | Generated routing index for user scripts |
| `sites/00-toolbox.js.old` | Old/retained toolbox source; `.old` means it is not a normal `.js` script entry |
| `sites/Steamworks/steamworks-tweaks.js` and numbered variants | Steam page customisations; inspect each before changing |
| `sites/Steamworks/GetSteamGames.js` | Steam game-related user script |
| `sites/Steamworks/7NewBadgeButtons.js` | Steam badge UI script |
| `sites/Steamworks/NewWindowLink.js` | Steam link behaviour |
| `sites/Steamworks/id/ProfileButtons.js` | Steam profile-page script |
| `sites/Steamworks/inventory/steam-inventory-prices.js` | Main R2 inventory/design/price capture and presentation implementation; large, self-contained script |
| `sites/Steamworks/inventory/steam-quick-sell.user.js` | Quick-sell script with confirmation/cap/request pacing safeguards described by README/tests |
| `sites/Steamworks/market/clear-steam-listings.js` | Market listing removal helper; tests/README state it does not auto-confirm Steam dialogs |
| `helper/siteworks-host.ps1` | PowerShell native messaging host |
| `helper/siteworks-lib.ps1` | Helper library for constrained file/index operations |
| `helper/siteworks-host.cmd` | Host launcher |
| `helper/install-helper.ps1` | Registers native messaging host for current Windows user |
| `helper/com.siteworks.helper.json` | Native messaging host manifest template/registration data |
| `build-index.ps1`, `Rebuild index.cmd` | Rebuild generated site script index |
| `scripts/check-js.cjs` | Recursively syntax-checks `.js` files with Node, excluding `.git`, `node_modules`, `trash` |
| `tests/*.test.cjs` | Node built-in test suite covering routing, config, fee/safety and R2 regression behaviour |
| `RELEASE_NOTES.md` | Historical release and hotfix narrative |
| `docs/WEBDATA_FILEDATA_ARCHITECTURE.md` | Detailed R2 data architecture |
| `docs/Site Works Functional Design and Technical Specification.pdf` | Existing functional/technical specification |
| `trash/2026-10-22_22-12-53/...` | Retained historical source; not active runtime path unless explicitly restored |

## Important implementation concentration

The R2 inventory functionality is concentrated in `sites/Steamworks/inventory/steam-inventory-prices.js` (approximately 101 KB in this archive). Its functions include UI rendering, filedata read/write, saved price state, inventory cooldown handling, Steam capability inspection, description resolution, IndexedDB journal operations, webdata snapshots, native loading, page fallback/discovery and progress rendering.

This concentration is a maintainability risk. A future refactor could split the script into modules, but only after R2 acceptance and with regression coverage. Do not refactor as part of an urgent acceptance fix.

## Generated vs authored files

`sites/index.json` is generated by `build-index.ps1` via `helper/siteworks-lib.ps1`. Do not hand-edit it as the primary change. Edit source folder contents/hosts and rebuild.

## Stale or suspicious artefacts to review

- `README.md` labels itself Release 1.4.0 although `manifest.json` and `package.json` are 1.6.9.
- `README.txt` describes itself as Site Works 1.3 and may not reflect all current controls.
- `helper/com.siteworks.helper.json` contains an absolute Windows path with a specific user's Documents/GitHub location. Verify installer regeneration and portability on a clean Windows account.
- `sites/00-toolbox.js.old` and `sites/Claude.ai/page-cli.js.old` are archival/old files, not active `.js` scripts under the normal index scan.
- The project is a git repository (`origin`: `github.com/SoftMonster/Siteworks`; tags `v1.5.0`, `v1.6.9`). There is no lockfile because there are no dependencies.
- `scripts/build-release-notes.cjs` generates `release-notes.html` from `RELEASE_NOTES.md`; `scripts/manifest.cjs` writes/verifies `docs/RELEASE_FILE_MANIFEST.sha256`; `tests/consistency.test.cjs` keeps version labels, index and release notes aligned.
- `helper/com.siteworks.helper.json` is generated per machine by `Install file helper.cmd` and is no longer tracked or shipped.

---

## Source: `DATA_DICTIONARY.md`

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
