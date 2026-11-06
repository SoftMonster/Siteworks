// ==UserScript==
// @name         Steam gamecards: separate Normal / Foil buy buttons
// @namespace    softmonster.steam.cards
// @version      1.0.0
// @description  Adds two buttons to the gamecards page: one for the missing NORMAL cards and one for the missing FOIL cards. Each opens Steam's own multibuy page pre-filled, so the two sets can never get mixed up.
// @match        https://steamcommunity.com/id/*/gamecards/*
// @match        https://steamcommunity.com/profiles/*/gamecards/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  // ---------- Settings ----------
  const QTY_PER_CARD = 1;          // how many of each missing card to put in the multibuy list
  const HIDE_SIH_BUTTON = false;   // set true to hide the original (buggy) SIH button

  // ---------- Page info ----------
  const appid = (location.pathname.match(/\/gamecards\/(\d+)/) || [])[1];
  if (!appid) return;

  const basePath = location.pathname.replace(/\/?$/, '/'); // .../gamecards/<appid>/
  const container = document.querySelector('.gamecards_inventorylink');
  if (!container) return;

  // ---------- Helpers ----------

  // Fetch one version of the card page (normal or foil) and return the cards on it.
  async function fetchCards(foil) {
    const url = location.origin + basePath + (foil ? '?border=1' : '');
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');

    return [...doc.querySelectorAll('.badge_card_set_card')].map(card => {
      const nameEl = card.querySelector('.badge_card_set_text');
      const clone = nameEl.cloneNode(true);
      clone.querySelectorAll('.badge_card_set_text_qty').forEach(q => q.remove());
      const name = clone.textContent.trim();
      return {
        name,
        owned: card.classList.contains('owned') && !card.classList.contains('unowned'),
        // Steam market hash names: "<appid>-<Card Name>" and "<appid>-<Card Name> (Foil)"
        hash: `${appid}-${name}${foil ? ' (Foil)' : ''}`,
      };
    });
  }

  function multibuyUrl(cards) {
    const params = cards
      .map(c => `items[]=${encodeURIComponent(c.hash)}&qty[]=${QTY_PER_CARD}`)
      .join('&');
    return `https://steamcommunity.com/market/multibuy?appid=753&contextid=6&${params}`;
  }

  function makeButton(label) {
    const a = document.createElement('a');
    a.className = 'btn_grey_grey btn_medium';   // deliberately NOT btn_buymissings, so SIH's handler ignores it
    a.style.marginLeft = '6px';
    a.target = '_blank';
    a.rel = 'noopener';
    const span = document.createElement('span');
    span.textContent = `${label} (loading…)`;
    a.appendChild(span);
    // Stop any delegated click handler on the container (SIH) from reacting to our buttons
    a.addEventListener('click', e => {
      e.stopPropagation();
      if (!a.href || a.dataset.disabled) e.preventDefault();
    });
    container.appendChild(a);
    return { a, span };
  }

  async function setup(foil) {
    const label = foil ? 'Buy missing FOIL' : 'Buy missing NORMAL';
    const { a, span } = makeButton(label);
    a.dataset.disabled = '1';
    a.style.opacity = '0.6';

    try {
      const cards = await fetchCards(foil);
      const missing = cards.filter(c => !c.owned);

      if (!cards.length) {
        span.textContent = `${foil ? 'No foil set' : 'No normal set'} found`;
        return;
      }
      if (!missing.length) {
        span.textContent = `${foil ? 'Foil' : 'Normal'} set complete ✓`;
        return;
      }

      a.href = multibuyUrl(missing);
      a.title = `${foil ? 'Foil' : 'Normal'} cards missing:\n` + missing.map(c => '• ' + c.hash).join('\n');
      span.textContent = `${label} (${missing.length})`;
      delete a.dataset.disabled;
      a.style.opacity = '';
      console.log(`[normal/foil buttons] ${foil ? 'FOIL' : 'NORMAL'} missing:`, missing.map(c => c.hash));
    } catch (err) {
      console.error('[normal/foil buttons]', err);
      span.textContent = `${label} (error)`;
    }
  }

  if (HIDE_SIH_BUTTON) {
    const sih = container.querySelector('.btn_buymissings');
    if (sih) sih.style.display = 'none';
  }

  setup(false); // normal set
  setup(true);  // foil set
})();
