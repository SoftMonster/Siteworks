# Site Works 1.4.0 — R1: Reliability & Configuration

## Scope
R1 establishes shared configuration and page-side services, standardises notification behaviour, and adds mandatory safeguards to the existing automated Steam listing workflows. It preserves the Manifest V3 extension architecture, folder matching, default-deny/hash-bound permission gate, popup/request/editor/Manage flows, native helper and existing site scripts.

## New shared infrastructure
- Added `config.js`, a versioned configuration schema with validation, bounded numeric values and immutable safety requirements.
- Added central configuration storage and serialized updates in the service worker.
- Added a Shared configuration section to Manage for currency, quick-sell threshold, undercut, per-run listing cap, minimum request interval and notification preferences.
- Added `steam-finance.js` with reusable integer-minor-unit buyer-total and seller-receives calculations.
- Added `siteworks-services.js` with accessible, configurable page notifications.
- Site Works injects the normalized user preferences and shared page utilities before running an approved site script.

## Safety and reliability changes
- Quick Sell now always requires confirmation.
- Quick Sell is capped at the configured number of successful listings per run (default 20; maximum configurable value 500).
- Quick Sell enforces a minimum 4-second interval between item-price lookups/listing operations.
- HTTP 429 causes the direct quick-sell workflow to stop without an automatic retry.
- The Card Shelf quick-sell workflow uses the shared threshold, per-run cap and request interval.
- Bulk listing removal no longer replaces `window.confirm` or automatically clicks confirmation buttons. It displays a destructive-action preview and leaves Steam confirmation dialogs under user control.
- Manage-page notifications now use accessible status/alert semantics and consistent severity levels.

## Compatibility
- Existing stored permissions, including SHA-256-bound allow decisions, are preserved.
- Existing settings (`enabled`, `paused`, `perms`, `log`) are preserved; the new `config` key is additive.
- Scripts run directly in Tampermonkey without Site Works still use safe local defaults, but do not receive Site Works' central configuration/services.

## Validation performed
- `npm test`: 14 tests passed (existing matching/permission tests plus configuration, fee arithmetic and safety regression tests).
- `npm run check`: 21 JavaScript files passed Node syntax validation.

## Validation not performed
- No live Brave/Chromium browser session was available for UI smoke testing.
- No live Steam market or inventory transactions were performed.
- Windows PowerShell/native messaging installation was not executed in this environment.
- Steam DOM workflows remain dependent on the current Steam page structure and must be smoke-tested manually before real transactions.

## Upgrade notes
Replace the existing unpacked Site Works folder with the contents of this release, then use `brave://extensions` → Site Works → Reload. Existing permission decisions remain in browser extension storage. The native file helper is versioned from `manifest.json`; if the helper reports a mismatch, run `Install file helper.cmd` from the new release folder.
