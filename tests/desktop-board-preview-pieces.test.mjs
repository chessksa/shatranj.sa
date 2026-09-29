import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync('v2/home/desktop-board-shell.mjs','utf8');

assert.doesNotMatch(source,/desktop-board-hint/,'واجهة الكمبيوتر لا يجب أن تعرض تلميح اضغط على الرقعة للعب');
assert.match(source,/assets\/pieces\/\$\{piece\}\.png/,'معاينة الرقعة يجب أن تستخدم ملفات القطع المعتمدة الحالية');
assert.match(source,/const startingPieces=\[/,'يجب تعريف وضع البداية الكامل للقطع في معاينة الرقعة');
assert.match(source,/startingPieces\.forEach/,'يجب تركيب قطع وضع البداية على مربعات المعاينة');

console.log('desktop board preview pieces verification passed');
