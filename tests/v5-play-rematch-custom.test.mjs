import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('play-v2.html','utf8');
const api=fs.readFileSync('v2/play/api.js','utf8');
const app=fs.readFileSync('v2/play/app.js','utf8');

for(const id of ['v5-custom-base','v5-custom-increment','v5-custom-rated','v5-custom-search','v5-rematch']){
  assert.match(html,new RegExp(`id=["']${id}["']`));
}
for(const token of ['startCustomMatchmaking','pollCustomMatchmaking','cancelCustomMatchmaking','requestRematch','getRematchState']){
  assert.match(api,new RegExp(token));
  assert.match(app,new RegExp(token));
}
assert.match(app,/rematch_status|rematchStatus/);
assert.match(app,/increment_seconds|incrementSeconds/);
assert.match(app,/rated/);
