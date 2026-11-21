# Site Works maintenance update

## Preserved behaviour

This update retains the existing Manifest V3 extension, folder-based matching, default-deny/hash-bound permission gate, popup/request/editor/Manage flows, native helper, and bundled site scripts. It does not activate the archived toolbox or reinterpret userscript metadata.

## Repairs and hardening

- Fixed the Manage page's empty-table rendering: `Element.append()` returns `undefined`, so chaining `.append()` caused a runtime exception.
- Routed Manage-page permission changes, imports, and log mutations through the service worker's serialized storage queues to avoid lost updates.
- Added validation and normalization for imported and edited permission records; failed permission writes now reach the caller rather than being silently reported as successful.
- Hardened index loading against malformed paths and control characters.
- Replaced hand-built PowerShell index JSON with `ConvertTo-Json`, avoiding malformed JSON for valid names containing quotes or backslashes.
- Added rejection of symlinks/junctions within the helper's `sites` path to prevent lexical path checks being bypassed.
- Derived the native helper's reported version from `manifest.json`.
- Removed a committed native-host manifest containing a machine-specific absolute Windows path; the installer generates it locally.
- Added automated tests for the folder/host matching rules and a JavaScript syntax-check command.
- Prevented the editor from attempting to load a file that is not present in the generated index.

## Validation performed

- `npm test`: 8 matching and permission tests pass.
- `npm run check`: syntax validation passes for all 18 active JavaScript files.

## Validation not performed

A Chromium/Brave browser session and Windows PowerShell are not available in this build environment. Native messaging, browser UI flows, registry installation, and the bundled Steam scripts therefore still require an on-machine smoke test. The PowerShell changes were reviewed but not executed here.
