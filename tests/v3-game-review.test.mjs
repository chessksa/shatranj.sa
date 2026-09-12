import fs from 'node:fs';
import assert from 'node:assert/strict';
const app=fs.readFileSync('v2/analysis/app.mjs','utf8');
for(const token of ['bestMove','evalBefore','evalAfter','lossCp','isCritical','accuracyWhite','accuracyBlack','v3_save_game_review'])assert.match(app,new RegExp(token));
assert.match(app,/forced/);
assert.match(app,/critical/);
