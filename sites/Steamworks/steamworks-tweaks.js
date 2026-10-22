(() => {
  const ONLY_BOUGHT_AND_SOLD = true; // false = also link "Listing created/cancelled" rows
  const assetMap = {};
  let autoMode = false;

  async function loadAssets() {
    const p = window.g_oMyHistory, size = p?.m_cPageSize || 10, page = p?.m_iCurrentPage || 0;
    const d = await fetch(`/market/myhistory/render/?query=&start=${page * size}&count=${size}`,
                          { credentials: 'same-origin' }).then(r => r.json());
    if (!d?.success) throw new Error('No history data');
    const re = /CreateItemHoverFromContainer\(\s*g_rgAssets,\s*'([^']+)',\s*(\d+),\s*'(\d+)',\s*'(\d+)'/g;
    for (const [, id, app, ctx, asset] of (d.hovers || '').matchAll(re)) {
      const a = d.assets?.[app]?.[ctx]?.[asset];
      if (a?.market_hash_name) assetMap[id] = { app, hash: a.market_hash_name };
    }
  }

  function linkify() {
    let n = 0;
    document.querySelectorAll('#tabContentsMyMarketHistoryRows .market_recent_listing_row').forEach(row => {
      const sign = row.querySelector('.market_listing_gainorloss')?.textContent.trim();
      if (ONLY_BOUGHT_AND_SOLD && !['+', '-', '−'].includes(sign)) return;
      const el = row.querySelector('.market_listing_item_name');
      const info = el && assetMap[el.id];
      if (!info || el.querySelector('a.mh-link')) return;
      const a = document.createElement('a');
      a.className = 'mh-link';
      a.href = `https://steamcommunity.com/market/listings/${info.app}/${encodeURIComponent(info.hash)}`;
      a.target = '_blank';
      a.style.cssText = 'color:inherit;text-decoration:underline';
      a.textContent = el.textContent;
      el.textContent = '';
      el.appendChild(a);
      n++;
    });
    return n;
  }

  async function run(label) {
    label.textContent = 'Linking…';
    try { await loadAssets(); label.textContent = `Linked ${linkify()} ✓`; }
    catch (e) { console.error(e); label.textContent = 'Failed – retry'; }
  }

  document.getElementById('mh-link-btn')?.remove();
  const btn = document.createElement('a');
  btn.id = 'mh-link-btn';
  btn.className = 'btn_green_white_innerfade btn_small';
  btn.style.cssText = 'margin:6px 8px;float:right';
  btn.innerHTML = '<span>Link item names</span>';
  btn.onclick = e => { e.preventDefault(); autoMode = true; run(btn.firstChild); };
  (document.getElementById('tabMyMarketHistory')?.parentElement || document.body).prepend(btn);

  let t;
  new MutationObserver(() => {
    if (!autoMode) return;
    clearTimeout(t);
    t = setTimeout(() => {
      const missing = [...document.querySelectorAll('#tabContentsMyMarketHistoryRows .market_listing_item_name')]
        .some(el => !el.querySelector('a.mh-link') && !assetMap[el.id]);
      missing ? run(btn.firstChild) : linkify();
    }, 400);
  }).observe(document.getElementById('tabContentsMyMarketHistory') || document.body,
             { childList: true, subtree: true });
})();
