SITE WORKS 1.3 - your own scripts on websites, picked by folder
================================================================

INSTALL (once)
  1. Unzip this folder somewhere it can stay (e.g. Documents\SiteWorks).
  2. In Brave go to brave://extensions, turn on Developer mode, click
     "Load unpacked" and choose the SiteWorks folder.
  3. Double-click "Install file helper.cmd" (optional, but it's what lets
     Site Works save scripts and rebuild the index for you - see FILE HELPER).

UPGRADING FROM 1.2
  1.3 gives Site Works a fixed extension ID (the "key" in manifest.json) so the
  file helper can trust it. Brave sees that as a new extension, so:
    - remove the old Site Works in brave://extensions, then Load unpacked again;
    - your remembered decisions and log start empty: each script asks once more.
  From now on use Manage > Export decisions to keep a backup.

THE FOLDERS
  sites\<Site>\<A>\<B>\...\yourscript.js

  Level 1 - the website
    sites\Steamworks\   the hosts listed in sites\Steamworks\hosts.txt
                        (steamcommunity.com, steampowered.com - subdomains such
                        as store.steampowered.com are included).
    sites\Google\       no hosts.txt, so it matches any host with "google" as
                        one of its parts: www.google.com, mail.google.co.uk ...
    sites\github.com\   a name with a dot is that host (and its subdomains).
    Add a hosts.txt (one host per line, # for comments) to any site folder
    to say exactly which hosts it covers.

  Level 2 and down - the URL path
    A script in sites\<Site>\A\B\C\ runs when the URL's path contains A, then
    B, then C, in that order (other parts may sit between them). Case doesn't
    matter. Go as deep as you like.

  Example: https://steamcommunity.com/id/SoftMonster/inventory/#753_6
    sites\*.js                             runs (every page of every website)
    sites\Steamworks\*.js                  runs (every Steam page)
    sites\Steamworks\inventory\*.js        runs
    sites\Steamworks\id\inventory\*.js     runs (id ... inventory, in order)
    sites\Steamworks\inventory\id\*.js     no   (wrong order)
    sites\Google\...                       no   (different website)

  A level-2 folder named after a host the site covers narrows to that host:
    sites\Steamworks\store.steampowered.com\app\*.js   Steam Store game pages only
  Any other level-2 name, even one with a dot (index.html), is a normal path part.

  Shallower folders run first; within a folder, files run in name order.

PERMISSION GATE - NOTHING RUNS UNTIL YOU ALLOW IT
  Every matching script is checked immediately before it runs. A script with no
  decision opens the Site Works request window:
    ALLOW  - run this time        REJECT - do not run this time
    Do not ask again  [on this website only | on every website]
  Closing the window counts as Reject for this page. The request window is the
  extension's own window: the website can't see it, click it or fake it.
  A request for a tab in the background waits (badge "?") until you switch to it,
  or click the toolbar button and "Review waiting request".

  Decisions are stored against the script AND the website - or every website,
  which suits scripts directly in sites\ such as the toolbox. A decision for one
  website beats an every-website one, so you can allow everywhere and still
  block one site. "Always allow" is also tied to the script's contents
  (SHA-256): if the file changes, Site Works asks again - unless you saved the
  change in the Site Works editor with "Keep my always-allow decisions" ticked.

TURNING IT OFF, PAUSING, RESETTING
  - Off everywhere: the switch in the toolbar popup or on the Manage page, or
    right-click > Site Works > Site Works on. Nothing new runs anywhere.
  - Pause on one website: popup > Pause on this site, Alt+Shift+P, or
    right-click > Site Works > Pause. Badge shows II. Resume the same way, or
    from the list on the Manage page.
  - Scripts already running in a page keep running until it reloads.
  - Reset "Do not ask again": popup > "forget" next to a script, or "Forget this
    site's decisions"; Manage > Revoke (one), Forget (one script everywhere) or
    Forget all decisions.

SHORTCUTS (change them in brave://extensions/shortcuts)
  Alt+Shift+K  open the toolbox on this page
  Alt+Shift+P  pause / resume Site Works on this website
  Alt+Shift+W  open the Site Works toolbar menu
  (no key yet) turn Site Works on/off everywhere; new script for this page

RIGHT-CLICK MENU (on any website)
  Open toolbox · Copy link as Markdown · Copy page as Markdown link ·
  New script for this page · Pause on this website · Site Works on (tick) ·
  Manage permissions, scripts & log

NEW SCRIPTS ON THE FLY - THE EDITOR
  Popup > "New script for this page" (or right-click > New script...). The
  editor lists the page's path parts as chips: click the ones the URL must
  contain, pick the site folder (or a new one, with an optional hosts.txt),
  name the file and write the code. It shows the exact sites\... path and
  whether that will match the page you came from. Save writes the file and
  rebuilds the index; "Save & reload page" also reloads the tab, where Site
  Works asks for permission as usual. Ctrl+S saves.
  To change a script: popup > "edit" next to it, or Manage > Edit. "Text editor"
  opens it in VS Code if you have it, otherwise Notepad (never the Windows .js
  handler, which would run it). Trash moves it to SiteWorks\trash.
  Without the file helper the editor still works: Copy code or Download .js,
  put the file where it shows, then double-click "Rebuild index.cmd".

COPY FILES TO THE CLIPBOARD
  Popup > "Copy files to clipboard" (or Manage > Copy files). Tick any of your
  scripts and hosts.txt files, and/or add or drop files from your computer, then
  Copy them as one block: Markdown code blocks, // ===== headers, contents only,
  or just the paths. Shows characters, lines and a rough token count. One image
  on its own can be copied as an image.

THE TOOLBOX (sites\00-toolbox.js - every website)
  Alt+Shift+K or right-click > Open toolbox. Type to filter, Enter to run.
    Reload every...            auto-reload this tab (Vivaldi / Opera have this)
    Unblock copy, right-click & text selection        (remembered per site)
    Dark mode for this site                            (remembered per site)
    Video speed... 0.25x-16x, kept between videos      (remembered per site)
    Picture-in-picture for the biggest video
    Copy page as Markdown link · Copy clean address (no utm_/fbclid...)
    Copy selected text as plain text · Copy all links on this page
    Copy a table for Excel / Sheets · Download a table as CSV
    Word count · Remove sticky headers & overlays · Show / hide passwords
    Edit page text · Forget this site's toolbox settings
  The first time, choose "Do not ask again ... on every website". It's an
  ordinary script: edit it like any other, or delete it if you don't want it.
  It only changes the page you're on; it can't reach Site Works' controls.

FILE HELPER (Install file helper.cmd)
  Browsers don't let an extension write into its own folder, so Site Works
  comes with a small PowerShell helper that the browser starts when you press
  Save / Rebuild index / Trash / Open in text editor / Show in folder. It is
  registered for your Windows user only (Brave, Chrome, Chromium and Edge),
  and only this extension's ID may start it. It can only write .js files and
  hosts.txt inside sites\, move scripts to SiteWorks\trash, rebuild
  sites\index.json and open a script in a text editor. It never runs scripts.
  Manage shows whether it's Connected. Run "Install file helper.cmd" again if
  you move the SiteWorks folder; "Uninstall file helper.cmd" removes it.

ADDING SCRIPTS BY HAND (or editing hosts.txt)
  1. Put the .js file in the right folder (make folders as needed).
  2. Rebuild the index: popup > Rebuild index (with the helper), or
     double-click "Rebuild index.cmd". Browsers don't let an extension list its
     own folders, so the list comes from sites\index.json.
  3. Reload the page and allow it in the request window.
  Editing a script that's already listed needs only step 3.

RUNS ONCE PER PAGE
  Each script runs at most once per page load, so its buttons are never added
  twice. When a site changes the URL without loading a new page (#hash or
  history changes), newly matching scripts are checked (and asked about) and
  those already handled are left alone. If injecting a script fails, it is
  tried again on the next URL change. Reloading the page starts afresh.
  Scripts run inside the page itself, as if pasted into the Console, so they
  can use the page's own variables (Steam's g_ActiveInventory and so on). Site
  Works keeps its own record of what ran in a separate, private space in the
  page that the website's scripts can't read or change.

TOOLBAR BUTTON - THE RUNNING INDICATOR
  Badge, per tab:  2   two scripts are running on this page (hover for names)
                   ?   scripts are waiting for your permission
                   off matching scripts were rejected or blocked
                   ERR a script could not be injected (see Manage > Log)
                   II  Site Works is paused on this website
                   OFF Site Works is turned off everywhere

MANAGE PAGE (popup > Manage & log, or the extension's Options)
  On/off switch and paused websites · file helper status, Rebuild index, Open
  sites folder · remembered decisions (revoke, switch, export, import) · your
  scripts (edit, text editor, forget, trash) · the log of every run, block,
  rejection, failure and decision (last 1000 kept).

PERMISSIONS AND LIMITS
  Brave will say the extension can "read and change all your data on all
  websites" and "communicate with cooperating native applications" (the file
  helper). It only ever runs the scripts in your sites folder, and only after
  you allow them.
  Site Works' controls - the switch, decisions, the editor and the helper - are
  only reachable from its own pages, menus and shortcuts. No website, and no
  script running in a website, can use them: otherwise a page could write
  itself a script and allow it.
  The gate is a consent check, not a sandbox. An allowed script has full access
  to the page it runs on, and anything that can change the SiteWorks folder
  could also change the gate. Keep the folder somewhere only you write to.

INCLUDED
  sites\00-toolbox.js - the toolbox (every website).
  sites\Steamworks\hosts.txt
  sites\Steamworks\inventory\steam-inventory-prices.js - the Card Shelf prices
  button (cached prices, sortable list, Refresh) and the green
  "Quick sell over 14p" button, on any Steam inventory page.
