import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(path,'utf8');
const notebookCss=read('v2/home/move-notebook.css');
const notebookJs=read('v2/home/move-notebook.mjs');
const previewCss=read('v2/home/desktop-board-shell.css');
const inlineCss=read('v2/home/inline-play.css');
const mobileCss=read('mobile-home-fixed-v1.css');
const v2Css=read('v2/play/mobile-piece-size.css');
const legacyCss=read('realistic-pieces.css');
const spectator=read('v2/home/inline-tournament-spectator.mjs');
const sprite=read('assets/pieces/shatranj-approved-20260904.svg');
const home=read('index.html');

assert.match(notebookCss,/height:var\(--notebook-board-height/,'Moves panel must match the height of the board');
assert.match(notebookCss,/position:fixed/,'Full-width notation must be viewport fixed, not lost inside the stage');
assert.match(notebookCss,/border-radius:0;/,'Outer notebook corners must be square');
assert.doesNotMatch(notebookCss,/data-mode="compact"|data-mode="docked"/,'Do not bring back narrow collapsed move strip');
assert.match(notebookCss,/\.move-notebook-columns,.move-notebook-row\{display:grid/,'Headers and moves must share one real 3-column grid');
assert.match(notebookCss,/\.move-notebook-columns>span,\.move-notebook-row>span\{[^}]*border-inline-end:1px/,'Cells need vertical borders');
assert.match(notebookCss,/repeating-linear-gradient\(to bottom/,'Empty part of notation area must still show horizontal grid rows');
assert.match(notebookCss,/flex:1 1 auto/,'Notation rows must fill available height');
assert.match(notebookJs,/const width=Math\.min\(680,availableLeft\)/,'Move grid must never exceed the free left width');
assert.match(notebookCss,/z-index:29/,'Board above at z-index 30 is a safe fallback against visual overlap');
assert.match(notebookJs,/--notebook-docked-width/,'Available width must be applied to the notation panel only');
assert.match(notebookJs,/--notebook-board-height/,'Notation height must track actual board height');
assert.doesNotMatch(notebookCss,/transform:translateX\(/,'Notebook must never shift the board');
assert.match(home,/20261012-home-champions-v15/,'Homepage must use latest asset cache');

assert.match(previewCss,/\.desktop-board-square > \.desktop-board-preview-piece:not\(\[src\*="\/wp\.png"\]\):not\(\[src\*="\/bp\.png"\]\)/);
assert.match(previewCss,/scale\(\.95\)!important/,'Idle desktop major pieces must be scaled to 95%');
assert.match(inlineCss,/\.inline-play-square > \.inline-play-piece:not\(\[src\*="\/wp\.png"\]\):not\(\[src\*="\/bp\.png"\]\)/,'Live/computer/puzzle/learn scales only non-pawns');
assert.match(inlineCss,/--piece-scale:\.95/,'All desktop playing modes reduce non-pawns by 5%');
assert.match(legacyCss,/\.piece:not\(\.piece-p\) \.piece-image\{transform:scale\(\.95\)/);
assert.match(v2Css,/scale:\.95!important/,'Alternative v2 board should match approved non-pawn size');
assert.match(mobileCss,/width:95\.95%;height:95\.95%/,'Mobile non-pawns are 95% of original 101% baseline');
assert.match(spectator,/width:87\.4%;height:87\.4%/,'Spectator non-pawns are 95% of 92% baseline');
for(const id of ['wk','wq','wr','wb','wn','bk','bq','br','bb','bn']){
  assert.ok(sprite.includes(`<g id="${id}" transform="translate(1 1) scale(0.95)">`),`SVG ${id} must be 95% centered`);
}
for(const id of ['wp','bp']){
  assert.ok(sprite.includes(`<g id="${id}" transform="translate(2 2) scale(0.90)">`),`Pawn ${id} must stay at 90%`);
}
assert.equal((sprite.match(/<g id="/g)||[]).length,12,'Exactly 12 current pieces, no stacked legacy pieces');
console.log('Notation grid/geometry and 95% major-piece sizing passed');
