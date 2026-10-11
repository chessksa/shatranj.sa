import fs from 'node:fs';
import assert from 'node:assert/strict';

const previewCss=fs.readFileSync('v2/home/desktop-board-preview-pieces.css','utf8');
const playCss=fs.readFileSync('v2/home/inline-play.css','utf8');

assert.match(previewCss,/#homeBoardPreview:not\(\.inline-play-active\) \.desktop-board-square::after/,'طبقة قطع المعاينة يجب أن تختفي فور دخول وضع اللعب لمنع تراكب طقمين');
assert.match(previewCss,/width:94%/,'قطع معاينة الرئيسية يجب أن تستخدم نفس عرض قطع اللعب');
assert.match(previewCss,/height:94%/,'قطع معاينة الرئيسية يجب أن تستخدم نفس ارتفاع قطع اللعب');
assert.match(previewCss,/transform:translate\(-50%,-50%\) scale\(var\(--piece-scale,1\)\)/,'قطع المعاينة يجب أن تستخدم نفس طريقة تمركز قطع اللعب');

for(const code of ['wp','wn','wb','wr','wq','wk','bp','bn','bb','br','bq','bk']){
  assert.match(previewCss,new RegExp(`assets/pieces/${code}\\\\.png`),`Preview should use approved artwork: ${code}`);
}
const placementRules=[...previewCss.matchAll(/--piece-left:50%;--piece-top:50%;--piece-scale:1;/g)];
assert.equal(placementRules.length,12,'All twelve preview types must be centered');
assert.match(playCss,/left:var\\(--piece-left,50%\\)/,'Live chess must share centered horizontal placement');
assert.match(playCss,/top:var\\(--piece-top,50%\\)/,'Live chess must share centered vertical placement');

assert.doesNotMatch(previewCss,/\.desktop-board-square::after\s*\{[\s\S]*?inset:2%/,'يجب إزالة الحجم القديم الأصغر من قطع المعاينة');

console.log('desktop board preview pieces verification passed');
