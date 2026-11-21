# System Architecture

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
