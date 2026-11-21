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


## 1.5.1 — R2 Hotfix: Complete inventory scan

- Adds an explicit **Scan all inventory pages** operation to Card Shelf prices.
- Traverses Steam's own Previous/Next inventory controls, aggregates card designs and quantities across pages, and publishes full-inventory totals only after a complete scan.
- Enforces a minimum 4-second wait between inventory page navigations; does not automatically retry failed page transitions.
- Supports stopping the scan. Partial results are labelled separately and are never represented as a complete inventory.
- Keeps the existing price refresh separate from inventory collection.
- Existing cached prices and R1/R2 settings are retained.

**Limitations:** Steam's live page controls and inventory loading must be tested in Brave. The scanner relies on Steam's current DOM selectors (`#pagebtn_next` and previous-page controls); a Steam interface change may prevent scanning. A full scan of hundreds of pages can take a long time.


# Site Works 1.5.2 — R2 Hotfix 3: Persistent throttling and manual recovery

## Scope
- Makes Steam price-refresh throttling persistent across browser restarts.
- Adds manual single-request recovery testing; no automatic retry or bulk refresh follows a successful probe.
- Retains existing cached prices and R2 inventory scan data.

## Changes
- Persists throttle state, last HTTP status, timestamps, retry-after information and escalation count in localStorage.
- Migrates the earlier R2.1 `{until, blocks}` cooldown record without losing an active cooldown.
- Stops the price queue on HTTP 429, access-denial/service-unavailable responses, unexpected HTTP responses, invalid JSON or network errors.
- Reads `Retry-After` when supplied; otherwise uses a bounded escalating cooldown (1, 2, 4, 8, 16, then 24 hours). These are conservative local fallback intervals, not claims about Valve's actual reset schedule.
- Adds a **Test Steam recovery** control. It sends one request for a marketable inventory item, does not update the cache, and only marks the endpoint responsive when valid Steam price-overview JSON is returned.
- After a successful probe, the user must manually start a small refresh batch. Any renewed block stops it immediately.
- A valid response with `success: true` but no price is counted as a genuine no-price result; invalid or challenge responses are not.

## Important limitations
- Valve does not provide a documented Community Market rate-limit status endpoint. `Retry-After` may be absent.
- A successful single probe does not guarantee that a larger batch will remain unthrottled. Resume conservatively.
- HTTP 403/502/503/504 are treated as blocking/unavailable responses and stop the queue; other unexpected responses are marked inconclusive and require a manual recovery probe.
- No live Steam request or browser session was executed during release validation.

## Validation
- Automated test suite and JavaScript syntax checks run as part of this package build.


# Site Works 1.5.3 — R2 Hotfix 4: Independent inventory-description throttling

## Scope
- Adds a persistent inventory/card-description loading state machine, separate from the existing Community Market price-refresh throttle.
- Treats missing descriptions, empty loaded pages and stalled page transitions as incomplete inventory acquisition, not as evidence that cards do not exist.

## Changes
- Persists inventory loading cooldown and incident count independently from price cooldown.
- Uses a bounded escalating local cooldown (1, 2, 4, 8, 16, then 24 hours); this is a conservative client-side pause, not a claim about Valve's reset schedule.
- Stops the inventory scan when a page fails to change or arrives without usable card descriptions.
- Preserves partial scan results on both user stop and load failure; partial results are never published as complete inventory.
- Adds a manual **Test inventory loading** control. After cooldown expiry, it performs one page navigation and checks whether card descriptions load. It does not automatically resume a full scan.
- A successful inventory probe only permits the user to manually start a new scan. Market price cooldown and cache remain independent and unchanged.

## Limitations
- Steam does not expose a documented endpoint reporting inventory-description throttle status. This hotfix detects symptoms in the visible inventory page; it cannot identify Valve's internal cause.
- The scanner still uses Steam's current page controls and DOM. Live Brave/Steam validation is required.
- A successful one-page probe does not guarantee that a full 693-page scan will complete.

## Validation
- Automated tests cover independent throttle state, cooldown persistence, manual recovery probe, partial-result preservation and scan gating.
- Syntax checks and package integrity are required before release.


# Site Works 1.5.4 — R2 Hotfix 5: Resumable new-design discovery

## Scope
- Adds a dedicated **Look for new designs** operation, separate from full inventory valuation and Community Market price refresh.

## Changes
- Traverses Steam inventory pages using the existing page controls and a minimum 4-second wait between successful page navigations.
- Compares each page response against a persistent local design catalogue, the existing price cache and any saved complete inventory scan.
- Saves each newly discovered design immediately, preserving prior discoveries if the scan is stopped or interrupted.
- Pauses on the first page response containing zero designs not already in the catalogue. The next-page cursor is persisted; clicking **Look for new designs** again resumes at the following page.
- At the final page, marks the traversal complete and resets the next manual discovery run to page one.
- Reuses the independent inventory-description cooldown and never initiates market-price requests.

## Limitations
- Discovery uses Steam's currently rendered inventory page and DOM controls; live Brave/Steam testing remains necessary.
- A zero-new-design page is treated as the requested stopping boundary. If a later page contains unseen designs beyond that boundary, click the button again to continue.
- The 4-second wait is a conservative client-side delay, not a guarantee against Steam throttling.


# Site Works 1.5.5 — R2 Hotfix 6: Inventory-completeness-aware design discovery

## Changes
- Adds a conservative completeness threshold for new-design discovery: `25 × total pages − 24`, allowing the final inventory page to contain as few as one item.
- Recognises Steam pagination labels expressed as an item range (for example, `1 - 25 of 17,300`) or a page count (for example, `Page 1 of 693`).
- A page with zero new designs no longer stops discovery while the estimated inventory-completeness threshold remains unmet; discovery continues through subsequent pages.
- Once the threshold is reached, a zero-new-design page may pause discovery and save the next-page cursor. The final-page control remains an independent completion signal.
- Shows a ⚠️ warning and progress count when a page contains no new designs but inventory completeness has not yet been established.
- Keeps immediate catalogue persistence, manual resume, the 4-second navigation delay, and independent inventory/price cooldowns.

## Limitations
- The threshold assumes 25 items on each preceding page and at least one item on the final page. It is an inventory-position estimate, not a guarantee that Steam has returned every description.
- If Steam's pagination label cannot be parsed, discovery will not use the threshold to stop early; it will continue until the final page or another failure condition.
- Live Brave/Steam traversal has not been verified; automated tests validate the implemented logic only.

## 1.5.6 — R2 Hotfix 7

- Improved Card Shelf panel control guidance with tooltips for inventory, discovery, refresh, delay, batch size, and recovery actions.
- Added a discovery progress bar against the minimum expected inventory size, with the denominator explicitly labelled `(min)` in progress text.
- Progress counts loaded inventory assets rather than quantities aggregated by card design.
- Added a persistent, bounded activity log for design discoveries, pauses, exports, and resets.
- Added JSON export of the local known-design catalogue, excluding market-price history.
- Added a confirmed reset of the discovery cursor; it preserves the design catalogue, inventory snapshots, and price cache.
- Kept inventory discovery, full inventory scanning, and market-price caching as separate operations.
- Existing stop behaviour preserves discoveries and the resume position; clicking discovery again resumes from the saved page.

# Site Works 1.5.7 — R2 Hotfix 8: Verified asynchronous inventory-page discovery

## Scope
Hotfix 8 replaces the unreliable page-inspection logic introduced in Hotfix 6 and carried into Hotfix 7. Hotfix 6 and Hotfix 7 should not be used as the testing baseline; install this package instead.

## Changes
- Replaces the fixed-delay/first-tile-change assumption with a page snapshot process based on the currently visible Steam inventory tiles.
- Waits until every rendered tile has a usable `market_hash_name` description and the complete page snapshot remains unchanged across multiple observations for at least 1.5 seconds (with a 30-second validation timeout).
- Does not record a zero-new-design result, increment completed-item progress, or update the design catalogue when a page is incomplete or unstable.
- Builds the page's unique design set from the verified page snapshot, rather than reading the entire `g_ActiveInventory.m_rgAssets` collection as if it represented the current page.
- Counts processed inventory instances by unique `appid:contextid:assetid` keys, preventing duplicate observations from inflating progress across resumable runs.
- Persists verified discoveries and the processed asset-ID set only after a page passes validation; a failed page remains the next resume position.
- Preserves the minimum expected inventory denominator `25 × total pages − 24`, labelled `(min)`.
- Updates the manual **Test inventory loading** probe to use the same stable-page validation instead of merely checking whether any descriptions exist globally.
- Retains the 4-second minimum navigation interval, independent inventory/market-price cooldown state, catalogue export, activity log, tooltips and other Hotfix 7 interface additions.

## Safety and interpretation
- A page timeout or incomplete description set is reported as **INCOMPLETE**, never as zero new designs.
- Stable DOM content is a client-side completion heuristic; it cannot prove Steam has finished all server-side work or reveal Valve's internal throttling state.
- The 30-second timeout is a stop condition, not an automatic retry. The current page remains resumable and no market-price requests are made.
- The `(min)` figure is an expected lower bound, not a confirmed total. The final page can contain up to 25 items.

## Validation
- Automated tests: 55 passed, 0 failed.
- JavaScript syntax checks: 22 files passed.
- ZIP integrity checked.
- Live Brave/Steam traversal has not yet been tested. This release is intended for controlled validation of the asynchronous loading correction; automated tests do not substitute for that live test.
\n\n### R2 Hotfix 8 stop/resume correction\n- Stop is honoured at a verified page boundary. If that page was committed, resume starts on the following page; if navigation had begun but the page was not committed, resume remains on that page.\n- Stop summary reports the number of verified pages, designs saved in this run, and the exact resume page.\n

## 1.5.8 — R2 Hotfix 8 final refinement
- Keeps the explicit design-discovery catalogue separate from names known only through the price cache or a full inventory scan.
- Adds separate Card Shelf reporting for saved design catalogue, cached price entries, and the currently displayed inventory scope.
- Labels estimated value as current-page or full-inventory value according to the actual saved inventory coverage.
- Clarifies that design counts and item-instance counts refer to different things.
- Persists the last discovery run's verified page count, new designs, processed unique items and resume page.
- Retains the asynchronous stable-page validation, incomplete-page handling, independent cooldowns, progress, export, activity log and safe Stop/resume behaviour.


## 1.5.9 — R2 Hotfix 9
- Makes discovery Stop interruptible during page-change waits, inventory-stability polling and inter-page delays.
- Prevents new page navigation after Stop is requested; preserves the verified page boundary or pending destination as the resume cursor.
- Adds explicit collection/price, inventory discovery, and price-refresh section labels.
- Adds numerical processed/minimum progress text and a persistent last-session summary.
- Retains Hotfix 8's stable snapshot validation, separate catalogue/cache/inventory accounting, exports, activity log, cooldowns and price-history protections.


## 1.6.0 — R2 Hotfix 10
- Builds the Card Shelf priceable-design list from the union of the saved discovery catalogue, current/complete inventory holdings and cached price entries.
- Discovered designs with known appid and marketable metadata can be selected for market-price refresh even when not on the currently visible Steam page.
- Shows unknown quantity as an em dash rather than zero or an invented count.
- Keeps inventory snapshots and valuation based only on actual holdings, never the expanded catalogue list.
- Labels discovered-only and price-cache-only entries separately; selecting a catalogue-only row does not attempt to open a nonexistent inventory asset.
- Preserves Hotfix 9's responsive discovery Stop, stable-page validation, resumable cursor, separate cooldowns and redesigned panel.


## 1.6.1 — R2 Hotfix 11
- Fixes price-refresh click handling: the inventory scan and price action previously shared the generic `.go` selector, causing the first matching control (Scan all inventory pages) to receive the price handler while the price button received none.
- Renames the price action to **Get prices** and gives it a dedicated `.pricego` selector.
- Separates the UI into a Design Catalogue & Inventory Discovery panel and a Market Prices & Price Refresh panel.
- Moves price-cache statistics, priceable/missing counts, progress and recovery controls into the market-prices panel.
- Adds live price-batch progress and a Stop state on the Get prices button.


# Site Works 1.6.2 — R2 Hotfix 12

- 🏷️ Displays the exact installed extension version and R2 hotfix number in the Site Works popup.
- 🔗 Identifies the build lineage explicitly: 1.6.2 / R2 Hotfix 12 is built on 1.6.1 / R2 Hotfix 11.
- 📜 Adds a popup button that opens the cumulative release-note log.
- 🧭 Establishes release-log maintenance rules: keep entries cumulative, use emoji-led lists, state exact versions and hotfix numbers, and distinguish automated validation from live Steam/browser testing.
- 🧪 Validation is recorded separately from live testing; no live Steam operation is claimed for this build.


# Site Works 1.6.3 — R2 Hotfix 13

- 📋 Gives the design/item/price table a dedicated scrollable area so the rows remain visible below the catalogue and price controls.
- 📚 Displays one row per unique design and distinguishes design count from individual item quantity; unknown quantities remain unknown.
- 💷 Allows discovered catalogue designs to be price-lookup candidates using Steam Community app ID 753 when older catalogue records lack marketability metadata. Steam's read-only price response determines whether a listing exists.
- 📊 Replaces ambiguous user-facing “cards” wording with “designs” for unique market_hash_name entries and “items” for individual inventory instances.
- 🏷️ Updates the popup build identity to 1.6.3 / R2 Hotfix 13, based on 1.6.2 / R2 Hotfix 12.


# Site Works 1.6.4 — R2 Hotfix 14

- 🗂️ Splits the Card Shelf into three dedicated tabs: Design capture, Price capture and Inventory list.
- 🔎 Keeps inventory-page discovery, stable loading checks, scan progress, stop/resume, export and activity log in Design capture.
- 💷 Keeps price-cache statistics, request scope, batch limit, delay, Get prices, price progress and recovery controls in Price capture.
- 📦 Gives the inventory design/item table its own full-height scrollable tab, with design search and price-age filtering.
- 📊 Adds an inventory summary distinguishing unique designs, known individual item counts and designs whose quantities remain unknown.
- 🏷️ Updates the popup build identity to Site Works 1.6.4 · R2 Hotfix 14, explicitly built on 1.6.3 · R2 Hotfix 13.
- 🧪 Automated tests and syntax checks are recorded separately from live Steam/browser acceptance testing.

# Site Works 1.6.5 — R2 Hotfix 15

- 🧭 Reworked the Card Shelf header into a dedicated title/action row, with the three navigation tabs on a separate line below it.
- 🔘 Moved import, reload and close controls into a stable action group so they no longer overlap or obscure the tabs.
- 📚 Reset the saved price-age filter to **All price ages** on upgrade. This corrects the HF14 situation where a persisted **No price** filter hid all 529 cached designs from the visible list.
- 📊 The header count now reports total listed designs, designs with cached prices and designs without prices.
- 💷 Price controls remain grouped above price-related progress/statistics; the inventory list retains its own full-height scroll area.
- 🏷️ Popup build identity: Site Works 1.6.5 · R2 Hotfix 15, built on 1.6.4 · R2 Hotfix 14.
- 🧪 Automated checks do not replace live Steam/Brave acceptance testing.

# Site Works 1.6.6 — R2 Hotfix 16

- 🔄 Merged inventory-wide design discovery and holdings scanning into one combined scan workflow.
- 📄 Added **Load current page data**: reads the already-rendered Steam page without clicking Previous/Next.
- 💷 Both current-page loading and the combined all-pages scan save newly observed designs and item quantities, then attempt eligible market-price lookups for those page designs.
- 🧭 Removed the redundant **Look for new designs** and **Test inventory loading** actions; the remaining all-pages scan is explicitly labelled **Scan all pages (designs + prices)**.
- 🛑 Stop interrupts the current price queue and prevents further page navigation; committed page data and the discovery resume position are preserved.
- 🧱 Design capture and price capture retain independent cooldown/error handling. A price block does not erase committed design discoveries; an inventory-page validation failure is not interpreted as zero new designs.
- 🏷️ Popup identity: Site Works 1.6.6 · R2 Hotfix 16, built on 1.6.5 · R2 Hotfix 15.
- 🧪 Automated checks are not a substitute for live Steam/Brave testing.

# Site Works 1.6.7 — R2 Hotfix 17

- 🧠 Makes Steam's cumulative in-memory inventory cache the preferred source for inventory discovery and holdings.
- 🔄 Uses Steam's own `LoadMoreAssets()` method when the active inventory exposes the expected runtime capabilities; Steam remains responsible for request size, continuation, delay, response merging and native error handling.
- 📦 Adds a cache-only **Load cached inventory data** action that reads the already-loaded cache without initiating requests or navigating pages.
- 🧮 Separates asset entries, unique designs, description records and aggregated item quantities; stack amounts are included in holdings.
- 🧭 Uses Steam's `m_bFullyLoaded` flag plus final description validation before publishing a complete inventory snapshot. Partial results remain explicitly incomplete.
- 🛑 Stop does not attempt to cancel Steam's private request; it waits for the current operation to settle, then prevents another batch and preserves partial data.
- 🧩 Detects required capabilities at runtime rather than relying on a Steam version string. Retains the verified DOM-page scanner as a compatibility fallback when the native loader surface is unavailable.
- 🛡️ Keeps inventory loading and market-price throttling independent; inventory errors stop the scan without automatic retries.
- 📚 Adds `docs/STEAM_INVENTORY_CACHE_INTEGRATION.md`, documenting the investigation, observed Steam source behaviour, cache semantics, assumptions, dependencies, diagnostics and a future website-update maintenance procedure.
- 🏷️ Popup identity: Site Works 1.6.7 · R2 Hotfix 17, built on 1.6.6 · R2 Hotfix 16.
- 🧪 Automated tests and syntax checks are recorded separately from live Steam/Brave acceptance testing. Native-cache scanning still requires controlled live validation.


# Site Works 1.6.8 — R2 Hotfix 18

- 🏷️ Establishes **webdata** for Steam's in-memory webpage data and **filedata** for Site Works' saved, reconciled inventory. The ambiguous inventory term is removed from user-facing acquisition language.
- 🔄 Replaces the two inventory acquisition actions with one **Synchronise inventory** operation. It captures the currently available webdata first, then streams further batches through Steam's native loader where supported.
- 🧾 Adds an append-only, versioned IndexedDB webdata journal. It records changed/new serialisable asset and description fields per observed batch, without attempting to serialise Steam's live controller object.
- 🧱 Consolidates saved designs and inventory holdings into one versioned `siteworksFiledata_v1` record. Existing design-catalogue and full-inventory records are migrated on first read; saved market prices remain separate enrichment data.
- 🔁 Adds `S.rebuildFiledataFromWebdataJournal()` to rebuild the application-facing filedata projection from the captured webdata journal.
- 🧭 Price capture reads the shared design set and performs market-price requests only. Inventory list is a read-only view; neither tab starts inventory acquisition.
- 📚 Replaces the previous Steam cache handover with `docs/WEBDATA_FILEDATA_ARCHITECTURE.md`, including the observed Steam dependencies, completeness rules, storage design, recovery approach and future website-update maintenance procedure.
- 🧪 Automated checks do not replace live Brave/Steam validation. IndexedDB persistence, full native streaming, stop/recovery and price-tab integration require live acceptance testing.
- 🏷️ Popup identity: Site Works 1.6.8 · R2 Hotfix 18, built on 1.6.7 · R2 Hotfix 17.

# Site Works 1.6.9 — R2 Hotfix 19

- 🧭 Corrects the market-price eligibility filter: numeric Steam app IDs are now recognised correctly. This fixes the false `0 eligible designs` / `0 saved prices` display when eligible designs and saved price records already exist.
- 💷 Renames the operation to **Enrich prices** and explains that market prices come from Steam's separate market endpoint; they are not present in inventory webdata.
- 🧩 Removes the manual **Test Steam recovery** probe. A market-price cooldown remains endpoint-specific; when it expires, a user-started enrichment batch can resume without a separate probe.
- 🛡️ Clarifies that a market-price throttle does not block reading, rebuilding or viewing already acquired webdata/filedata.
- 🗃️ Projects saved prices and price history into the shared `siteworksFiledata_v1` record while retaining the legacy price store for backward compatibility and migration.
- 📊 Uses consistent terminology for saved prices, missing price data and market-price endpoint status. A missing price is not interpreted as proof that an item is unmarketable or has no listing.
- 📚 Updates the webdata/filedata architecture handover with the market-price boundary, shared price projection and future maintenance guidance.
- 🏷️ Popup/manifest identity: Site Works 1.6.9 · R2 Hotfix 19, built on 1.6.8 · R2 Hotfix 18.
- 🧪 Automated checks are not a substitute for live Brave/Steam acceptance testing. Live verification of price eligibility, legacy price migration and throttle behaviour remains outstanding.
