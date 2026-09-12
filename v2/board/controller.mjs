import { BOARD_THEMES, THEME_ORDER, getBoardTheme } from './themes.mjs';
import { DEFAULT_BOARD_PREFERENCES, normalizePreferences } from './preferences.mjs';

const STORAGE_KEY = 'shatranj:v2:board-preferences';

export function loadBoardPreferences(storage = window.localStorage){
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return normalizePreferences(raw ? JSON.parse(raw) : DEFAULT_BOARD_PREFERENCES);
  } catch {
    return {...DEFAULT_BOARD_PREFERENCES};
  }
}

export function saveBoardPreferences(value, storage = window.localStorage){
  const normalized = normalizePreferences(value);
  storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function applyBoardPreferences(board, value){
  const prefs = normalizePreferences(value);
  const theme = getBoardTheme(prefs.theme);
  const root = board || document.documentElement;
  root.style.setProperty('--board-light', theme.light);
  root.style.setProperty('--board-dark', theme.dark);
  root.style.setProperty('--board-line', theme.line || 'rgba(35,42,32,.28)');
  root.dataset.boardTheme = prefs.theme;
  root.dataset.coordinates = prefs.coordinates;
  root.dataset.legalMoves = prefs.showLegalMoves ? 'on' : 'off';
  root.dataset.animation = prefs.animation;
  root.dataset.moveMethod = prefs.moveMethod;
  root.dataset.whiteBottom = prefs.whiteAlwaysBottom ? 'on' : 'off';
  return prefs;
}

export function renderThemePicker(container, selectedTheme, onSelect){
  container.replaceChildren();
  for (const id of THEME_ORDER) {
    const theme = BOARD_THEMES[id];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'v2-theme-option';
    button.dataset.theme = id;
    button.classList.toggle('active', id === selectedTheme);
    const preview = document.createElement('span');
    preview.className = 'v2-theme-preview';
    preview.setAttribute('aria-hidden','true');
    for (const background of [theme.light, theme.dark, theme.dark, theme.light]) {
      const cell = document.createElement('i');
      cell.style.background = background;
      preview.appendChild(cell);
    }
    const label = document.createElement('strong');
    label.textContent = theme.label;
    button.append(preview, label);
    button.addEventListener('click', () => onSelect?.(id));
    container.appendChild(button);
  }
}
