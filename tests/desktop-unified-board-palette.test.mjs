import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(path,'utf8');
const home=read('index.html');
const base=read('v2/home/desktop-board-shell.css');
const play=read('v2/home/inline-play.css');
const puzzles=read('v2/home/inline-puzzles.css');
const learn=read('v2/home/inline-learn.css');
const puzzleScript=read('v2/home/inline-puzzles.mjs');
const learnScript=read('v2/home/inline-learn.mjs');
const mobile=read('mobile-home-fixed-v1.css');
const v2=read('v2/play/home-palette.css');
const external=read('cm-chessboard-shatranj-v3.css');

assert.match(base,/\.desktop-board-grid\{[^}]*assets\/boards\/wood4\.jpg/,'Homepage uses the approved Wood 4 board');
assert.match(base,/\.desktop-board-square\.light\{background:rgba\(255,247,224,\.43\)!important\}/);
assert.match(base,/\.desktop-board-square\.dark\{background:rgba\(49,24,11,\.36\)!important\}/);
for(const [name,css] of [['puzzles',puzzles],['learn',learn]]){
  assert.doesNotMatch(css,/\.desktop-board-square\.(light|dark)\s*\{/,`${name} must not re-color the common desktop squares`);
  assert.doesNotMatch(css,/#e8dec8|#87966a/i,`${name} must not contain the retired beige/olive theme`);
  assert.doesNotMatch(css,/\.desktop-board-square\s*\{\s*border:/,`${name} must not override the common square grid border`);
}
for(const [name,script] of [['puzzles',puzzleScript],['learn',learnScript]]){
  assert.match(script,/\.className='desktop-board-grid inline-play-grid inline-/,`${name} must use the shared board grid`);
  assert.match(script,/\.className=`desktop-board-square inline-play-square inline-/,`${name} must use the shared square CSS classes`);
  assert.match(script,/link\.href=new URL\('\.\/inline-(puzzles|learn)\.css\?v=20261012-notebook-no-overlap-v11'/,`${name} must fetch the updated styles`);
  assert.match(script,/baseLoaded=\[\.\.\.document\.querySelectorAll\('link\[rel="stylesheet"\]'\)\]/,`${name} must reuse the preloaded common board stylesheet`);
  assert.doesNotMatch(script,/20261006-board-colors1|20260918-inline-play1/,`${name} must not load old palette or board layers`);
}
assert.match(home,/shatranj-asset-version" content="20261012-home-champions-v15"/);
assert.match(home,/data-desktop-board-shell href="v2\/home\/desktop-board-shell\.css\?v=20261012-home-champions-v15"/);
assert.match(play,/\.inline-play-square > \.inline-play-piece/,'Live play retains the common square and pieces CSS');
assert.match(mobile,/\.mfw-board-grid\{[^}]*wood4\.jpg/,'Mobile home remains on the approved Wood 4 board');
assert.match(v2,/\.v2-board\{[^}]*wood4\.jpg/,'Alternative game boards remain on Wood 4');
assert.match(external,/\.cm-board-host\{[^}]*wood4\.jpg/,'SVG game boards remain on Wood 4');
console.log('Unified Wood 4 and matching homepage square colors for home, play, puzzles and lessons: PASS');
