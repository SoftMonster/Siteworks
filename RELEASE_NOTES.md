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

# Site Works 1.5.0 — R2: Inventory Intelligence

## Scope
R2 builds on R1 and extends the existing Steam inventory price panel with consolidated valuation, historical price observations, buy-order spread, freshness filters, inventory snapshot comparisons, and text search. The existing inventory cache format remains readable; history is additive.

## Changes
- Added `inventory-intelligence.js` with pure, reusable valuation, freshness, snapshot-diff and same-currency spread functions.
- Injected the shared inventory intelligence module before approved site scripts.
- Inventory panel now shows estimated cached-price value multiplied by held quantities, coverage and unpriced design counts.
- Added persistent search and price-age filters (fresh under 2 days, aging 2–14 days, stale over 14 days, and missing).
- Added up to 90 price observations per card design when refreshed; unchanged observations update their timestamp rather than creating redundant points.
- Added inventory snapshot comparison for additions, removals and quantity changes.
- Buy-order column now displays the spread only when listing and bid currencies match.
- Preserved existing Card Shelf price import/export structure and Steam request cooldown behaviour.

## Limitations
- Valuation is an estimate based on cached lowest listings, not guaranteed sale proceeds; it excludes transaction fees and market liquidity.
- Price history begins when R2 observes refreshes; historical prices are not reconstructed.
- Inventory change detection compares snapshots captured when the inventory panel is rendered; it cannot infer whether a change was a sale, trade, purchase or other event.
- Price refresh still depends on Steam's public price overview response and current page/session availability.
- No live Steam transactions or browser UI tests were performed.

## Validation
- `npm test` includes R1 regressions and R2 inventory-intelligence tests.
- `npm run check` validates JavaScript syntax across the release.
