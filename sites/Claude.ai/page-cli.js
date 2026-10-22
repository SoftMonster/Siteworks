/*
 * Page Command Prompt — a pop-out, Windows-cmd-style command line for the current webpage.
 *
 * Usage:
 *   - Paste into the browser DevTools console and press Enter, or
 *   - Save as a bookmarklet (prefix with "javascript:" and minify), or
 *   - Include it with a <script> tag on your own site.
 *
 * Ctrl+` (or Ctrl+Shift+K) shows/hides the window. Type HELP for commands.
 */
(() => {
  'use strict';

  if (window.__pageCLI) { window.__pageCLI.toggle(); return; }

  const VERSION = '1.0.2026';

  // Classic console 16-colour palette (used by COLOR).
  const PALETTE = {
    0: '#0C0C0C', 1: '#0037DA', 2: '#13A10E', 3: '#3A96DD',
    4: '#C50F1F', 5: '#881798', 6: '#C19C00', 7: '#CCCCCC',
    8: '#767676', 9: '#3B78FF', a: '#16C60C', b: '#61D6D6',
    c: '#E74856', d: '#B4009E', e: '#F9F1A5', f: '#F2F2F2',
  };

  // ---------- Host + Shadow DOM ----------
  const host = document.createElement('div');
  host.id = 'page-cli-host';
  host.style.cssText = 'all:initial;position:fixed;z-index:2147483647;top:0;left:0;';
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });

  root.innerHTML = `
    <style>
      :host { all: initial; }
      .win {
        --bg: ${PALETTE[0]}; --fg: ${PALETTE[7]};
        position: fixed; right: 24px; bottom: 24px;
        width: 680px; height: 400px; min-width: 300px; min-height: 120px;
        max-width: calc(100vw - 8px); max-height: calc(100vh - 8px);
        display: flex; flex-direction: column;
        background: var(--bg);
        border: 1px solid #6e6e6e;
        box-shadow: 0 0 0 1px rgba(0,0,0,.08), 0 10px 30px rgba(0,0,0,.45);
        resize: both; overflow: hidden;
      }
      .win.hidden { display: none; }
      .win.min { height: auto !important; min-height: 0; resize: none; }
      .win.min .screen { display: none; }

      /* ----- Title bar (Windows 10 style) ----- */
      .bar {
        display: flex; align-items: center; height: 31px; flex: none;
        background: #ffffff; color: #000;
        font: 12px "Segoe UI", system-ui, -apple-system, sans-serif;
        user-select: none; cursor: default;
      }
      .icon { width: 16px; height: 16px; margin: 0 8px 0 8px; flex: none; }
      .title { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ctl {
        all: unset; width: 46px; height: 31px; display: grid; place-items: center;
        color: #000;
      }
      .ctl:hover { background: #e5e5e5; }
      .ctl.close:hover { background: #e81123; color: #fff; }
      .ctl svg { width: 10px; height: 10px; }

      /* ----- Console area ----- */
      .screen {
        flex: 1; min-height: 0; overflow-y: scroll; overflow-x: hidden;
        padding: 2px 4px 6px;
        background: var(--bg); color: var(--fg);
        font: 15px/1.2 Consolas, "Cascadia Mono", "Lucida Console", "Courier New", monospace;
        cursor: text;
        scrollbar-color: #c1c1c1 #f0f0f0;
      }
      .screen::-webkit-scrollbar { width: 17px; }
      .screen::-webkit-scrollbar-track { background: #f0f0f0; }
      .screen::-webkit-scrollbar-thumb { background: #cdcdcd; border: 2px solid #f0f0f0; }
      .screen::-webkit-scrollbar-thumb:hover { background: #a6a6a6; }
      .screen ::selection { background: var(--fg); color: var(--bg); }

      .line { white-space: pre-wrap; word-break: break-all; min-height: 1.2em; }
      .inline { display: flex; }
      .prompt { white-space: pre; }
      .field { position: relative; flex: 1; display: flex; min-width: 0; }
      input {
        all: unset; flex: 1; min-width: 0;
        font: inherit; color: inherit;
        caret-color: transparent;  /* replaced by the blinking underscore below */
      }
      .cursor {
        position: absolute; bottom: 1px; height: 3px; width: 8px;
        background: var(--fg); pointer-events: none;
        animation: blink 1.06s steps(1) infinite;
      }
      @keyframes blink { 50% { opacity: 0; } }
    </style>

    <div class="win">
      <div class="bar">
        <svg class="icon" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="0.5" y="1.5" width="15" height="13" fill="#0c0c0c" stroke="#7a7a7a"/>
          <rect x="0.5" y="1.5" width="15" height="2.5" fill="#d9d9d9" stroke="#7a7a7a"/>
          <path d="M3 7 L5.5 9 L3 11" stroke="#ccc" stroke-width="1.2" fill="none"/>
          <rect x="6.5" y="10.5" width="4" height="1.2" fill="#ccc"/>
        </svg>
        <span class="title"></span>
        <button class="ctl min" title="Minimize">
          <svg viewBox="0 0 10 10"><path d="M0 5.5h10" stroke="currentColor"/></svg>
        </button>
        <button class="ctl max" title="Maximize">
          <svg viewBox="0 0 10 10"><rect x=".5" y=".5" width="9" height="9" stroke="currentColor" fill="none"/></svg>
        </button>
        <button class="ctl close" title="Close">
          <svg viewBox="0 0 10 10"><path d="M0 0L10 10M10 0L0 10" stroke="currentColor"/></svg>
        </button>
      </div>
      <div class="screen">
        <div class="out"></div>
        <div class="inline">
          <span class="prompt"></span>
          <span class="field">
            <input type="text" spellcheck="false" autocomplete="off" autocapitalize="off" />
            <span class="cursor"></span>
          </span>
        </div>
      </div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const win = $('.win'), bar = $('.bar'), screen = $('.screen'), out = $('.out');
  const input = $('input'), promptEl = $('.prompt'), titleEl = $('.title');
  const cursor = $('.cursor'), field = $('.field');

  // ---------- Prompt (maps the URL to a fake drive path) ----------
  const cwd = () => {
    const path = decodeURIComponent(location.pathname).replace(/\/+$/, '').replace(/\//g, '\\');
    return `C:\\${location.hostname || 'local'}${path}`;
  };
  const updatePrompt = () => { promptEl.textContent = cwd() + '>'; };

  // ---------- Output ----------
  let capture = null; // used for "| clip"
  const print = (text = '') => {
    if (capture) { capture.push(String(text)); return; }
    const div = document.createElement('div');
    div.className = 'line';
    div.textContent = String(text);
    out.appendChild(div);
    screen.scrollTop = screen.scrollHeight;
  };
  const printCmd = (cmd) => {
    const div = document.createElement('div');
    div.className = 'line';
    div.textContent = promptEl.textContent + cmd;
    out.appendChild(div);
    screen.scrollTop = screen.scrollHeight;
  };
  const notRecognized = (word) => {
    print(`'${word}' is not recognized as an internal or external command,`);
    print('operable program or batch file.');
  };
  const fmt = (v) => {
    if (v === undefined) return 'undefined';
    if (typeof v === 'function') return v.toString().slice(0, 300);
    if (v instanceof Element) return label(v);
    if (v instanceof NodeList || v instanceof HTMLCollection) return `[${v.length} nodes] ` + [...v].slice(0, 20).map(fmt).join(', ');
    try { return typeof v === 'string' ? v : JSON.stringify(v, null, 2); }
    catch { return String(v); }
  };
  const label = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    if (typeof el.className === 'string' && el.className.trim()) s += '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.');
    return s;
  };
  const truncate = (s, n = 4000) => (s.length > n ? s.slice(0, n) + '\n... (truncated)' : s);

  // ---------- Highlighting for FIND ----------
  let highlighted = [];
  const clearHighlights = () => {
    highlighted.forEach(([el, o]) => { el.style.outline = o; });
    highlighted = [];
  };

  // ---------- URL helpers ----------
  const resolvePath = (arg) => {
    arg = arg.replace(/^["']|["']$/g, '');
    if (/^[a-z]+:\/\//i.test(arg)) return arg;
    const drive = arg.match(/^c:\\(.*)$/i);               // cd C:\example.com\docs
    if (drive) return 'https://' + drive[1].replace(/\\/g, '/');
    const p = arg.replace(/\\/g, '/');
    if (p.startsWith('/')) return location.origin + p;
    const base = location.origin + location.pathname.replace(/\/?$/, '/');
    return new URL(p, base).href;
  };

  // ---------- Commands ----------
  const commands = {
    cd: {
      desc: 'Displays the name of or changes the current directory (page URL).',
      run(args, argStr) {
        const a = argStr.replace(/^\/d\s*/i, '').trim();
        if (!a) return print(cwd());
        if (a === '..') {
          const segs = location.pathname.split('/').filter(Boolean);
          segs.pop();
          location.href = location.origin + '/' + segs.join('/');
        } else if (a === '\\' || a === '/') {
          location.href = location.origin + '/';
        } else {
          location.href = resolvePath(a);
        }
      }
    },
    cls: { desc: 'Clears the screen.', run() { out.textContent = ''; return 'cls'; } },
    color: {
      desc: 'Sets the default console foreground and background colors. e.g. COLOR 0A',
      run(args) {
        const v = (args[0] || '07').toLowerCase();
        if (!/^[0-9a-f]{1,2}$/.test(v)) {
          print('Sets the default console foreground and background colors.');
          print('');
          print('COLOR [attr]');
          print('');
          print('  attr  Specifies color attribute of console output.');
          print('        Two hex digits: the first is the background, the second the foreground.');
          print('');
          print('    0 = Black       8 = Gray');
          print('    1 = Blue        9 = Light Blue');
          print('    2 = Green       A = Light Green');
          print('    3 = Aqua        B = Light Aqua');
          print('    4 = Red         C = Light Red');
          print('    5 = Purple      D = Light Purple');
          print('    6 = Yellow      E = Light Yellow');
          print('    7 = White       F = Bright White');
          return;
        }
        const [bg, fg] = v.length === 1 ? ['0', v] : [v[0], v[1]];
        if (bg === fg) return; // cmd refuses identical colours
        setColor(bg + fg);
        save();
      }
    },
    date: {
      desc: 'Displays the date.',
      run() { print('The current date is: ' + new Date().toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })); }
    },
    time: {
      desc: 'Displays the system time.',
      run() {
        const d = new Date();
        const cs = String(Math.floor(d.getMilliseconds() / 10)).padStart(2, '0');
        print('The current time is: ' + d.toLocaleTimeString(undefined, { hour12: false }) + '.' + cs);
      }
    },
    dir: {
      desc: 'Displays a list of links (as directories) and loaded resources (as files). DIR [filter]',
      run(args) {
        const f = args.join(' ').toLowerCase();
        const mod = new Date(document.lastModified);
        const stamp = mod.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' }) + '  ' +
                      mod.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
        print(` Volume in drive C is ${location.hostname || 'local'}`);
        print('');
        print(` Directory of ${cwd()}`);
        print('');

        const links = [...document.links].filter(l => !host.contains(l))
          .map(l => ({ name: (l.textContent.replace(/\s+/g, ' ').trim() || '(no text)').slice(0, 50), href: l.href }))
          .filter(l => !f || l.name.toLowerCase().includes(f) || l.href.toLowerCase().includes(f));
        const files = performance.getEntriesByType('resource')
          .map(r => ({ name: decodeURIComponent(r.name.split('?')[0].split('/').filter(Boolean).pop() || r.name), size: r.decodedBodySize || r.transferSize || 0, url: r.name }))
          .filter(r => !f || r.url.toLowerCase().includes(f));

        links.slice(0, 200).forEach(l => print(`${stamp}    <DIR>          ${l.name}  [${l.href}]`));
        files.slice(0, 200).forEach(r => print(`${stamp}    ${r.size.toLocaleString().padStart(14)} ${r.name}`));
        const bytes = files.reduce((s, r) => s + r.size, 0);
        print(`${String(files.length).padStart(16)} File(s) ${bytes.toLocaleString().padStart(14)} bytes`);
        print(`${String(links.length).padStart(16)} Dir(s)`);
      }
    },
    doskey: {
      desc: 'Recalls commands. DOSKEY /HISTORY lists command history.',
      run(args) {
        if ((args[0] || '').toLowerCase() === '/history') hist.forEach(h => print(h));
        else print('Use DOSKEY /HISTORY to list previous commands.');
      }
    },
    echo: {
      desc: 'Displays messages. ECHO. prints a blank line.',
      run(args, argStr, rest) {
        if (rest.startsWith('.')) return print(rest.slice(1));
        print(argStr.trim() ? argStr : 'ECHO is on.');
      }
    },
    exit: { desc: 'Closes the Command Prompt window (Ctrl+` reopens it).', run() { api.hide(); } },
    find: {
      desc: 'Highlights elements matching a CSS selector. FIND "selector" (no args clears)',
      run(args) {
        clearHighlights();
        if (!args.length) return;
        let els;
        try { els = document.querySelectorAll(args.join(' ')); }
        catch { return print('FIND: Parameter format not correct'); }
        els.forEach(el => {
          if (el === host) return;
          highlighted.push([el, el.style.outline]);
          el.style.outline = '2px solid #ff4fd8';
        });
        print(`---------- ${args.join(' ').toUpperCase()}: ${highlighted.length}`);
        highlighted.slice(0, 15).forEach(([el], i) => print(`[${i}] ${label(el)}`));
        if (highlighted[0]) highlighted[0][0].scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    },
    help: {
      desc: 'Provides Help information for commands.',
      run(args) {
        if (args[0]) {
          const c = commands[args[0].toLowerCase()];
          return print(c ? c.desc : 'This command is not supported by the help utility.');
        }
        print('For more information on a specific command, type HELP command-name');
        Object.keys(commands).sort().forEach(k => print(k.toUpperCase().padEnd(15) + commands[k].desc));
        print('');
        print('Anything else you type is run as JavaScript in the page.');
      }
    },
    hostname: { desc: 'Prints the name of the current host.', run() { print(location.hostname || 'local'); } },
    set: {
      desc: 'Displays, sets, or removes localStorage values. SET [name[=value]]',
      run(args, argStr) {
        try {
          const s = argStr.trim();
          if (!s || !s.includes('=')) {
            const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
              .filter(k => !s || k.toLowerCase().startsWith(s.toLowerCase())).sort();
            if (s && !keys.length) return print(`Environment variable ${s} not defined`);
            keys.forEach(k => print(`${k}=${String(localStorage.getItem(k)).slice(0, 200)}`));
            return;
          }
          const i = s.indexOf('=');
          const k = s.slice(0, i), v = s.slice(i + 1);
          if (v === '') localStorage.removeItem(k); else localStorage.setItem(k, v);
        } catch { print('Access is denied.'); }
      }
    },
    start: {
      desc: 'Opens a URL in a new browser tab. START url',
      run(args) {
        if (!args[0]) return print('The system cannot find the file specified.');
        let u = args[0];
        if (!/^[a-z]+:/i.test(u) && /\.[a-z]{2,}/i.test(u) && !u.startsWith('/')) u = 'https://' + u;
        else u = resolvePath(u);
        window.open(u, '_blank', 'noopener');
      }
    },
    systeminfo: {
      desc: 'Displays page and browser information.',
      run() {
        const nav = performance.getEntriesByType('navigation')[0];
        const rows = [
          ['Host Name', location.hostname || 'local'],
          ['Page Title', document.title],
          ['URL', location.href],
          ['Referrer', document.referrer || 'N/A'],
          ['Last Modified', document.lastModified],
          ['Page Load Time', nav ? Math.round(nav.duration) + ' ms' : 'N/A'],
          ['Elements', document.querySelectorAll('*').length],
          ['Images', document.images.length],
          ['Scripts', document.scripts.length],
          ['Viewport', `${innerWidth} x ${innerHeight}`],
          ['Screen', `${window.screen.width} x ${window.screen.height}`],
          ['System Locale', navigator.language],
          ['Logical Processors', navigator.hardwareConcurrency ?? 'N/A'],
          ['Device Memory', navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'N/A'],
          ['Platform', navigator.userAgentData?.platform || navigator.platform || 'N/A'],
          ['Online', navigator.onLine ? 'Yes' : 'No'],
          ['User Agent', navigator.userAgent],
        ];
        print('');
        rows.forEach(([k, v]) => print((k + ':').padEnd(27) + v));
      }
    },
    title: {
      desc: 'Sets the window title for the Command Prompt window. TITLE [string]',
      run(args, argStr) { if (argStr.trim()) { setTitle(argStr.trim()); save(); } }
    },
    tree: {
      desc: 'Graphically displays the element structure. TREE [selector]',
      run(args) {
        const start = args.length ? document.querySelector(args.join(' ')) : document.body;
        if (!start) return print('Invalid path - ' + args.join(' '));
        const lines = [], MAX_LINES = 400, MAX_DEPTH = 6;
        const skip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META']);
        const walk = (el, prefix, depth) => {
          const kids = [...el.children].filter(c => c !== host && !skip.has(c.tagName));
          kids.forEach((c, i) => {
            if (lines.length >= MAX_LINES) return;
            const last = i === kids.length - 1;
            lines.push(prefix + (last ? '└───' : '├───') + label(c));
            if (depth < MAX_DEPTH) walk(c, prefix + (last ? '    ' : '│   '), depth + 1);
          });
        };
        print('Element PATH listing');
        print(label(start));
        walk(start, '', 1);
        lines.forEach(l => print(l));
        if (lines.length >= MAX_LINES) print('... (truncated)');
      }
    },
    type: {
      desc: 'Displays the text content of an element. TYPE [selector]',
      run(args) {
        const el = args.length ? document.querySelector(args.join(' ')) : document.body;
        if (!el) return print('The system cannot find the file specified.');
        print(truncate(el.innerText.trim()));
      }
    },
    ver: { desc: 'Displays the version.', run() { print(''); print(`Page Command Prompt [Version ${VERSION}]`); } },
    clip: {
      desc: 'Copies the last output to the clipboard. Also works as a pipe: DIR | CLIP',
      async run() {
        const lines = [...out.querySelectorAll('.line')];
        const last = lines.slice(0, -1).reverse().find(l => l.textContent.trim() && !l.textContent.startsWith(promptEl.textContent));
        try { await navigator.clipboard.writeText(last ? last.textContent : ''); }
        catch { print('ERROR: Access is denied.'); }
      }
    },
    // ---- Extras (not in real cmd) ----
    js:      { desc: 'Runs JavaScript in the page. JS expression', run(a, argStr) { evalJS(argStr, true); } },
    reload:  { desc: 'Reloads the page.', run() { location.reload(); } },
    back:    { desc: 'Goes back in browser history.', run() { history.back(); } },
    forward: { desc: 'Goes forward in browser history.', run() { history.forward(); } },
    edit:    {
      desc: 'Toggles making the whole page editable.',
      run() {
        const on = document.designMode !== 'on';
        document.designMode = on ? 'on' : 'off';
        print(`Page editing is ${on ? 'on' : 'off'}.`);
      }
    },
    destroy: { desc: 'Removes the Command Prompt from the page completely.', run() { api.destroy(); } },
  };
  commands.chdir = { ...commands.cd };

  // ---------- JavaScript evaluation ----------
  function evalJS(code, forced = false) {
    if (!code.trim()) return;
    const word = code.trim().split(/\s+/)[0];
    const jsish = /[()=;{}\[\]'"`+*<>!?]/.test(code);
    try {
      const result = (0, eval)(code);
      if (result && typeof result.then === 'function') {
        result.then(r => print(fmt(r)), e => print('Uncaught (in promise) ' + (e?.message || e)));
      } else {
        print(fmt(result));
      }
    } catch (e) {
      const csp = e instanceof EvalError || /unsafe-eval|Content Security Policy/i.test(e.message);
      if (!forced && !jsish && (e instanceof SyntaxError || e instanceof ReferenceError || csp)) return notRecognized(word);
      if (csp) return print('JavaScript is blocked on this page by its Content Security Policy.');
      print(`${e.name}: ${e.message}`);
    }
  }

  // ---------- Parsing ----------
  const parse = (s) => (s.match(/"[^"]*"|'[^']*'|\S+/g) || []).map(t => t.replace(/^(["'])(.*)\1$/, '$2'));
  const splitName = (s) => {
    const m = s.match(/^([a-z]+)([\s\S]*)$/i);
    return m ? { name: m[1].toLowerCase(), rest: m[2] } : { name: '', rest: s };
  };
  const isCommand = (s) => {
    const { name, rest } = splitName(s.trim());
    return commands[name] && (rest === '' || /^[\s.\\/:]/.test(rest)) ? { name, rest } : null;
  };

  async function exec(part) {
    const hit = isCommand(part);
    if (!hit) return evalJS(part);
    const { name, rest } = hit;
    const argStr = rest.replace(/^\s/, '');
    if (argStr.trim() === '/?') return print(commands[name].desc);
    return commands[name].run(parse(argStr), argStr, rest);
  }

  async function run(raw) {
    printCmd(raw);
    const line = raw.trim();
    if (!line) return;
    if (hist[hist.length - 1] !== line) hist.push(line);
    if (hist.length > 200) hist.shift();
    histIdx = hist.length;
    save();

    let body = line, toClip = false;
    const pipe = body.match(/^([\s\S]*?)\s*\|\s*clip\s*$/i);
    if (pipe) { body = pipe[1]; toClip = true; capture = []; }

    let cleared = false;
    try {
      // "&" / "&&" chain commands, but only when the line starts with a built-in (so JS "&&" still works).
      const parts = isCommand(body) ? body.split(/\s+&&?\s+/) : [body];
      for (const p of parts) {
        try { if ((await exec(p)) === 'cls') cleared = true; }
        catch (e) { print('Error: ' + e.message); }
      }
    } finally {
      if (toClip) {
        const text = capture.join('\r\n');
        capture = null;
        try { await navigator.clipboard.writeText(text); }
        catch { print('ERROR: Access is denied.'); }
      }
    }
    updatePrompt();
    if (!cleared) print('');
  }

  // ---------- Window state ----------
  const setTitle = (t) => { titleEl.textContent = t; };
  let colorCode = '07';
  const setColor = (code) => {
    colorCode = code;
    win.style.setProperty('--bg', PALETTE[code[0]]);
    win.style.setProperty('--fg', PALETTE[code[1]]);
  };

  const KEY = 'page-cli-state';
  let hist = [], histIdx = 0;
  const load = () => {
    try {
      const s = JSON.parse(sessionStorage.getItem(KEY) || '{}');
      hist = s.hist || [];
      if (s.color) setColor(s.color);
      if (s.title) setTitle(s.title);
      if (s.pos) Object.assign(win.style, s.pos);
    } catch { /* storage blocked */ }
    histIdx = hist.length;
  };
  const save = () => {
    try {
      const st = win.style;
      sessionStorage.setItem(KEY, JSON.stringify({
        hist, color: colorCode, title: titleEl.textContent,
        pos: { left: st.left, top: st.top, right: st.right, bottom: st.bottom, width: st.width, height: st.height },
      }));
    } catch { /* ignore */ }
  };

  // ---------- Blinking underscore cursor ----------
  let cw = 8;
  const measure = () => {
    const s = document.createElement('span');
    s.textContent = '0'.repeat(50);
    s.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;';
    field.appendChild(s);
    cw = s.getBoundingClientRect().width / 50 || 8;
    s.remove();
    cursor.style.width = cw + 'px';
  };
  const updateCursor = () => {
    if (root.activeElement !== input || input.selectionStart !== input.selectionEnd) {
      cursor.style.display = 'none';
      return;
    }
    cursor.style.display = 'block';
    cursor.style.left = (input.selectionStart * cw - input.scrollLeft) + 'px';
    cursor.style.animation = 'none';  // restart blink so it stays visible while typing
    void cursor.offsetWidth;
    cursor.style.animation = '';
  };
  ['input', 'keyup', 'click', 'focus', 'blur', 'select', 'selectionchange', 'scroll'].forEach(t =>
    input.addEventListener(t, updateCursor));

  // ---------- Keyboard ----------
  input.addEventListener('keydown', (e) => {
    e.stopPropagation(); // keep page shortcuts from firing while typing
    if (e.key === 'Enter') {
      const v = input.value;
      input.value = '';
      run(v);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx > 0) { histIdx--; input.value = hist[histIdx]; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < hist.length - 1) { histIdx++; input.value = hist[histIdx]; }
      else { histIdx = hist.length; input.value = ''; }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const v = input.value;
      if (/\s/.test(v)) return;
      const matches = Object.keys(commands).filter(k => k.startsWith(v.toLowerCase())).sort();
      if (matches.length) {
        tabCycle = (tabCycle + (v === lastTab ? 1 : 0)) % matches.length;
        if (v !== lastTab) tabCycle = 0;
        input.value = lastTab = matches[tabCycle];
      }
    } else if (e.key === 'Escape') {
      input.value = '';               // like cmd: Esc clears the line
    } else if (e.ctrlKey && e.key.toLowerCase() === 'c' && input.selectionStart === input.selectionEnd) {
      e.preventDefault();
      printCmd(input.value + '^C');
      input.value = '';
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      out.textContent = '';
    }
    requestAnimationFrame(updateCursor);
  });
  let tabCycle = 0, lastTab = null;
  ['keyup', 'keypress'].forEach(t => input.addEventListener(t, e => e.stopPropagation()));

  // Click anywhere in the console to focus the prompt (unless selecting text to copy).
  screen.addEventListener('mouseup', () => { if (!String(getSelection())) input.focus(); });

  // ---------- Dragging ----------
  bar.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.ctl')) return;
    if (preMax) return;
    const r = win.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    bar.setPointerCapture(e.pointerId);
    const move = (ev) => {
      const x = Math.min(Math.max(0, ev.clientX - dx), innerWidth - 80);
      const y = Math.min(Math.max(0, ev.clientY - dy), innerHeight - 31);
      Object.assign(win.style, { left: x + 'px', top: y + 'px', right: 'auto', bottom: 'auto' });
    };
    const up = () => {
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', up);
      save();
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', up);
  });
  new ResizeObserver(() => { if (!win.classList.contains('min')) { save(); updateCursor(); } }).observe(win);

  // ---------- Title bar buttons ----------
  let preMax = null;
  const toggleMax = () => {
    if (preMax) { Object.assign(win.style, preMax); preMax = null; }
    else {
      const st = win.style;
      preMax = { left: st.left, top: st.top, right: st.right, bottom: st.bottom, width: st.width, height: st.height };
      Object.assign(win.style, { left: '0px', top: '0px', right: 'auto', bottom: 'auto',
                                 width: innerWidth + 'px', height: innerHeight + 'px' });
    }
  };
  $('.ctl.close').onclick = () => api.hide();
  $('.ctl.min').onclick = () => win.classList.toggle('min');
  $('.ctl.max').onclick = toggleMax;
  bar.addEventListener('dblclick', (e) => { if (!e.target.closest('.ctl')) toggleMax(); });

  // ---------- Global show/hide shortcut ----------
  const onKey = (e) => {
    if (e.ctrlKey && (e.key === '`' || (e.shiftKey && e.key.toLowerCase() === 'k'))) {
      e.preventDefault();
      api.toggle();
    }
  };
  window.addEventListener('keydown', onKey, true);

  // ---------- Public API ----------
  const api = {
    show() { win.classList.remove('hidden'); win.classList.remove('min'); input.focus(); },
    hide() { win.classList.add('hidden'); },
    toggle() { win.classList.contains('hidden') ? api.show() : api.hide(); },
    run,
    print,
    /** Add a command: __pageCLI.register('hi', 'Says hi.', (args) => __pageCLI.print('Hi!')) */
    register(name, desc, fn) { commands[name.toLowerCase()] = { desc, run: fn }; },
    destroy() {
      clearHighlights();
      window.removeEventListener('keydown', onKey, true);
      host.remove();
      delete window.__pageCLI;
    },
  };
  window.__pageCLI = api;

  // ---------- Boot ----------
  setTitle('Command Prompt');
  load();
  updatePrompt();
  measure();
  print(`Page Command Prompt [Version ${VERSION}]`);
  print('Type HELP for a list of commands.');
  print('');
  input.focus();
  updateCursor();
})();
