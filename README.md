# Site Works

**Release 1.6.9 (R2 Hotfix 20)** — Steam inventory tooling on top of the R1 reliability and configuration base.

> New here? Start with [`docs/README.md`](docs/README.md) for the documentation map and current project status.

A Brave/Chromium extension that runs your own scripts on websites, picked by folder —
`sites\Steamworks\inventory\*.js` runs on Steam pages whose path contains `inventory` —
and only after you allow each script on each website.

- **Permission gate:** default-deny; allow or reject once, or remember per website or for every website. "Always allow" is tied to the file's SHA-256.
- **Controls everywhere:** on/off switch, pause per website, reset decisions — from the toolbar, the right-click menu and shortcuts (`Alt+Shift+K` toolbox, `Alt+Shift+P` pause).
- **Script editor:** new scripts for the page you're on, with a live "will this match?" check; saves straight into `sites\` and rebuilds the index through the optional file helper.
- **Copy files:** pick scripts and local files and copy them as one Markdown/text block.
- **Toolbox** (`sites\00-toolbox.js`): reload every…, unblock copy/right-click, dark mode, video speed, picture-in-picture, copy tables/links/Markdown, remove sticky overlays, and more.
- **Manage page:** decisions (revoke, export, import), scripts, helper status, shared configuration and a full log.
- **Shared configuration:** centrally stored market preferences, request pacing, per-run listing cap and notification preferences; safety confirmations are mandatory.
- **Shared page services:** common Steam fee arithmetic and accessible notifications are made available to Site Works-managed scripts.
- **Trading safeguards:** quick-sell requires confirmation, is capped per run, observes a minimum 4-second request interval and stops without retry after HTTP 429. Bulk listing removal no longer auto-confirms Steam dialogs.

See **README.txt** for install steps, folder rules and details. The authoritative prioritised work queue is [`docs/PROJECT_TODO.md`](docs/PROJECT_TODO.md).

| File | What it is |
| --- | --- |
| `background.js` | The gate, switch, menus and shortcuts |
| `match.js` | Folder → URL matching, shared by the worker and the pages |
| `prompt.*` | The request window |
| `popup.*`, `manage.*`, `editor.*`, `clip.*`, `ui.*` | The extension's own pages |
| `helper\` | The PowerShell file helper (native messaging host) and its installer |
| `build-index.ps1`, `Rebuild index.cmd` | Rebuild `sites\index.json` by hand |
| `sites\` | Your scripts |
| `scripts\` | Dev tooling: syntax check, release-notes generator, checksum manifest |
| `tests\` | Offline test suite (`npm test`) |
| `docs\` | Handover pack: architecture, operations, quality, roadmap |

## Development checks

Requires Node.js 18 or later. `npm run verify` runs the syntax check, the full test suite (matching, configuration, fee arithmetic, safety regressions, version consistency and project-governance checks), the release checksum check and the project governance checker. See [`docs/engineering/ENGINEERING_STANDARD.md`](docs/engineering/ENGINEERING_STANDARD.md) for the mandatory AI-assisted engineering workflow and project invariants. After changing `RELEASE_NOTES.md` run `npm run release-notes`; after changing any shipped file run `npm run manifest`. These checks do not replace a Brave/Chromium smoke test or a Windows PowerShell/native-messaging test.


## Project documentation

The documentation index is [`docs/README.md`](docs/README.md). The active backlog is
[`docs/PROJECT_TODO.md`](docs/PROJECT_TODO.md). The stable launcher instructions and
current launcher status are in [`docs/operations/ANDREW_NEXT_TASK.md`](docs/operations/ANDREW_NEXT_TASK.md).
