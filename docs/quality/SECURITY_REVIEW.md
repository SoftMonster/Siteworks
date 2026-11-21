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
- The supplied `helper/com.siteworks.helper.json` contains an absolute machine-specific path. Confirm the installer generates a correct host manifest for the current install location; do not assume the checked-in path is portable.
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
