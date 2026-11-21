# Diagnostics and Recovery Runbook

## General rules

- Preserve existing user data before experimenting.
- Use read-only inspection first.
- Do not invoke undocumented Steam loader methods manually during diagnosis.
- Do not repeatedly retry Steam requests after HTTP 429. The project's stated policy is to stop and wait.
- Do not mark partial data complete to make the UI look healthy.
- Capture console output, timestamps, app/context identity and the exact user action before changing code.

## Extension fails to load

1. Open `brave://extensions`.
2. Inspect Site Works' Errors panel.
3. Confirm the selected folder contains `manifest.json`.
4. Check manifest JSON validity and referenced files.
5. Inspect service-worker console.
6. Run `npm run check` and `npm test`.
7. Record the first error, not just subsequent cascading errors.

## A script does not run

1. Confirm Site Works is enabled globally.
2. Confirm the site is not paused.
3. Confirm the URL is covered by `sites/index.json` and the folder/host rules.
4. Check whether the script has a remembered Reject or lacks an Allow decision.
5. Check the script's content hash; changed content may require approval again.
6. Inspect the service-worker log and permission prompt queue.
7. Confirm the page is eligible for injection and reload if necessary. Already-running scripts are not necessarily stopped by toggling the extension off.

## Native helper disconnected

1. Confirm the helper is installed for the current Windows user.
2. Check the native messaging host registration path and extension origin.
3. Confirm the `.cmd` launcher and PowerShell files exist at the registered path.
4. Inspect Manage helper status and browser extension errors.
5. Re-run the installer only after confirming it targets the current extracted folder and expected extension ID.
6. Test with a harmless index rebuild.
7. If helper operation is unavailable, use the documented manual alternative: edit files in the extracted `sites` folder and run `Rebuild index.cmd`.

## Inventory synchronisation is partial or blocked

1. Record the exact Steam inventory URL, app ID, context ID and time.
2. In DevTools Console, inspect (read-only) whether `window.g_ActiveInventory` exists.
3. Record whether these properties exist and their types/counts: `m_rgAssets`, `m_rgDescriptions`, `m_cItems`, `m_ulLastAssetID`, `m_bFullyLoaded`, `m_ActivePromise`.
4. Inspect method presence, not execution: `AddInventoryData`, `LoadMoreAssets`, `LoadMoreAssetsMaster`, `LoadCompleteInventory`.
5. Compare at least two timed snapshots. Do not infer completion from stable counts.
6. Check whether asset descriptions resolve by class/instance identity.
7. Check whether Steam itself reports fully loaded.
8. Inspect Site Works logs and its own cooldown/block status.
9. Preserve current Filedata and journal before any recovery experiment.
10. If a required capability is absent, stop and report blocked. Do not invent endpoint URLs or continuation markers.

## Useful read-only DevTools expressions

```javascript
const inv = window.g_ActiveInventory;
({
  present: !!inv,
  appid: inv?.m_appID,
  contextid: inv?.m_contextID,
  assetCount: inv?.m_rgAssets ? Object.keys(inv.m_rgAssets).length : null,
  descriptionCount: inv?.m_rgDescriptions ? Object.keys(inv.m_rgDescriptions).length : null,
  reportedItems: inv?.m_cItems,
  lastAssetId: inv?.m_ulLastAssetID,
  fullyLoaded: inv?.m_bFullyLoaded,
  activePromise: !!inv?.m_ActivePromise,
  methods: {
    loadMore: typeof inv?.LoadMoreAssets,
    addData: typeof inv?.AddInventoryData,
    loadMaster: typeof inv?.LoadMoreAssetsMaster,
    loadComplete: typeof inv?.LoadCompleteInventory
  }
});
```

This is diagnostic observation only. Steam can change these names and semantics.

## Data inspection

Use DevTools → Application:
- Local Storage for the Steam origin / extension context as appropriate; locate `siteworksFiledata_v1`.
- IndexedDB → `siteworks_webdata_journal` → `batches` and `meta`.

Record schema version, timestamps, app/context identity, batch count, completion metadata and continuation markers. Avoid manually editing records. Export/copy relevant records before any destructive operation.

## Recovery principles

The architecture describes the IndexedDB journal as captured source records and localStorage Filedata as a rebuildable materialised view. `S.rebuildFiledataFromWebdataJournal()` is identified in the architecture document as the rebuild entry point. Before invoking any recovery path, verify the function exists in the current script and understand its exact effects.

Recovery tests still required:
- journal batch committed, projection write fails;
- projection write succeeds but browser closes before subsequent UI state update;
- duplicate batch replay;
- out-of-order batch replay;
- malformed journal record;
- storage quota exceeded;
- schema migration interruption;
- page reload while Steam loader promise is active;
- tab/app/context changes during synchronisation.

Do not claim these cases are safely handled until executed and recorded.
