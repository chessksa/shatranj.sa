import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = file => fs.readFileSync(file,'utf8');
const notebook = read('v2/home/move-notebook.mjs');
const notebookCss = read('v2/home/move-notebook.css');
const shell = read('v2/home/desktop-board-shell.mjs');
const online = read('v2/home/inline-play.mjs');
const computer = read('v2/home/inline-computer.mjs');
const puzzles = read('v2/home/inline-puzzles.mjs');
const learn = read('v2/home/inline-learn.mjs');

assert.match(notebook,/const firstRank=\['r','n','b','q','k','b','n','r'\]/);
assert.match(notebook,/for\(let index=0;index<64;index\+\+\)/);
assert.match(notebook,/target\.replaceChildren\(grid\)/);
assert.match(notebook,/assets\/pieces\/\$\{color\}\$\{type\}\.png/);
assert.doesNotMatch(notebookCss,/transform:translateX\(calc\(var\(--chess-notebook-width\)/,'Starting to play must never move the board');
assert.match(notebook,/const availableLeft=Math\.max\(0,Math\.floor\(boardRect\.left-stageRect\.left\)\)/,'The notebook must not treat space right of the board as room to shift it');

for(const [name,source] of [['online',online],['computer',computer],['puzzles',puzzles],['learn',learn]]){
  assert.match(source,/function restoreStaticBoard\(\)/,`${name} needs a proper home restoration path`);
  assert.match(source,/renderApprovedPreview\(target\)/,`${name} must restore all 32 approved PNG pieces`);
  assert.doesNotMatch(source.slice(source.indexOf('function restoreStaticBoard()'),source.indexOf('\n}',source.indexOf('function restoreStaticBoard()'))),/desktop-board-hint/,`${name} must not bring back the old empty board`);
}
assert.match(shell,/window\.dispatchEvent\(new CustomEvent\('desktop:inline-play-stop'\)\)/,'Home navigation must stop live online play');
assert.match(shell,/function ensureApprovedHomePieces\(\)/,'Home navigation must repair empty previews');
assert.match(shell,/querySelectorAll\('\.desktop-board-square > \.desktop-board-preview-piece'\)\.length!==32/,'Homepage must have 32 pieces');
assert.match(shell,/if\(id==='home'\)\{[\s\S]*?ensureApprovedHomePieces\(\)/,'Returning home must restore empty boards');
assert.match(shell,/window\.addEventListener\('shatranj:tournament-spectator-stopped'/,'Async spectator cleanup must be handled');
assert.match(online,/playGeneration/,'Online requests must track navigation generation');
assert.match(online,/if\(!active\|\|generation!==playGeneration\|\|currentGame\?\.id!==gameId\)return null/,'Late game updates must not wipe a restored board');
console.log('Home chessboard position and 32-piece restoration verified for all desktop routes.');
