// Site Works page-side shared notification service.
(function (root) {
  'use strict';
  const state = root.__siteWorksConfig || {};
  const prefs = state.notifications || {};
  function show(message, level) {
    if (prefs.enabled === false || !root.document || !root.document.body) return null;
    const doc = root.document;
    let host = doc.getElementById('siteworks-notification-host');
    if (!host) {
      host = doc.createElement('div');
      host.id = 'siteworks-notification-host';
      host.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647;display:grid;gap:8px;max-width:min(420px,calc(100vw - 32px));font:13px/1.4 Segoe UI,Arial,sans-serif;pointer-events:none';
      doc.body.appendChild(host);
    }
    const kind = ['success', 'warning', 'error', 'info'].includes(level) ? level : 'info';
    const item = doc.createElement('div');
    item.textContent = String(message == null ? '' : message);
    item.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    item.setAttribute('aria-live', kind === 'error' ? 'assertive' : 'polite');
    const border = { success: '#a4d007', warning: '#e5b84b', error: '#e06c5b', info: '#66c0f4' }[kind];
    item.style.cssText = `background:#1b2838;color:#fff;border:1px solid ${border};border-radius:7px;padding:10px 13px;box-shadow:0 4px 18px rgba(0,0,0,.35);white-space:pre-line;pointer-events:auto`;
    host.appendChild(item);
    const duration = Math.max(1500, Math.min(15000, Number(prefs.durationMs) || 5000));
    root.setTimeout(() => { item.remove(); if (host && !host.childElementCount) host.remove(); }, duration);
    return item;
  }
  root.SiteWorksNotify = Object.freeze({ show, success: (m) => show(m, 'success'), warning: (m) => show(m, 'warning'), error: (m) => show(m, 'error'), info: (m) => show(m, 'info') });
})(typeof window !== 'undefined' ? window : globalThis);
