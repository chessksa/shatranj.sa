import fs from 'node:fs';
import assert from 'node:assert/strict';

const loader = fs.readFileSync('admin-computer-games.js','utf8');
const fairplay = fs.readFileSync('v6/admin/fairplay.mjs','utf8');

assert.match(loader,/v3\/admin\/phase3\.mjs/);
assert.match(loader,/v6\/admin\/fairplay\.mjs/);
for (const token of ['admin_v6_list_fair_play_cases','admin_v6_resolve_fair_play_case','Fair Play','سليم','تمت المراجعة']) {
  assert.match(fairplay,new RegExp(token));
}
assert.doesNotMatch(fairplay,/admin_ban|suspend/i);
