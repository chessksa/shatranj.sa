import fs from 'node:fs';
import assert from 'node:assert/strict';

const css=fs.readFileSync('v2/home/move-notebook.css','utf8');
const html=fs.readFileSync('index.html','utf8');

// Keep the previously fixed separate and non-overlapping layout untouched.
assert.match(css,/position:fixed/,'Notebook must remain outside board layout');
assert.match(css,/z-index:29/,'Chessboard must remain visually above the notebook');
assert.doesNotMatch(css,/transform:translateX\(/,'Chessboard must not move');

// The text sets the height instead of the old excessively tall 40px rows.
assert.match(css,/--notebook-row-height:28px;/,'Move rows must be 28px high');
assert.match(css,/\.move-notebook-row\{height:var\(--notebook-row-height\);min-height:var\(--notebook-row-height\)/);
const spacing='transparent 27px,var(--notebook-grid-line) 27px,var(--notebook-grid-line) 28px';
assert.equal(css.split(spacing).length-1,2,'Gridlines must repeat at the 28px row height for normal and narrow notebooks');
assert.doesNotMatch(css,/transparent 39px,var\(--notebook-grid-line\) 39px/,'Old 40px gridlines must be removed');

// The title and column heading rows are compact and framed in gold.
assert.match(css,/\.desktop-move-notebook\{[\s\S]*?border:0;/,'Notebook outer frame must not double the 1px gold header border');
assert.match(css,/\.move-notebook-rows\{[^}]*border-inline:1px solid var\(--notebook-grid-line\)/,'Grid body keeps a single 1px side frame');
assert.match(css,/\.move-notebook-header\{[^}]*border:1px solid var\(--notebook-header-gold\)/,'Gold frame must remain exactly 1px');
assert.match(css,/--notebook-grid-line:rgba\(188,219,209,\.30\)/,'Base table lines must preserve their established weight');
assert.match(css,/--notebook-header-gold:rgba\(224,181,103,\.30\)/,'Gold header uses the same opacity and line weight as the regular grid, only its hue differs');
assert.match(css,/--notebook-title-height:54px;/);
assert.match(css,/--notebook-columns-height:30px;/);
assert.match(css,/\.move-notebook-header\{[^}]*border:1px solid var\(--notebook-header-gold\);[^}]*min-height:var\(--notebook-title-height\);flex:0 0 var\(--notebook-title-height\)/);
assert.match(css,/\.move-notebook-columns\{[^}]*flex:0 0 var\(--notebook-columns-height\);[^}]*border:1px solid var\(--notebook-header-gold\);border-top:0/);
assert.match(css,/\.move-notebook-columns>span:not\(:last-child\)\{border-inline-end-color:var\(--notebook-header-gold\)\}/);
assert.match(css,/\.move-notebook-header\{min-height:46px;flex-basis:46px/,'Compact desktops must also retain a shorter title row');
assert.match(html,/data-move-notebook href="v2\/home\/move-notebook\.css\?v=20261012-notebook-gold-sameweight-v14"/,'Browsers must load fresh notebook styles');

console.log('Compact 28px move rows, aligned grid and gold-framed compact headers: PASS');
