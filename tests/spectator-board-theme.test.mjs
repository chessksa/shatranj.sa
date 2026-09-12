import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../spectator-board.mjs', import.meta.url),'utf8');
assert.match(source,/loadBoardPreferences/);
assert.match(source,/getBoardThemeSolidPair/);
assert.doesNotMatch(source,/setProperty\('fill','#d6cfbf'/);
assert.doesNotMatch(source,/setProperty\('fill','#246f77'/);
console.log('spectator board themes ok');
