import fs from 'node:fs';
import assert from 'node:assert/strict';

const previewCss=fs.readFileSync('v2/home/desktop-board-preview-pieces.css','utf8');
const playCss=fs.readFileSync('v2/home/inline-play.css','utf8');

assert.match(previewCss,/#homeBoardPreview:not\(\.inline-play-active\) \.desktop-board-square::after/,'طبقة قطع المعاينة يجب أن تختفي فور دخول وضع اللعب لمنع تراكب طقمين');
assert.match(previewCss,/width:100%/,'قطع معاينة الرئيسية يجب أن تستخدم نفس عرض قطع اللعب');
assert.match(previewCss,/height:100%/,'قطع معاينة الرئيسية يجب أن تستخدم نفس ارتفاع قطع اللعب');
assert.match(previewCss,/transform:translate\(-50%,-50%\) scale\(var\(--piece-scale,1\)\)/,'قطع المعاينة يجب أن تستخدم نفس طريقة تمركز قطع اللعب');

for(const code of ['wp','wn','wb','wr','wq','wk','bp','bn','bb','br','bq','bk']){
  assert.ok(previewCss.includes(`assets/pieces/${code}.png`),`Preview needs artwork for ${code}`);
}
const placements=[...previewCss.matchAll(/--piece-left:50%;--piece-top:50%;--piece-scale:1;/g)];
assert.equal(placements.length,12,'All twelve types must be centered');
assert.ok(playCss.includes('left:var(--piece-left,50%)'),'Live board horizontal placement must match preview');
assert.ok(playCss.includes('top:var(--piece-top,50%)'),'Live board vertical placement must match preview');

assert.doesNotMatch(previewCss,/\.desktop-board-square::after\s*\{[\s\S]*?inset:2%/,'يجب إزالة الحجم القديم الأصغر من قطع المعاينة');

console.log('desktop board preview pieces verification passed');
