// Site Works shared configuration schema. Safe to load in a worker or page.
(function (root) {
  'use strict';
  const DEFAULTS = {
    schemaVersion: 1,
    market: { currencyId: 2, quickSellMinPence: 14, undercutPence: 1 },
    safety: { maxListingsPerRun: 20, requestIntervalMs: 4000, requireSellConfirmation: true, requireBulkDeleteConfirmation: true },
    notifications: { enabled: true, durationMs: 5000 }
  };
  const clampInt = (v, fallback, min, max) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
  };
  function normalize(input) {
    const src = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const market = src.market && typeof src.market === 'object' ? src.market : {};
    const safety = src.safety && typeof src.safety === 'object' ? src.safety : {};
    const notifications = src.notifications && typeof src.notifications === 'object' ? src.notifications : {};
    return {
      schemaVersion: 1,
      market: {
        currencyId: [1, 2, 3, 5, 7, 8, 20, 21].includes(Number(market.currencyId)) ? Number(market.currencyId) : DEFAULTS.market.currencyId,
        quickSellMinPence: clampInt(market.quickSellMinPence, 14, 1, 100000),
        undercutPence: clampInt(market.undercutPence, 1, 0, 10000)
      },
      safety: {
        maxListingsPerRun: clampInt(safety.maxListingsPerRun, 20, 1, 500),
        requestIntervalMs: clampInt(safety.requestIntervalMs, 4000, 4000, 120000),
        // These are deliberately non-configurable in R1: confirmations cannot be disabled.
        requireSellConfirmation: true,
        requireBulkDeleteConfirmation: true
      },
      notifications: {
        enabled: notifications.enabled !== false,
        durationMs: clampInt(notifications.durationMs, 5000, 1500, 15000)
      }
    };
  }
  function merge(current, patch) {
    const a = normalize(current), p = patch && typeof patch === 'object' && !Array.isArray(patch) ? patch : {};
    return normalize({
      market: Object.assign({}, a.market, p.market || {}),
      safety: Object.assign({}, a.safety, p.safety || {}),
      notifications: Object.assign({}, a.notifications, p.notifications || {})
    });
  }
  root.SWConfig = Object.freeze({ defaults: () => JSON.parse(JSON.stringify(DEFAULTS)), normalize, merge });
})(typeof self !== 'undefined' ? self : globalThis);
