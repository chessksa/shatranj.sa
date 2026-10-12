import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync('v2/home/move-notebook.mjs','utf8');
const shell=fs.readFileSync('v2/home/desktop-board-shell.mjs','utf8');
const style=fs.readFileSync('v2/home/desktop-board-shell.css','utf8');
const play=fs.readFileSync('v2/home/inline-play.css','utf8');
const mobile=fs.readFileSync('mobile-home-fixed-v1.css','utf8');
const sprite=fs.readFileSync('assets/pieces/shatranj-approved-20260904.svg','utf8');

assert.match(source,/desktop-board-preview-piece/,'Desktop preview must render canonical PNG images, not the legacy detached CSS');
assert.match(source,/assets\/pieces\//,'Desktop preview must use the canonical image directory');
assert.match(shell,/renderApprovedPreview\(preview\)/,'Homepage must call the canonical preview renderer');
assert.match(source,/firstRank=\['r','n','b','q','k','b','n','r'\]/,'Pieces must appear in their initial chess position');
assert.match(style,/\.desktop-board-square > \.desktop-board-preview-piece/,'The preview must center the real PNG images');
assert.match(style,/preview-piece:is\(\[src\*="\/wp\.png"\],\[src\*="\/bp\.png"\]\)/,'Both colors must use the same pawn sizing rule');
assert.match(style,/scale\(\.90\)!important/,'Desktop preview pawns must be scaled to 90%');
assert.match(play,/--piece-scale:\.90/,'Desktop online, computer, puzzles and lessons must scale pawns to 90%');
assert.match(mobile,/width:90\.9%;height:90\.9%/,'Mobile pawns must be 90% of the original 101% display size');
for(const color of ['wp','bp']){
  assert.match(sprite,new RegExp('<g id="'+color+'" transform="translate\\(2 2\\) scale\\(0\\.90\\)">'),'SVG-based games must center pawns at 90%');
}
console.log('Unified pawn size and preview verification passed');
