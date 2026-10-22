(() => {
  if (window.__sellFillArmed) return console.log('Already armed.');
  window.__sellFillArmed = true;

  const parsePrice = t => {
    const s = String(t || '').trim().replace(/[£$€\s]/g, '').replace(',', '.');
    return /^\d+(\.\d{1,2})?$/.test(s) && parseFloat(s) >= 0.03 ? parseFloat(s).toFixed(2) : null;
  };

  const fire = (el, ...types) => types.forEach(t =>
    el.dispatchEvent(t.startsWith('key') ? new KeyboardEvent(t, { bubbles: true }) : new Event(t, { bubbles: true })));

  function toast(msg, ok = true) {
    const t = Object.assign(document.body.appendChild(document.createElement('div')), { textContent: msg });
    t.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:99999;padding:8px 14px;border-radius:3px;font-size:13px;color:#fff;background:${ok ? '#5c7e10' : '#a33'}`;
    setTimeout(() => t.remove(), 2500);
  }

  function tickSSA() {
    const cb = document.getElementById('market_sell_dialog_accept_ssa');
    if (cb && !cb.checked) { cb.checked = true; fire(cb, 'change'); }
  }

  function fillPrice(text) {
    const buyer = document.getElementById('market_sell_buyercurrency_input');
    if (!buyer || buyer.value.trim()) return;              // don't overwrite a price already there
    const price = parsePrice(text);
    if (!price) return toast(`Clipboard isn't a price: "${String(text).slice(0, 20)}"`, false);
    buyer.value = price;
    fire(buyer, 'input', 'keyup', 'change', 'blur');       // makes Steam recalculate "You receive"
    toast(`Buyer pays set to ${price}`);
  }

  const isAcceptButton = el => {
    const b = el.closest?.('#market_sell_dialog_accept, a, button');
    return b && (b.id === 'market_sell_dialog_accept' || /put it up for sale/i.test(b.textContent));
  };

  document.addEventListener('mouseover', e => {
    if (!isAcceptButton(e.target)) return;
    tickSSA();
    const buyer = document.getElementById('market_sell_buyercurrency_input');
    if (buyer && !buyer.value.trim()) {
      navigator.clipboard.readText()
        .then(fillPrice)
        .catch(() => toast('Clipboard blocked – press Ctrl+V in the dialog', false));
    }
  }, true);

  // Backup: Ctrl+V while the sell dialog is open fills the price too
  document.addEventListener('paste', e => {
    const dlg = document.getElementById('market_sell_dialog');
    if (!dlg || dlg.offsetParent === null || e.target.id === 'market_sell_currency_input') return;
    const buyer = document.getElementById('market_sell_buyercurrency_input');
    if (buyer) buyer.value = '';
    e.preventDefault();
    fillPrice(e.clipboardData.getData('text'));
    tickSSA();
  }, true);

  console.log('Sell auto-fill armed – hover "OK, put it up for sale" to fill the price.');
})();
