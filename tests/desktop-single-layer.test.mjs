import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(path,'utf8');
const home = read('index.html');
const shell = read('v2/home/desktop-board-shell.mjs');
const painter = read('v2/home/move-notebook.mjs');
const tune = read('v2/home/desktop-board-shell-tune.mjs');
const shared = read('v2/home/inline-play.mjs');
const boardCss = read('v2/home/desktop-board-shell.css');
const inlineCss = read('v2/home/inline-play.css');

for(const [attr,path] of [
  ['data-desktop-board-shell','desktop-board-shell.css'],
  ['data-desktop-shell-tune','desktop-board-shell-tune.css'],
  ['data-desktop-sidebar-cleanup','desktop-sidebar-cleanup.css'],
  ['data-inline-play','inline-play.css'],
]){
  assert.equal(home.split(attr).length-1,1,`Desktop bundle ${attr} must be linked exactly once`);
  assert.match(home,new RegExp(path.replaceAll('.','\\.')),`Missing canonical stylesheet ${path}`);
}
assert.match(home,/<div id="homeBoardPreview"/,'Idle chessboard must not carry the old navigation anchor');
assert.doesNotMatch(home,/board-theme-override\.css/,'Old board theme must not be loaded');
assert.match(home,/desktop-board-preview-piece'\)\.length!==32/,'Do not expose board before all 32 PNG images exist');
assert.doesNotMatch(tune,/\.css\?v=\$\{tuneAssetVersion\}/,'Tuning must not append another stylesheet layer');
assert.doesNotMatch(tune,/desktop-tip-card|desktop-quick-card|bindTuneActions/,'Never rebuild hidden deprecated cards');
assert.match(painter,/piece\.classList\.add\('chess-pawn'\)/,'Mark only pawns for desktop scaling');
assert.match(painter,/piece\.style\.setProperty\('transform','translate\(-50%, -50%\) scale\(\.90\)','important'\)/);
assert.match(painter,/target\.replaceChildren\(grid\)/,'Old board nodes must be removed before rebuild');
assert.doesNotMatch(shell,/desktop-board-hint|desktop-tip-card/);
assert.match(boardCss,/desktop-board-preview-piece:is\(\[src\*="\/wp\.png"\],\[src\*="\/bp\.png"\]\)/);
assert.match(boardCss,/content:none!important;display:none!important;background-image:none!important/,'Reject old CSS sprite layers on idle board');
assert.match(inlineCss,/scale\(\.90\)!important/,'All other desktop pawn renderers stay at 90%');
assert.match(shared,/if\(!document\.querySelector\('link\[data-inline-play\]'\)\)/,'Inline module must not add duplicate CSS');
for(const obsolete of ['v2/home/board-theme-override.css','v2/home/desktop-sidebar-cleanup.mjs','v2/home/desktop-board-preview-pieces.css']){
  assert.equal(fs.existsSync(obsolete),false,`Obsolete module still present: ${obsolete}`);
}
console.log('Desktop interface: one style bundle, one PNG board, no retired visual layers.');
