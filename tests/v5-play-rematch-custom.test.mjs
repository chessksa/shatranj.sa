import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('play-v2.html','utf8');
const api=fs.readFileSync('v2/play/api.js','utf8');
const phase5=fs.readFileSync('v2/play/phase5.mjs','utf8');

for(const id of ['v5-time-picker','v5-time-picker-button','v5-time-picker-menu','v5-rematch']){
  assert.match(html,new RegExp(`id=["']${id}["']`));
}
for(const seconds of [60,180,300,600,900,1800]){
  assert.match(html,new RegExp(`data-base-seconds=["']${seconds}["']`));
}
assert.doesNotMatch(html,/id=["']v5-custom-increment["']/);
assert.doesNotMatch(html,/id=["']v5-custom-rated["']/);
assert.doesNotMatch(html,/id=["']v5-custom-search["']/);
assert.match(html,/v2\/play\/phase5\.mjs/);
for(const token of ['startCustomMatchmaking','pollCustomMatchmaking','cancelCustomMatchmaking','requestRematch','getRematchState']){
  assert.match(api,new RegExp(token));
  assert.match(phase5,new RegExp(token));
}
assert.match(phase5,/rematch_status|rematchStatus/);
assert.match(phase5,/incrementSeconds:\s*0/);
assert.match(phase5,/rated:\s*true/);
assert.match(phase5,/startTimeSearch/);
assert.match(phase5,/classList\.contains\(['"]searching['"]\)/);
assert.match(phase5,/regularSearch\.click\(\)/);
