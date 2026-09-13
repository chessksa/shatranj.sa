import fs from 'node:fs';
import assert from 'node:assert/strict';

const index=fs.readFileSync('index.html','utf8');
const module=fs.readFileSync('v2/home/dashboard.mjs','utf8');
const css=fs.readFileSync('v2/home/dashboard.css','utf8');

assert.match(index,/v2\/home\/dashboard\.css/);
assert.match(index,/v2\/home\/dashboard\.mjs/);
assert.match(index,/config-base\.js/);

for(const token of [
  'v5_home_dashboard','getSessionPlayer','onAuthStateChange','active_game',
  'incoming_challenges','friends_count','online_friends','unread_notifications',
  'upcoming_tournament','daily_puzzle','recent_game'
]) assert.doesNotMatch(module,new RegExp(token));

for(const token of [
  'get_public_home_snapshot','welcomeTickerTrack','tournamentResultsTicker',
  "from('tournaments')"
]) assert.match(module,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));

assert.match(css,/v5-home-dashboard/);
assert.match(css,/display:none!important/);
