import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const game=read('play-v10.html');
const theme=read('cm-chessboard-shatranj-v3.css');
const reference=read('exact-board-v13.js');
const liveCss=read('play-reference-mobile-v14.css');
const pregameCss=read('play-reference-pregame-v15.css');
const notebook=read('v2/home/move-notebook.css');
const desktopShell=read('v2/home/desktop-board-shell.css');
const desktopTune=read('v2/home/desktop-board-shell-tune.css');
for(const [path,source] of [
  ['play-reference-mobile-v14.css',liveCss],
  ['play-reference-pregame-v15.css',pregameCss],
  ['cm-chessboard-shatranj-v3.css',theme]
]){
  assert.match(source,/assets\/boards\/wood4\.jpg/,`Game theme must use approved Wood 4 asset: ${path}`);
  assert.doesNotMatch(source,/linear-gradient\(90deg,#a9784d,#8e623f/,`Old brown gradient must be removed from ${path}`);
}
assert.doesNotMatch(reference,/rgba\(216,179,126,\.92\)|rgba\(141,96,59,\.92\)/,'Retired mobile square fills must not return');
assert.match(reference,/square\.style\.setProperty\('fill', 'transparent', 'important'\)/,'Mobile reference palette must be transparent');
for(const path of ['play-v8.js','play-v10-match.js','play-computer.js']){
  const code=read(path);
  assert.match(code,/matchMedia\('\(max-width:900px\)'\)\.matches/,'Game mode must choose mobile fill independently');
  assert.match(code,/'transparent'/,'Mobile uses only Wood 4 artwork');
}
assert.match(game,/fill-opacity:0!important/,'Mobile SVG board square overlays must remain invisible');
assert.match(desktopShell,/margin:0!important;padding:0!important;/,'The desktop board must have no brown inner frame');
assert.match(desktopShell,/border:0!important;border-radius:0!important;\s*background:transparent!important;/,'The old brown inner border and fill must be removed');
assert.match(desktopTune,/padding:0!important/,'Desktop tune must not restore a brown inner gap');
assert.doesNotMatch(notebook,/width:min\(\s*calc\(100vw[^;]+chess-notebook-width/,'Move log must never make the live desktop board smaller');
assert.doesNotMatch(notebook,/data-mode="compact"|width:38px/,'Move table must no longer collapse into a hamburger strip');
console.log('Mobile game board Wood 4 palette and fixed desktop board: PASS');
