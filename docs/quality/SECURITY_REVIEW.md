# Security Review — Source-Based Baseline

## Scope and limitations

This is a first-pass review of the supplied archive, not a penetration test, formal threat model approval or security certification. It identifies visible controls and questions requiring inspection/testing.

## Manifest permissions (SOURCE-VERIFIED)

`manifest.json` declares:

| Permission | Likely purpose from product/source | Review action |
|---|---|---|
| `scripting` | Inject approved scripts | Confirm injection paths always pass through decision gate |
| `webNavigation` | Observe navigation/tab changes | Limit collected URL/state data |
| `storage` | Persist extension settings, decisions and logs | Review sensitive data and retention |
| `contextMenus` | Right-click menu integration | Confirm actions validate tab/page context |
| `nativeMessaging` | Communicate with Windows helper | High-trust boundary; review every message/action |
| `clipboardWrite` | Clipboard features | Ensure user action and clear UI feedback |
| Host permission `<all_urls>` | Broad site coverage for user scripts | Broad permission; document necessity and consider optional host permissions if feasible |

Minimum Chrome version is 106. Service worker is `background.js`.

## Trust boundaries

1. **Untrusted website content → injected user script.** DOM text, attributes, page globals and network responses may be attacker-controlled.
2. **Extension service worker → page execution.** Permission decisions and script hashes must be enforced before injection.
3. **Extension → native helper.** Native messaging can access local files; validate every message and restrict operations/paths.
4. **Extension storage → UI/runtime.** Stored decisions/configuration may be stale or malformed; normalize and validate.
5. **Steam globals → inventory parser.** Treat as external, mutable input, not trusted API contracts.
6. **Market endpoint → price parser.** Validate response status, schema, currency and numeric amounts.

## Existing controls evidenced in project docs/tests

- Default-deny permission model described in README and `background.js`.
- SHA-256-bound remembered decisions described in README and `match.js`.
- Config normalization and safety floors covered by R1 tests.
- Quick-sell confirmation, per-run cap, minimum four-second request interval and no automatic retry after HTTP 429 described in README and R1 tests.
- Bulk listing removal does not auto-confirm Steam dialogs per README/test.
- Native helper is described as restricted to `.js`/`hosts.txt` under `sites`, moving scripts to `trash`, rebuilding index and opening an editor. Verify the actual helper implementation before treating this as a security guarantee.

## Required threat scenarios

| Threat | Potential impact | Required control/evidence |
|---|---|---|
| Malicious page data reaches privileged helper | Arbitrary file write or command execution | Strict message schema, allowlisted operation enum, canonical path checks, no shell interpolation |
| Path traversal / symlink escape | Write outside `sites` | Canonicalize paths and prove containment after resolution |
| Compromised/modified user script | Page-context data access/actions | Hash-bound reapproval, clear origin/file identity, review changed code |
| Forged permission prompt | Unapproved script execution | Prompt must be extension-owned; validate sender/tab/request IDs |
| Overbroad host permissions | Unnecessary access | Permission rationale; evaluate optional host permissions |
| Sensitive values in logs | Privacy leakage | Redaction, bounded retention, no credentials/tokens |
| Malformed local storage | Corrupt state or unsafe defaults | Schema validation, fail-safe defaults, migration tests |
| Steam structure change | Incorrect ownership/completion | Capability checks, fail closed, visible blocked state |
| Price response spoofing/malformed currency | Incorrect valuation | Validate app/name/currency/amount and preserve source/time |
| Update/package tampering | Malicious release | Controlled source revision, hashes, signed distribution |

## Immediate review findings

- `host_permissions` is `<all_urls>`; broad access is explicit in the manifest.
- `nativeMessaging` is powerful and deserves a separate code-level audit.
- The `helper/com.siteworks.helper.json` in the supplied ZIP contained an absolute path including a Windows user name. It is per-machine generated output; it is now untracked and removed from the release tree (the installer recreates it).
- **Static review of the helper and relay (rescue pass; read, not executed).**
  - Reachability: `chrome.runtime.sendNativeMessage` is called only from `ui.js`, used by extension pages. `manifest.json` has no `content_scripts`, `web_accessible_resources` or `externally_connectable`, and `background.js` ignores messages not sent by an extension-origin page (`fromOwnPage`), so websites and page-context scripts have no route to the helper or the gate.
  - Host registration: `allowed_origins` is one extension ID; the ID derived from the manifest `key` (`falhkcegdkgfjmgnebblkjdhikgefoaf`) matches the value the installer writes.
  - Command surface: fixed `switch` over `ping, rebuild, write, hosts, trash, edit, reveal`; unknown commands refused; 4 MB message cap; no `Invoke-Expression`, no string-built shell commands.
  - Path containment (`Resolve-SWPath`): rejects `: * ? " < > |` and control characters, empty/`.`/`..` segments, trailing dots/spaces, Windows reserved device names; requires `.js` (or `<Site>/hosts.txt`); canonical prefix check against `sites\`; refuses reparse points (junctions/symlinks) on existing components. Because quotes are rejected, paths passed to `Start-Process` cannot break out of their quoting.
  - `edit` opens VS Code or Notepad, never the default `.js` handler (Windows Script Host would execute it).
  - Residual (low): a time-of-check/time-of-use gap between the reparse-point check and the write for a local attacker who can already write inside `sites\` (who could change scripts directly); `hosts` accepts arbitrary host strings (it only decides where already-approved scripts may run; changed scripts still need approval); launcher uses `-ExecutionPolicy Bypass` per process.
  - **Executed (recovery Phase 3, 2026-11-21):** `node scripts/helper-selftest.cjs` drives the real `siteworks-host.ps1` over the native-messaging wire format in a throw-away sandbox. Result on **Linux / PowerShell 7.7.0: 93 of 93 checks passed** (11 legitimate-behaviour, 52 hostile-path, 4 symlink-escape, 9 odd-but-legal names written literally with no command execution, 15 malformed-frame, 2 integrity). Every hostile case was refused **and** left the whole sandbox byte-identical. Evidence: `docs/evidence/helper-selftest-linux-pwsh7.7.0-2026-11-21.json`.
  - **The tests were checked for sensitivity.** Each protection was disabled in turn and the harness failed as it should: symlink refusal (5 failures), the `..` check, the trailing-dot rule and the containment prefix check, and the 4 MB message cap (after strengthening that test). Removing any single traversal layer is *not* enough to escape (two others still refuse), which confirms defence in depth; removing all three is caught.
  - **Limits of that evidence:** this ran on Linux under PowerShell 7, not Windows PowerShell 5.1. Windows-only behaviour (reserved device names on a real NTFS volume, 8.3 short names, junctions, `.cmd` launch, Notepad/Explorer launch, `reveal`/valid `edit`) is **not** proven. Valid `edit`/`reveal` are deliberately not exercised because they open GUI programs. TOCTOU and very large valid messages are not tested.
  - **TD-05 status: partly executed.** Closes only when `node scripts/helper-selftest.cjs` passes on a Windows machine (recovery step R-04).
- The extension manifest embeds a fixed public key. This is an extension identity mechanism, not a secret.
- The archive contains no formal threat model or security test report.

## Acceptance criteria for security sign-off

1. Review all native helper message handlers and path validation.
2. Demonstrate no message can invoke arbitrary command or write outside approved directories.
3. Test malformed, oversized and unexpected native messages.
4. Confirm script approval is checked immediately before execution and changed hashes trigger the intended decision flow.
5. Verify prompt sender/origin binding.
6. Review all logging for secrets and personal data.
7. Justify every permission, especially `<all_urls>` and `nativeMessaging`.
8. Record reviewer, date, findings, severity, remediation and residual risk.
