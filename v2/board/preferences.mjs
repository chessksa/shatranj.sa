import { normalizeBoardTheme } from './themes.mjs';

export const DEFAULT_BOARD_PREFERENCES = Object.freeze({
  theme:'shatranj',
  coordinates:'inside',
  showLegalMoves:true,
  animation:'medium',
  moveMethod:'both',
  whiteAlwaysBottom:false
});

const COORDINATES = new Set(['off','inside','outside']);
const ANIMATIONS = new Set(['none','slow','medium','fast','natural','arcade']);
const MOVE_METHODS = new Set(['both','drag','click']);

export function normalizePreferences(value = {}){
  return {
    theme: normalizeBoardTheme(value.theme),
    coordinates: COORDINATES.has(value.coordinates) ? value.coordinates : DEFAULT_BOARD_PREFERENCES.coordinates,
    showLegalMoves: typeof value.showLegalMoves === 'boolean' ? value.showLegalMoves : DEFAULT_BOARD_PREFERENCES.showLegalMoves,
    animation: ANIMATIONS.has(value.animation) ? value.animation : DEFAULT_BOARD_PREFERENCES.animation,
    moveMethod: MOVE_METHODS.has(value.moveMethod) ? value.moveMethod : DEFAULT_BOARD_PREFERENCES.moveMethod,
    whiteAlwaysBottom: typeof value.whiteAlwaysBottom === 'boolean' ? value.whiteAlwaysBottom : DEFAULT_BOARD_PREFERENCES.whiteAlwaysBottom
  };
}
