(() => {
  const CURRENCY = 2;      // 2 = GBP
  const cache = {};        // href -> { lowest, undercut } or a pending Promise
  let tip;

  const pence = s => Math.round(parseFloat(String(s).replace(/[^\d.,]/g, '').replace(/,(?=\d{3})/g, '').replace(',', '.')) * 100);
  const fmt = p => (p / 100).toFixed(2);

  function parse(href) {
    const m = href.match(/\/market\/listings\/(\d+)\/([^?#]+)/);
    return m && { app: m[1], hash: decodeURIComponent(m[2]) };
  }

  function getPrice(href) {
    if (cache[href]) return Promise.resolve(cache[href]);
    const it = parse(href);
    const p = fetch(`/market/priceoverview/?appid=${it.app}&currency=${CURRENCY}&market_hash_name=${encodeURIComponent(it.hash)}`)
      .then(r => r.json())
      .then(d => {
        if (!d?.success || !d.lowest_price) throw new Error('No current price');
        const low = pence(d.lowest_price);
        return (cache[href] = { lowest: d.lowest_price, undercut: fmt(Math.max(3, low - 1)) });
      })
      .catch(e => { delete cache[href]; throw e; });
    cache[href] = p;
    return p;
  }

  function copy(text) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    if (!ok) navigator.clipboard?.writeText(text);
  }

  function showTip(el, html) {
    tip ??= Object.assign(document.body.appendChild(document.createElement('div')), {
      style: 'position:fixed;z-index:99999;background:#1b2838;color:#c6d4df;border:1px solid #66c0f4;padding:5px 8px;font-size:12px;border-radius:3px;pointer-events:none'
    });
    const r = el.getBoundingClientRect();
    tip.innerHTML = html;
    tip.style.left = r.left + 'px';
    tip.style.top = (r.bottom + 4) + 'px';
    tip.style.display = 'block';
  }
  const hideTip = () => tip && (tip.style.display = 'none');

  function toast(msg) {
    const t = Object.assign(document.body.appendChild(document.createElement('div')), { textContent: msg });
    t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:99999;background:#5c7e10;color:#fff;padding:8px 14px;border-radius:3px;font-size:13px';
    setTimeout(() => t.remove(), 2000);
  }

  function upgrade() {
    let n = 0;
    document.querySelectorAll('#tabContentsMyActiveMarketListingsRows a.market_listing_item_name_link:not(.uc-done)').forEach(old => {
      if (!parse(old.href)) return;
      const a = old.cloneNode(true);          // fresh link, no old handlers
      a.classList.add('uc-done');
      a.target = '_blank';
      a.style.textDecoration = 'underline dotted';
      const href = a.href;

      a.addEventListener('mouseenter', () => {
        showTip(a, 'Loading current price…');
        getPrice(href).then(p => a.matches(':hover') &&
          showTip(a, `Current lowest: <b>${p.lowest}</b><br>Click copies: <b style="color:#a4d007">${p.undercut}</b>`))
          .catch(() => a.matches(':hover') && showTip(a, 'No current price found'));
      });
      a.addEventListener('mouseleave', hideTip);

      a.addEventListener('click', e => {
        const p = cache[href];
        if (p && !(p instanceof Promise)) {   // price ready: copy, then let the link open
          copy(p.undercut);
          toast(`Copied ${p.undercut}`);
          return;
        }
        e.preventDefault();                   // not loaded yet: fetch, copy, then open
        getPrice(href).then(p => {
          copy(p.undercut);
          toast(`Copied ${p.undercut}`);
          if (!window.open(href, '_blank')) toast(`Copied ${p.undercut} – click again to open`);
        }).catch(() => toast('No current price found'));
      });

      old.replaceWith(a);
      n++;
    });
    return n;
  }

  document.getElementById('uc-btn')?.remove();
  const btn = document.createElement('a');
  btn.id = 'uc-btn';
  btn.className = 'btn_green_white_innerfade btn_small';
  btn.style.cssText = 'margin:6px 8px;float:right';
  btn.innerHTML = '<span>Undercut links</span>';
  let auto = false;
  btn.onclick = e => {
    e.preventDefault();
    auto = true;
    btn.firstChild.textContent = `Undercut links: ${upgrade()} ✓`;
  };
  const anchor = document.getElementById('mh-link-btn');
  anchor ? anchor.after(btn) : (document.getElementById('tabMyListings')?.parentElement || document.body).prepend(btn);

  let t;
  new MutationObserver(() => {
    if (!auto) return;
    clearTimeout(t);
    t = setTimeout(upgrade, 300);
  }).observe(document.getElementById('tabContentsMyListings') || document.body, { childList: true, subtree: true });
})();