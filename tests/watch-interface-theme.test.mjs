import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../watch.html', import.meta.url), 'utf8');

assert.match(html, /<meta name="theme-color" content="#042628">/);
assert.match(html, /--hero-deeper:#042628/);
assert.match(html, /--hero-gold:#d8b665/);
assert.match(html, /--hero-cream:#f4eddc/);
assert.match(html, /linear-gradient\(145deg,var\(--hero-deeper\),var\(--hero-deep\) 50%,#07383a\)/);
assert.match(html, /\.game\{[^}]*background:linear-gradient\(145deg,rgba\(8,62,64,.86\),rgba\(7,49,51,.8\)\)[^}]*border:1px solid var\(--hero-cyan-line\)/);
assert.match(html, /\.player\{[^}]*background:rgba\(7,48,50,.8\)[^}]*border:1px solid var\(--hero-line\)/);
assert.doesNotMatch(html, /\.game\{[^}]*background:#fff/);
assert.match(html, /list_public_current_games/);
assert.match(html, /setInterval\(load,3000\)/);

console.log('watch interface theme tests passed');
