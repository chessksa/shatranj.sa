import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(path,'utf8');
const desktop=read('v2/home/desktop-board-shell.mjs');
const mobile=read('mobile-home-fixed-v1.js');
const inlinePuzzles=read('v2/home/inline-puzzles.mjs');
const play=read('v2/home/inline-play.mjs');
const variants=read('v3/variants/app.mjs');
const sidebar=read('v2/home/desktop-sidebar-cleanup.css');
const styles=read('v2/home/desktop-board-shell.css');
const html=read('index.html');

// Refresh must preserve every desktop middle-column route, including variants.
assert.match(desktop,/const DASHBOARD_ROUTES=new Set\(\[[^\]]*'play-options'[^\]]*'variants'/);
assert.match(desktop,/DASHBOARD_ROUTES\.has\(initialHash\)\?initialHash:'home'/);
assert.match(desktop,/DASHBOARD_ROUTES\.has\(next\)\)showDashboard\(next,\{preserveRoute:true\}\)/);
assert.match(desktop,/initialHash==='play'[\s\S]*?showDashboard\('home',\{preserveRoute:true\}\)/);
assert.match(desktop,/url\.hash='#'\+\(id==='puzzles'&&initialPuzzleMode==='daily'/);
assert.match(desktop,/url\.pathname\+url\.search\+url\.hash/);
assert.match(play,/desktop:inline-play-open/);

// Mobile must restore selected tabs rather than start at Home on every reload.
assert.match(mobile,/const mobileRoutes=new Set\(\[[^\]]*'tournaments'/);
assert.match(mobile,/show\(routeFromHash\(\)\|\|'home',\{updateRoute:false\}\)/);
assert.match(mobile,/window\.addEventListener\('hashchange'/);
assert.match(mobile,/history\.replaceState\(history\.state,'',url\.pathname\+url\.search\+url\.hash\)/);

// Variants must mount once on the canonical board, never navigate to variants.html.
assert.match(desktop,/showDashboard\('variants'\)/);
assert.match(desktop,/preview\.replaceChildren\(board\)/);
assert.match(desktop,/mountVariantGame\(\{boardElement:board,scope:body,embedded:true\}\)/);
assert.doesNotMatch(desktop,/location\.assign\('variants\.html'\)/);
assert.match(variants,/export async function mountVariantGame/);
assert.match(variants,/if\(\/\(\?:\^\|\\\/\)variants\\\.html\$\/i\.test\(location\.pathname\)/);
assert.match(variants,/void loadChessEngines\(\)\.then/);
assert.match(variants,/chess960:'rnbqkbnr/);
assert.match(variants,/advancedModes\.has/);

// One golden border, not an added two-pixel focus/selection frame.
assert.match(sidebar,/border:0\.5px solid #d7b66c!important/);
assert.match(sidebar,/\.desktop-home-nav-link\.active:focus-visible/);
assert.match(sidebar,/outline:none!important/);
assert.match(styles,/\.desktop-play-choice-list > button\.is-selected[\s\S]*?border:0\.5px solid #d7b66c!important/);
assert.match(styles,/\.desktop-play-primary\{[\s\S]*?border:0\.5px solid #d7b66c!important/);
assert.doesNotMatch(styles,/\.desktop-play-primary\{[^}]*background:#367e62/);
assert.doesNotMatch(styles,/inset 0 0 0 2px #d7b66c/);
assert.match(html,/home-side-daily-friend-v1/);

assert.doesNotMatch(desktop,/data-play-choice="online"/,'Duplicate internet play tile should be removed');
assert.match(styles,/\.desktop-play-time-options button\.is-selected[\s\S]*?border:0\.5px solid #d7b66c!important/);
// The homepage's left rail must use spare real estate without moving the board.
assert.match(desktop,/function buildHomeSideRail\(\)/);
assert.match(desktop,/stage\.appendChild\(rail\)/);
assert.match(desktop,/preview\.getBoundingClientRect\(\)\.left-stage\.getBoundingClientRect\(\)\.left/);
assert.match(desktop,/freeSpace>=125/);
assert.match(desktop,/buildHomeSideRail\(\);/);
assert.match(desktop,/showDashboard\('puzzles',\{initialPuzzleMode:'daily'\}\)/);
assert.match(desktop,/showDashboard\('invite'\)/);
assert.match(styles,/\.desktop-home-side-rail\[hidden\]\{display:none!important\}/);
assert.match(styles,/\.desktop-home-side-rail\{[\s\S]*?position:absolute/);
assert.match(inlinePuzzles,/mountInlinePuzzles\(body,\{initialMode='rated'\}/);
assert.match(inlinePuzzles,/mode=initialMode==='daily'\?'daily':'rated'/);
assert.match(inlinePuzzles,/mode==='daily'\?'#puzzles-daily':'#puzzles'/);
assert.match(desktop,/initialHash==='puzzles-daily'/);

console.log('Routes, variants and daily puzzle/friend home rail: PASS');
