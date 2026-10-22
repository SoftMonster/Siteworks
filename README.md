# Site Works

A Brave/Chromium extension that runs your own scripts on websites, picked by folder —
`sites\Steamworks\inventory\*.js` runs on Steam pages whose path contains `inventory` —
and only after you allow each script on each website.

- **Permission gate:** default-deny; allow or reject once, or remember per website or for every website. "Always allow" is tied to the file's SHA-256.
- **Controls everywhere:** on/off switch, pause per website, reset decisions — from the toolbar, the right-click menu and shortcuts (`Alt+Shift+K` toolbox, `Alt+Shift+P` pause).
- **Script editor:** new scripts for the page you're on, with a live "will this match?" check; saves straight into `sites\` and rebuilds the index through the optional file helper.
- **Copy files:** pick scripts and local files and copy them as one Markdown/text block.
- **Toolbox** (`sites\00-toolbox.js`): reload every…, unblock copy/right-click, dark mode, video speed, picture-in-picture, copy tables/links/Markdown, remove sticky overlays, and more.
- **Manage page:** decisions (revoke, export, import), scripts, helper status and a full log.

See **README.txt** for install steps, folder rules and details.

| File | What it is |
| --- | --- |
| `background.js` | The gate, switch, menus and shortcuts |
| `match.js` | Folder → URL matching, shared by the worker and the pages |
| `prompt.*` | The request window |
| `popup.*`, `manage.*`, `editor.*`, `clip.*`, `ui.*` | The extension's own pages |
| `helper\` | The PowerShell file helper (native messaging host) and its installer |
| `build-index.ps1`, `Rebuild index.cmd` | Rebuild `sites\index.json` by hand |
| `sites\` | Your scripts |
