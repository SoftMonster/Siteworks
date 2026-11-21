// Shared Steam Community Market fee arithmetic. All values are integer minor units.
(function (root) {
  'use strict';
  function buyerTotal(sellerReceives, publisherPercent, wallet) {
    const received = Math.max(0, Math.floor(Number(sellerReceives) || 0));
    const w = wallet && typeof wallet === 'object' ? wallet : {};
    const steamPct = Number.isFinite(Number(w.wallet_fee_percent)) ? Number(w.wallet_fee_percent) : 0.05;
    const base = Math.max(0, Math.floor(Number(w.wallet_fee_base) || 0));
    const minimum = Math.max(1, Math.floor(Number(w.wallet_fee_minimum) || 1));
    const pubPct = Number.isFinite(Number(publisherPercent)) ? Math.max(0, Number(publisherPercent)) : 0.10;
    const steamFee = Math.floor(Math.max(received * steamPct, minimum) + base);
    const publisherFee = Math.floor(Math.max(received * pubPct, minimum));
    return received + steamFee + publisherFee;
  }
  function sellerReceives(targetBuyerTotal, publisherPercent, wallet) {
    const target = Math.max(0, Math.floor(Number(targetBuyerTotal) || 0));
    // Fee inversion is deliberately bounded and deterministic; market prices are minor-unit integers.
    for (let r = target; r >= 1; r--) if (buyerTotal(r, publisherPercent, wallet) <= target) return r;
    return 0;
  }
  root.SiteWorksFinance = Object.freeze({ buyerTotal, sellerReceives });
})(typeof window !== 'undefined' ? window : globalThis);
