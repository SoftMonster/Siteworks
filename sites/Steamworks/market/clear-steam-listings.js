// Clear Steam sell listings – paste into the browser console on steamcommunity.com/market/
// Adds a red ↺ button next to the listings toolbar bin icon. Click to start/stop, right-click to re-teach positions.
(() => {
  // ---- Clean up any previous version ----
  document.getElementById('clearListingsBtn')?.remove();
  document.getElementById('clearListingsTip')?.remove();
  document.getElementById('clearListingsStyle')?.remove();
  clearInterval(window.__autoConfirm);
  clearInterval(window.__clearPlacer);

  const KEY = 'clearListingsOffsets';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const ownText = el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
  const getCount = () => { const m = document.body.innerText.match(/My sell listings\s*(\d+)/i); return m ? +m[1] : null; };
  const realClick = el => ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(t =>
    el.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window })));
  const centre = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const getAnchor = () => [...document.querySelectorAll('input')].find(i => visible(i) && /filter/i.test(i.placeholder || ''));

  let btn = null, binEl = null;
  const isOurs = e => (btn && btn.contains(e)) || e.id === 'clearListingsTip';
  const hitAt = (x, y) => document.elementsFromPoint(x, y).find(e => !isOurs(e)) || null;

  // ---- Auto-confirm popups (only while running) ----
  const YES = /^(yes\b|ok$|confirm|remove|delete|accept|continue)/i;
  const NO  = /^(no$|cancel|close)/i;
  const confirmPopups = () => {
    for (const m of document.querySelectorAll('.newmodal, [class*="modal" i], [class*="dialog" i], [role=dialog], .swal2-popup')) {
      if (!visible(m)) continue;
      const b = [...m.querySelectorAll('button, a, [role=button], [class*="btn" i], input[type=button], input[type=submit]')]
        .filter(visible)
        .find(x => { const t = (x.value || x.textContent).trim(); return YES.test(t) && !NO.test(t); });
      if (b) { console.log('Auto-confirm:', (b.value || b.textContent).trim()); b.click(); }
    }
  };
  const startAutoConfirm = () => { clearInterval(window.__autoConfirm); window.__autoConfirm = setInterval(confirmPopups, 400); };
  const stopAutoConfirm  = () => clearInterval(window.__autoConfirm);

  // ---- Locate checkbox & bin ----
  const autoFind = () => {
    const anchor = getAnchor(); if (!anchor) return null;
    anchor.scrollIntoView({ block: 'center' });
    const hdr = [...document.querySelectorAll('body *')].find(el => visible(el) && /^(min\.?\s*price|listed on)$/i.test(ownText(el)));
    if (!hdr) return null;
    const hy = centre(hdr).y;
    const boxes = [...document.querySelectorAll('body *')].filter(el => {
      if (!visible(el) || isOurs(el)) return false;
      const r = el.getBoundingClientRect();
      return (el.matches('input[type=checkbox]') || (r.width >= 14 && r.width <= 40 && Math.abs(r.width - r.height) < 6))
        && Math.abs((r.top + r.height / 2) - hy) < 18;
    });
    if (!boxes.length) return null;
    const cb = boxes.sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right)[0];
    const a = centre(anchor), c = centre(cb);
    return { cbDx: c.x - a.x, cbDy: c.y - a.y, binDx: c.x - a.x, binDy: 0 };
  };
  const loadOffsets = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const saveOffsets = o => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {} };
  let off = loadOffsets() || autoFind();

  // Turn whatever is under the bin position into the bin icon element, or null if no icon is there
  const iconFrom = hit => {
    if (!hit) return null;
    let el = hit;
    while (el.parentElement && el.parentElement !== document.body) {
      const r = el.parentElement.getBoundingClientRect();
      if (r.width > 60 || r.height > 60) break;
      el = el.parentElement;
    }
    const r = el.getBoundingClientRect();
    if (r.width > 60 || r.height > 60 || r.width === 0) return null;
    const looksLikeIcon = el.matches('svg, img, i, button, [class*="trash" i], [class*="delete" i], [class*="remove" i], [class*="bin" i]')
      || el.querySelector('svg, img, i');
    return looksLikeIcon ? el : null;
  };
  const findBin = (scroll = false) => {
    if (!off) return null;
    const anchor = getAnchor(); if (!anchor) return null;
    if (scroll) anchor.scrollIntoView({ block: 'center' });
    const a = centre(anchor);
    const x = a.x + off.binDx, y = a.y + off.binDy;
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return null;
    return iconFrom(hitAt(x, y));
  };
  const getBin = (scroll = false) => {
    if (binEl && binEl.isConnected && visible(binEl)) return binEl;
    binEl = findBin(scroll);
    return binEl;
  };

  // ---- Teach mode ----
  const tip = document.createElement('div');
  tip.id = 'clearListingsTip';
  tip.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:100000;background:#c0392b;color:#fff;padding:10px 18px;border-radius:6px;font:15px sans-serif;display:none';
  document.body.appendChild(tip);
  const captureClick = msg => new Promise(res => {
    tip.textContent = msg; tip.style.display = 'block';
    const h = e => { e.preventDefault(); e.stopPropagation(); document.removeEventListener('click', h, true); tip.style.display = 'none'; res({ x: e.clientX, y: e.clientY }); };
    document.addEventListener('click', h, true);
  });
  const teach = async () => {
    const anchor = getAnchor();
    if (!anchor) { alert('Filter box not found – is the sell listings table open?'); return null; }
    anchor.scrollIntoView({ block: 'center' }); await sleep(300);
    const a = centre(anchor);
    const cb  = await captureClick('Teach mode: click the HEADER checkbox (select all)');
    const bin = await captureClick('Now click the BIN icon above it');
    const o = { cbDx: cb.x - a.x, cbDy: cb.y - a.y, binDx: bin.x - a.x, binDy: bin.y - a.y };
    saveOffsets(o); off = o; binEl = null;
    return o;
  };
  window.clearListingsTeach = async () => { await teach(); if (getBin(true)) { createButton(); console.log('Bin found – button added.'); } else console.warn('Still no bin icon at that position.'); };

  // ---- Actions ----
  const tick = () => {
    const anchor = getAnchor(); if (!anchor) return false;
    anchor.scrollIntoView({ block: 'center' });
    const a = centre(anchor);
    const el = hitAt(a.x + off.cbDx, a.y + off.cbDy); if (!el) return false;
    const input = el.matches('input[type=checkbox]') ? el : (el.querySelector('input[type=checkbox]') || el.closest('label')?.querySelector('input[type=checkbox]'));
    if (input && input.checked) return true;
    input && input === el ? el.click() : realClick(el);
    return true;
  };
  // Click the deepest element at the bin's centre, so the event bubbles through
  // the icon and every wrapper – whichever one the page listens on gets it.
  const clickBin = () => {
    binEl = null;                       // always re-find: the page may re-render the toolbar after ticking
    const b = getBin(true); if (!b) return false;
    const c = centre(b);
    const target = hitAt(c.x, c.y) || b;
    realClick(target);
    console.log('Clicked bin:', target);
    return true;
  };

  // ---- Button ----
  const style = document.createElement('style');
  style.id = 'clearListingsStyle';
  style.textContent = `
  #clearListingsBtn{position:absolute;z-index:9999;height:34px;padding:0 12px;border-radius:17px;border:none;cursor:pointer;
    background:#c0392b;color:#fff;font:600 14px sans-serif;display:flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(0,0,0,.5)}
  #clearListingsBtn:hover{background:#a93226}
  #clearListingsBtn.stopped{background:#f1c40f;color:#222}
  #clearListingsBtn.stopped:hover{background:#d4ac0d}
  #clearListingsBtn .ico{font-size:18px;display:inline-block}
  #clearListingsBtn.running .ico{animation:clSpinCCW 1.2s linear infinite}
  @keyframes clSpinCCW{to{transform:rotate(-360deg)}}`;
  document.head.appendChild(style);

  let running = false, stop = false, label = null;
  const setState = (state, txt = '') => {          // state: 'ready' | 'running' | 'stopped'
    running = state === 'running';
    if (!btn) return;
    btn.classList.toggle('running', state === 'running');
    btn.classList.toggle('stopped', state === 'stopped');
    label.textContent = txt;
  };

  const place = () => {
    const b = getBin(false);
    if (!b) { if (btn && !running) btn.style.display = 'none'; return; }
    if (!btn) return;
    btn.style.display = 'flex';
    const r = b.getBoundingClientRect();
    btn.style.left = (r.left + scrollX - btn.offsetWidth - 10) + 'px';
    btn.style.top  = (r.top + scrollY + r.height / 2 - 17) + 'px';
  };

  function createButton() {
    if (btn) return;
    btn = document.createElement('button');
    btn.id = 'clearListingsBtn';
    btn.title = 'Click: clear all listings / stop.  Right-click: re-teach positions';
    btn.innerHTML = '<span class="ico">↺</span><span class="lbl"></span>';
    document.body.appendChild(btn);
    label = btn.querySelector('.lbl');
    label.textContent = getCount() ?? '';
    btn.addEventListener('click', () => { if (running) { stop = true; label.textContent = 'stopping…'; } else run(); });
    btn.addEventListener('contextmenu', async e => { e.preventDefault(); if (!running) { await teach(); place(); alert('Positions saved.'); } });
    place();
    window.__clearPlacer = setInterval(place, 1000);
    addEventListener('resize', place);
  }

  // ---- Main loop ----
  async function run() {
    if (!getBin(true)) { alert('Bin icon not found.'); return; }
    stop = false;
    const origConfirm = window.confirm; window.confirm = () => true;
    let last = getCount();
    if (last === null) { alert('Could not read the listings count.'); window.confirm = origConfirm; return; }
    setState('running', last);
    startAutoConfirm();
    let stalls = 0;

    while (!stop && last > 0) {
      if (!tick()) { alert('Checkbox position not found.'); break; }
      await sleep(500);
      if (!clickBin()) { alert('Bin icon not found.'); break; }

      let now = last, lastChange = Date.now(); const start = Date.now();
      while (!stop && Date.now() - start < 15 * 60 * 1000) {
        await sleep(2000);
        const c = getCount();
        if (c !== null && c !== now) { now = c; lastChange = Date.now(); label.textContent = now; }
        if ((now < last && Date.now() - lastChange > 15000) || now === 0) break;
      }
      if (now < last) { stalls = 0; last = now; }
      else if (++stalls >= 3) {
        stopAutoConfirm();
        if (confirm('No progress after 3 attempts. Re-teach the checkbox/bin positions?')) {
          if (await teach()) { stalls = 0; startAutoConfirm(); continue; }
        }
        break;
      }
    }

    stopAutoConfirm();
    window.confirm = origConfirm;
    setState(stop ? 'stopped' : 'ready', getCount() ?? '');
    place();
    console.log(stop ? 'Stopped.' : `Finished. ${getCount()} listings remaining.`);
  }

  // ---- Start: only add the button if the bin icon is present ----
  if (getBin(true)) {
    createButton();
    console.log('↺ button added next to the bin icon.');
  } else {
    console.warn('Bin icon not found – button not added. If the table is open, run  clearListingsTeach()  to show me where the checkbox and bin are.');
  }
})();
