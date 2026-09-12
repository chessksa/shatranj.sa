import assert from 'node:assert/strict';
import { BOARD_THEMES, THEME_ORDER, DEFAULT_BOARD_THEME, normalizeBoardTheme } from '../v2/board/themes.mjs';

assert.equal(DEFAULT_BOARD_THEME, 'shatranj');
assert.equal(THEME_ORDER.length, 31, 'Shatranj + 30 board options expected');
assert.equal(new Set(THEME_ORDER).size, THEME_ORDER.length, 'theme ids must be unique');
assert.deepEqual(THEME_ORDER.slice(1), [
  '8-bit','bases','blue','brown','bubblegum','burled-wood','dark-wood','dash','glass','graffiti',
  'green','icy-sea','light','lolz','marble','metal','neon','newspaper','orange','overlay','parchment',
  'purple','red','sand','sky','stone','tan','tournament','translucent','walnut'
]);
for (const id of THEME_ORDER) {
  const theme = BOARD_THEMES[id];
  assert.ok(theme, `missing theme ${id}`);
  assert.equal(typeof theme.label, 'string');
  assert.ok(theme.light && theme.dark, `theme ${id} must define light/dark squares`);
}
assert.equal(normalizeBoardTheme('purple'), 'purple');
assert.equal(normalizeBoardTheme('not-real'), 'shatranj');
console.log('board theme catalog ok');
