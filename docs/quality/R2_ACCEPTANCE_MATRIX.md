# R2 Acceptance Matrix — 1.6.9 / R2 HF20 (FIX18 baseline)

## Status legend

- **PASS-OFFLINE:** covered by automated tests executed during this handover preparation.
- **SOURCE-OBSERVED:** implementation/architecture present in supplied source.
- **LIVE-REQUIRED:** requires a real Brave/Steam session.
- **NOT-PROVEN:** design assertion or risk without sufficient execution evidence.

| ID | Requirement / expected behaviour | Source / test evidence | Current status | Required acceptance evidence |
|---|---|---|---|---|
| R2-01 | Inventory acquisition is initiated from one Design capture synchronisation action; price/list tabs do not start scans | `steam-inventory-prices.js`; R2.8 tests | PASS-OFFLINE | Live UI test confirms only one acquisition control |
| R2-02 | Steam native loader used when required capabilities exist | inventory script; R2.8 tests | SOURCE-OBSERVED + PASS-OFFLINE | Live Steam run records loader capability and successful next batch |
| R2-03 | Completion only when Steam marks fully loaded and non-currency assets resolve | architecture; R2.8 tests | SOURCE-OBSERVED + PASS-OFFLINE | Live complete inventory cross-check against Steam |
| R2-04 | Webdata journal records serialisable deltas and filedata is reconciled | architecture; R2.8 tests | SOURCE-OBSERVED + PASS-OFFLINE | Inspect persisted journal and filedata after a multi-batch scan |
| R2-05 | Partial/unknown data remains visibly partial; unknown quantity is not zero | R2.8 tests | PASS-OFFLINE | Live partial-stop and missing-description UI tests |
| R2-06 | Design discovery uses stable complete page snapshots, resumes safely and reports progress | R2.7/R2.8 tests | PASS-OFFLINE | Live multi-page discovery, Stop, reload and resume |
| R2-07 | Price enrichment is separate from inventory; numeric app IDs accepted; cooldown isolated | R2 regression tests in `r2.9.test.cjs` | PASS-OFFLINE | Live small-batch market-price test; confirm no inventory coupling |
| R2-08 | HTTP 429 / access blocks stop price requests and respect cooldown; no probe retry | `r2.2.test.cjs`; R2 regression test | PASS-OFFLINE | Controlled live response handling where safe; do not intentionally hammer Steam |
| R2-09 | Saved price data projects into shared filedata while legacy records remain readable | R2 regression test and architecture | SOURCE-OBSERVED + PASS-OFFLINE | Test with a copy of representative legacy data and verify merge/freshness |
| R2-10 | Search/sort/filter/list operations are read-only and do not start inventory acquisition | architecture and R2.8 tests | PASS-OFFLINE | Live UI interaction test while observing network requests |

## Offline evidence executed during this handover preparation

- FIX18 history records: `npm run verify` PASS on Node.js v22.16.0 / Linux; 87 tests passed, 39 JavaScript files syntax-checked, 125 release-manifest files verified, governance checker and negative cases passed.
- The result above is a recorded result from the FIX18 engineering step, not a fresh execution during this TODO consolidation.
- These offline results do not prove live Brave/Steam behaviour or Windows PowerShell 5.1 helper behaviour.

## Release acceptance decision

**R2 is not accepted as fully complete by this handover.** The offline suite passes, but live Brave/Steam acceptance and persistence/recovery failure testing remain required. A release manager should record the exact browser version, OS, Steam page, inventory size, time, test operator and evidence for each live test.

## Minimum live acceptance script

1. Install the unpacked HF19 build in a clean Brave profile.
2. Open a Steam inventory with a known app/context.
3. Confirm Design capture shows the synchronisation operation.
4. Start sync; record initial asset/description counts and progress.
5. Allow at least two native loader batches to complete.
6. Confirm journal batches append and filedata holdings reconcile.
7. Stop during a later batch; confirm partial status and safe resume.
8. Reload and inspect recovered state.
9. Resume and allow Steam `m_bFullyLoaded` to become true.
10. Verify all non-currency assets resolve to designs.
11. Confirm inventory list and filters do not initiate acquisition.
12. Run a small price-enrichment batch separately.
13. Confirm market cooldown does not prevent inventory viewing/reconstruction.
14. Save console output, screenshots, journal metadata and test outcome.


## Current backlog pointer

Live acceptance is coordinated through [`../PROJECT_TODO.md`](../PROJECT_TODO.md), TODO-003 through TODO-008. This matrix remains the case-by-case acceptance record. Update each row only when the required evidence is actually captured.
