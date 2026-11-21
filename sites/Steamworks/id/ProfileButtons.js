// ==UserScript==
// @name         Steam Profile: Market & Trading Links
// @namespace    https://steamcommunity.com/id/SoftMonster/
// @version      1.1
// @description  Adds buttons to every Steam profile page: a cheap foil cards Market search and a Steam trading sites page.
// @match        https://steamcommunity.com/id/*
// @match        https://steamcommunity.com/profiles/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const LINKS = [
    {
      id: 'foil-cards-market-link',
      title: 'Cheap Foil Cards (Market)',
      tooltip: 'Foil trading cards priced 3p-7p, sorted by quantity',
      url:
        'https://steamcommunity.com/market/search' +
        '?price_min=3&price_currency=2&price_max=07' +
        '&q=%22foil+trading+card%22&sort=2&dir=1#p1_quantity_desc',
    },
    {
      id: 'steam-trading-sites-link',
      title: 'Steam Trading Sites',
      tooltip: 'Collection of Steam trading sites',
      url: 'https://softmonster.github.io/WrightWayCodersGuild/Samples/HTMLSamples/MIT/SteamTradingSites.html',
    },
  ];

  function buildLink(link) {
    const a = document.createElement('a');
    a.id = link.id;
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.title = link.tooltip;
    a.className = 'btn_profile_action btn_medium';
    a.style.marginLeft = '4px';
    a.innerHTML = '<span>' + link.title + '</span>';
    return a;
  }

  function inject() {
    const missing = LINKS.filter((l) => !document.getElementById(l.id));
    if (missing.length === 0) return true;

    // Preferred: next to Edit Profile / Add Friend buttons
    const actions = document.querySelector('.profile_header_actions');
    if (actions) {
      missing.forEach((l) => actions.appendChild(buildLink(l)));
      return true;
    }

    // Fallback: top of the right-hand column
    const rightCol = document.querySelector('.profile_rightcol');
    if (rightCol) {
      const wrap = document.createElement('div');
      wrap.style.margin = '8px 0';
      missing.forEach((l) => wrap.appendChild(buildLink(l)));
      rightCol.insertBefore(wrap, rightCol.firstChild);
      return true;
    }
    return false;
  }

  if (!inject()) {
    // Page (or other extensions) may still be building the DOM
    const observer = new MutationObserver(() => {
      if (inject()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
  }
})();