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
]) assert.match(module,new RegExp(token));
for(const token of ['v5-home-dashboard','v5-home-quick','v5-home-card']) assert.match(css,new RegExp(token));
