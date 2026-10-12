import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(path, 'utf8');
const home = read('index.html');
const shell = read('v2/home/desktop-board-shell.mjs');
const tune = read('v2/home/desktop-board-shell-tune.mjs');
const statistics = read('v2/home/personal-statistics.mjs');

assert.match(shell, /id="desktopHomeStatistics" class="desktop-home-statistics"/,
  'The old welcome card must be replaced with the approved statistics panel');
assert.match(shell, /class="desktop-champions-grid"/,
  'Champion cards must remain visible below the statistics panel');
assert.match(shell, /mountPersonalStatistics\(supabase\)/,
  'The statistics panel must mount independently of online-play modules');
assert.match(tune, /querySelector\('#desktopHomeStatistics\.desktop-home-statistics'\)/,
  'Counter mounting must recognize the current statistics panel rather than a retired welcome card');
assert.doesNotMatch(tune, /querySelector\('\.desktop-welcome-card'\)/,
  'The obsolete welcome-card sentinel would block all counters');
assert.match(tune, /home\.appendChild\(stats\)/,
  'The counters the boot gate waits for must actually be mounted');
assert.match(home, /#desktopDashboardHome \.desktop-live-stats/,
  'The approved-home readiness check must use the same mounted counters');
assert.match(home, /desktop-workspace-initialized/,
  'The homepage must wait for canonical workspace setup, not a legacy layout');
assert.doesNotMatch(tune, /await import\(`\.\/inline-play\.mjs/,
  'Online play must not block the homepage startup');
assert.doesNotMatch(shell, /await Promise\.all\(\[/,
  'Optional chess modes must not block the desktop shell startup');
assert.match(statistics, /get_my_home_statistics/,
  'Personal statistics must be fetched from the authenticated player RPC');
console.log('Desktop home bootstrap: approved statistics, champions, counters, and non-blocking initialization confirmed.');
