import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('variants.html','utf8');
const app=fs.readFileSync('v3/variants/app.mjs','utf8');
const stats=fs.readFileSync('v2/stats/app.mjs','utf8');

for(const label of ['Chess960','Three-Check','King of the Hill','Crazyhouse','Atomic','Antichess','Horde','Racing Kings']){
  assert.match(html,new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(stats,new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
}
assert.match(html,/variantWhitePocket/);
assert.match(html,/variantBlackPocket/);
assert.match(app,/advanced-variant-v4/);
assert.match(app,/legalMoves/);
assert.match(app,/pockets/);
assert.match(app,/@/);
assert.doesNotMatch(app,/chessops@/);
assert.match(stats,/phaseRow\(`نقاط \$\{label\}`/);
assert.match(stats,/phaseRow\(`مباريات \$\{label\}`/);
