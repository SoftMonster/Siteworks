# Step 006 — One-paste feedback handover

- Trigger: Andrew's pasted screenshot showed only the Robocopy progress window; the previous launcher did not provide one coherent clipboard handover containing both useful text and screenshot context.
- Finding: FIX10 captured milestone PNGs and created a feedback ZIP, but its final clipboard operation used `Clipboard.SetImage`, replacing text clipboard content. The screenshot alone also did not communicate the transcript or feedback ZIP location.
- Change: launcher now captures immediately before and after the `REPLACE` confirmation pause; creates a composite evidence board containing a log excerpt and screenshot thumbnails; bundles the full transcript, original full-resolution screenshot series and evidence board into a feedback ZIP; then places both image and text formats into one Windows clipboard DataObject and verifies both formats.
- Andrew's action: extract FIX11, run the same launcher, and paste once with Ctrl+V at the end. Retain the generated feedback ZIP path shown by the launcher.
- Acceptance: Windows runtime test must demonstrate that the clipboard retains both image and text formats and that the feedback ZIP contains the transcript and screenshot series.
- Status: implemented and package-checked; real Windows execution pending.


CURRENT STATUS — FIX28 WINDOWS ACCEPTANCE
  FIX27 and FIX28 are two consecutive successful Windows PowerShell 5.1 runs.
  Deployment, deployed npm run verify, manifest/governance checks and exact
  plain-text clipboard hand-off passed. TODO-001 launcher/feedback-loop
  acceptance is DONE. The Site Works application is not yet accepted.

NEXT TASK — TODO-003 BRAVE/CHROMIUM SMOKE TEST
  Use a clean/test browser profile. Load the unpacked extension and verify
  build identity, extension errors, popup, Manage, pause/on-off, context menu,
  keyboard shortcuts, approval/rejection, remembered approval scope and
  changed-script-hash reapproval. Record browser/version, each result and
  relevant screenshots. Do not use the production profile as the only test.
  Node.js v26.13.1 and npm 11.20.0 are already available; do not reinstall.

LIVE ACCEPTANCE REMAINS PENDING
  TODO-004 native helper; TODO-005/006 Steam inventory and price workflows;
  TODO-007 storage recovery. R2 release remains blocked until TODO-008.
