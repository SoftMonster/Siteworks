# Installation and Development Setup

## Prerequisites

**SOURCE-VERIFIED:** `package.json` declares Node.js `>=18`; tests use Node's built-in test runner. The extension is Manifest V3 and declares `minimum_chrome_version` 106. The project README specifically documents Brave/Chromium and loading unpacked.

For native helper operations, use a Windows environment with PowerShell and a Chromium-family browser supporting native messaging. Exact supported Windows/PowerShell versions are not pinned in this archive and should be confirmed on the target machine.

## Load the extension

1. Extract the release ZIP to a stable local folder. Do not run from a temporary Downloads extraction that may later move.
2. In Brave, open `brave://extensions` (or the equivalent extensions page in another Chromium browser).
3. Enable Developer mode.
4. Choose **Load unpacked**.
5. Select the extracted `Siteworks` folder containing `manifest.json`.
6. Confirm Site Works appears and inspect the extension error panel for load errors.
7. Open a target page and use the extension popup to inspect status. The first matching script should require an explicit decision under the default-deny model.

Do not install the optional native helper until its path/registration has been checked for the actual machine.

## Install or refresh the native helper (optional)

The supplied `Install file helper.cmd` runs `helper/install-helper.ps1` through PowerShell. The helper is intended to allow constrained file operations such as writing scripts under `sites`, rebuilding the index, moving scripts to `trash` and opening a text editor.

Before running it:
1. Inspect `helper/com.siteworks.helper.json`.
2. Confirm the installer writes a correct per-user native messaging registration for the actual extracted directory.
3. Confirm the allowed extension origin matches the extension ID shown in `brave://extensions`.
4. Do not manually reuse the absolute path embedded in the checked-in/template JSON; it contains a machine-specific path.
5. Run installation and then confirm Manage reports helper status as Connected.
6. Test a harmless operation in a disposable copy before relying on it for project changes.

If helper registration is wrong, uninstall/reinstall using the provided script after reviewing its actions. Do not hand-edit registry values without understanding the installer.

## Development checks

From the `Siteworks` directory:

```powershell
node --version
npm test
npm run check
```

`npm test` runs `node --test tests/*.test.cjs`. `npm run check` runs `scripts/check-js.cjs`, which walks the project and invokes `node --check` on `.js` files, excluding `.git`, `node_modules` and `trash`.

No build/bundling step is declared in `package.json`. The generated site index is a separate PowerShell operation:

```powershell
.\Rebuild index.cmd
```

or, if permitted and PowerShell policy allows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .uild-index.ps1
```

Do not assume the generated index is current after editing the `sites` tree. Rebuild it and inspect the diff.

## Development workflow

1. Preserve a copy of the known-good ZIP.
2. Identify the requirement and affected module.
3. Inspect existing tests and release notes.
4. Make the smallest change that satisfies the requirement.
5. Add a focused regression test.
6. Run `npm test` and `npm run check`.
7. Rebuild `sites/index.json` if script folders or hosts change.
8. Review permission/security implications.
9. Test in a clean unpacked extension profile.
10. For Steam-specific changes, execute the relevant live test procedure; offline tests do not prove Steam compatibility.
11. Record the change, evidence, known limitations and rollback point.

## Debugging locations

- Extension service worker: `brave://extensions` → Site Works → service worker Inspect.
- Extension UI: right-click popup/manage/editor and inspect.
- Target page: F12 → Console and Sources; inspect only read-only Steam properties during diagnosis.
- Storage: DevTools Application panel → Local Storage / IndexedDB.
- Extension errors: extension details page and service-worker console.
