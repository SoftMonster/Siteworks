SITE WORKS - your own scripts on websites, picked by folder
============================================================

INSTALL (once)
  1. Unzip this folder somewhere it can stay (e.g. Documents\SiteWorks).
  2. In Brave go to brave://extensions, turn on Developer mode, click
     "Load unpacked" and choose the SiteWorks folder.
     (If you installed Steam Works before, remove it: Site Works replaces it.)

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
  decision for this website (every new script, and every script on a website it
  hasn't been allowed on) opens the Site Works request window:
    ALLOW  - run this time        REJECT - do not run this time
    Do not ask again              - remember it for this script on this website
                                    (Always allow / Always block)
  Closing the window counts as Reject for this page. The request window is the
  extension's own window: the website can't see it, click it or fake it.
  A request for a tab in the background waits (badge "?") until you switch to it,
  or click the toolbar button and "Review waiting request".

  Decisions are stored against the website's host AND the script path. "Always
  allow" is also tied to the script's contents (SHA-256): if you edit the file,
  or something else does, Site Works asks again before running it. "Always
  block" stays blocked whatever the file contains.

  A new page asks again for anything not remembered. "Run this time" covers only
  the page you allowed it on.

MANAGE PAGE (toolbar button > Manage permissions & log, or the extension's Options)
  - Remembered decisions: website, script, allow/block, when, and whether the
    file has changed since. Revoke, or switch allow/block.
  - Scripts in your sites folder and where each is allowed or blocked.
  - Log: every run, block, rejection, failure and decision, with time, website
    and URL (last 1000 kept). Filter or clear it.

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

ADDING, RENAMING OR REMOVING A SCRIPT (or editing a hosts.txt)
  1. Put the .js file in the right folder (make folders as needed).
  2. Double-click "Rebuild index.cmd". (Browsers don't let an extension list
     its own folders, so it reads the list from sites\index.json.)
  3. Reload the page and allow it in the request window. No need to reload
     the extension.
  Editing a script that's already listed needs only step 3 (an edited script
  asks again even if you'd chosen "Always allow").

UPGRADING FROM 1.1
  Replace the files in your SiteWorks folder with these (keep your sites
  folder), then click the reload arrow on Site Works in brave://extensions.
  Your scripts will ask once on each website; tick "Do not ask again".

TOOLBAR BUTTON - THE RUNNING INDICATOR
  Badge, per tab:  2   two scripts are running on this page (hover for names)
                   ?   scripts are waiting for your permission
                   off matching scripts were rejected or blocked
                   ERR a script could not be injected (see Manage > Log)
  Click it to see which site folder matches, each script's state on this page,
  its remembered decision, and every script listed.

PERMISSIONS AND LIMITS
  Brave will say the extension can "read and change all your data on all
  websites": it needs that to run your scripts on whatever sites you add
  folders for. It only ever runs the scripts in your sites folder, and only
  after you allow them.
  The gate is a consent check, not a sandbox. It protects you from scripts
  running that you didn't approve - including new files and edited ones - but
  an allowed script has full access to the page it runs on, and anything that
  can change the Site Works extension files themselves could also change the
  gate. Keep the folder somewhere only you write to.

INCLUDED
  sites\Steamworks\hosts.txt
  sites\Steamworks\inventory\steam-inventory-prices.js - the Card Shelf prices
  button (cached prices, sortable list, Refresh) and the green
  "Quick sell over 14p" button, on any Steam inventory page.
