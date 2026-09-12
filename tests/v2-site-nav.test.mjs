import assert from 'node:assert/strict';
import { SITE_NAV } from '../v2/site/nav.mjs';
assert.deepEqual(SITE_NAV.map(x=>x.id), ['home','play','computer','watch','tournaments','players','profile','settings']);
assert.equal(SITE_NAV.find(x=>x.id==='play').href, 'play-v2.html?auto=1');
assert.equal(SITE_NAV.find(x=>x.id==='computer').href, 'play-v10.html?computer=1');
assert.equal(SITE_NAV.find(x=>x.id==='settings').href, 'settings-v2.html');
console.log('site nav ok');
