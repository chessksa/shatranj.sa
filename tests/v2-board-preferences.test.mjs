import assert from 'node:assert/strict';
import { DEFAULT_BOARD_PREFERENCES, normalizePreferences } from '../v2/board/preferences.mjs';

assert.deepEqual(DEFAULT_BOARD_PREFERENCES, {
  theme:'shatranj', coordinates:'inside', showLegalMoves:true, animation:'medium', moveMethod:'both', whiteAlwaysBottom:false
});
assert.deepEqual(normalizePreferences({theme:'purple',coordinates:'off',showLegalMoves:false,animation:'fast',moveMethod:'click',whiteAlwaysBottom:true}), {
  theme:'purple', coordinates:'off', showLegalMoves:false, animation:'fast', moveMethod:'click', whiteAlwaysBottom:true
});
assert.deepEqual(normalizePreferences({theme:'bogus',coordinates:'x',animation:'warp',moveMethod:'x'}), DEFAULT_BOARD_PREFERENCES);
console.log('board preferences ok');
