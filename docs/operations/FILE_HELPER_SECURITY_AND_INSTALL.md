# Native File Helper — Installation and Security Notes

## Purpose

The optional Windows helper bridges the extension to constrained local file operations. The README describes writing `.js` and `hosts.txt` under `sites`, moving scripts to `trash`, rebuilding `sites/index.json` and opening a script in a text editor. The helper is not intended to execute user scripts.

## Files

- `helper/siteworks-host.ps1`: native messaging host loop.
- `helper/siteworks-lib.ps1`: file/index helper functions.
- `helper/siteworks-host.cmd`: launcher.
- `helper/install-helper.ps1`: per-user registration.
- `helper/com.siteworks.helper.json`: native host manifest/template.
- `Install file helper.cmd`: user-facing installer.
- `Uninstall file helper.cmd`: removal entry point.

## High-priority portability check

The supplied `helper/com.siteworks.helper.json` contains a literal absolute path under a specific Windows user profile and repository. This is not portable by itself. Confirm the installer generates the registration manifest for the current installation path and the actual extension ID. Test on a clean Windows user profile before distributing.

## Required code audit before security sign-off

Inspect:
1. Native message framing and JSON parsing.
2. Operation dispatch: allowlisted operation names only.
3. Path canonicalisation and containment under the intended project root.
4. Extension-origin validation.
5. File extension allowlist and filename validation.
6. Handling of symlinks/reparse points.
7. Maximum message size and malformed input.
8. Error handling and output framing.
9. No shell command construction from untrusted input.
10. No arbitrary script execution.

## Operational test

Use a disposable copy:
1. Install helper.
2. Confirm Manage shows Connected.
3. Create a harmless test script using the editor.
4. Rebuild index and verify the entry.
5. Move test script to trash.
6. Confirm no file outside the project tree was created/modified.
7. Uninstall helper and verify registration is removed.

This procedure has not been executed in the handover preparation environment.
