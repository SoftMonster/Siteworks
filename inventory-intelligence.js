// Site Works R2 shared inventory intelligence primitives.
(function (root) {
  'use strict';
  const DAY = 86400000;
  function freshness(timestamp, now) {
    const age = Math.max(0, (Number(now) || Date.now()) - Number(timestamp || 0));
    if (!timestamp || !Number.isFinite(Number(timestamp))) return 'missing';
    if (age < 2 * DAY) return 'fresh';
    if (age < 14 * DAY) return 'aging';
    return 'stale';
  }
  function valuation(holdings, prices) {
    const result = { designs: 0, quantity: 0, pricedDesigns: 0, pricedQuantity: 0, totalMinor: 0, unpricedDesigns: 0 };
    Object.keys(holdings || {}).forEach((name) => {
      const h = holdings[name] || {}, p = (prices || {})[name];
      const qty = Math.max(0, Number(h.qty) || 0);
      result.designs++; result.quantity += qty;
      if (p && Number.isFinite(Number(p[0])) && Number(p[0]) >= 0) {
        result.pricedDesigns++; result.pricedQuantity += qty; result.totalMinor += Math.round(Number(p[0])) * qty;
      } else result.unpricedDesigns++;
    });
    return result;
  }
  function compareSnapshots(previous, current) {
    const changes = { added: [], removed: [], quantityChanged: [] };
    const a = previous || {}, b = current || {};
    new Set([...Object.keys(a), ...Object.keys(b)]).forEach((name) => {
      const before = Number(a[name] && a[name].qty) || 0, after = Number(b[name] && b[name].qty) || 0;
      if (!before && after) changes.added.push({ name, qty: after });
      else if (before && !after) changes.removed.push({ name, qty: before });
      else if (before !== after) changes.quantityChanged.push({ name, before, after, delta: after - before });
    });
    return changes;
  }
  function priceSpread(price, bid) {
    if (!price || !bid || price[1] !== bid[1]) return null;
    return Math.max(0, Number(price[0]) - Number(bid[0]));
  }
  root.SiteWorksInventory = Object.freeze({ freshness, valuation, compareSnapshots, priceSpread });
})(typeof window !== 'undefined' ? window : globalThis);
