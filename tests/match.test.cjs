const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(new URL('../match.js', `file://${__filename}`), 'utf8');
const context = { URL, console, fetch: async () => { throw new Error('not used'); }, chrome: { runtime: { getURL: (p) => p } }, crypto: globalThis.crypto };
vm.createContext(context);
vm.runInContext(source, context);
const SW = context.SW;

const idx = {
  sites: { Steamworks: { hosts: ['steamcommunity.com', 'steampowered.com'] }, Google: { hosts: [] } },
  files: [
    'root.js',
    'Steamworks/base.js',
    'Steamworks/inventory/prices.js',
    'Steamworks/market/listings/clear.js',
    'Steamworks/steamcommunity.com/profile/buttons.js',
    'Google/search/helper.js'
  ]
};

test('root scripts match every HTTP(S) host', () => {
  assert.deepEqual(Array.from(SW.matchingScripts(idx, 'https://example.org/a')), ['root.js']);
});

test('site scripts match configured hosts and subdomains', () => {
  assert.equal(SW.fileMatches(idx, 'Steamworks/base.js', SW.urlParts('https://store.steampowered.com/')), true);
  assert.equal(SW.fileMatches(idx, 'Steamworks/base.js', SW.urlParts('https://community.steamcommunity.com/')), true);
  assert.equal(SW.fileMatches(idx, 'Steamworks/base.js', SW.urlParts('https://notsteam.com/')), false);
});

test('nested folders are matched as an ordered subsequence', () => {
  assert.equal(SW.fileMatches(idx, 'Steamworks/market/listings/clear.js', SW.urlParts('https://steamcommunity.com/market/my/listings/')), true);
  assert.equal(SW.fileMatches(idx, 'Steamworks/market/listings/clear.js', SW.urlParts('https://steamcommunity.com/listings/market/')), false);
});

test('host-specific folder narrows an otherwise broad site folder', () => {
  assert.equal(SW.fileMatches(idx, 'Steamworks/steamcommunity.com/profile/buttons.js', SW.urlParts('https://steamcommunity.com/profile/id/test')), true);
  assert.equal(SW.fileMatches(idx, 'Steamworks/steamcommunity.com/profile/buttons.js', SW.urlParts('https://store.steampowered.com/id/test')), false);
});

test('site-name matching uses complete host labels, not substrings', () => {
  assert.equal(SW.siteMatches('Google', idx, 'mail.google.co.uk'), true);
  assert.equal(SW.siteMatches('Google', idx, 'notgoogle.com'), false);
});

test('specific matches sort after shallower scripts', () => {
  const got = Array.from(SW.matchingScripts(idx, 'https://steamcommunity.com/market/my/inventory/'));
  assert.equal(got[0], 'root.js');
  assert.ok(got.indexOf('Steamworks/base.js') < got.indexOf('Steamworks/inventory/prices.js'));
});

test('per-site decision wins over global decision and newer host decision wins', () => {
  const hash = 'a'.repeat(64);
  const perms = {
    '*|Steamworks/base.js': { d: 'block', at: 1 },
    'Steamworks|Steamworks/base.js': { d: 'allow', hash, at: 2 },
    'steamcommunity.com|Steamworks/base.js': { d: 'block', at: 3 }
  };
  assert.equal(SW.verdict(perms, 'steamcommunity.com', 'Steamworks/base.js', hash), 'block');
  delete perms['steamcommunity.com|Steamworks/base.js'];
  assert.equal(SW.verdict(perms, 'steamcommunity.com', 'Steamworks/base.js', hash), 'allow');
  assert.equal(SW.verdict(perms, 'steamcommunity.com', 'Steamworks/base.js', 'b'.repeat(64)), 'changed');
});

test('global block applies when no more specific decision exists', () => {
  const perms = { '*|root.js': { d: 'block', at: 10 } };
  assert.equal(SW.verdict(perms, 'example.org', 'root.js', 'c'.repeat(64)), 'block');
});
