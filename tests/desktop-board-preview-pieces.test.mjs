import fs from 'node:fs';
import assert from 'node:assert/strict';

const previewCss=fs.readFileSync('v2/home/desktop-board-preview-pieces.css','utf8');
const playCss=fs.readFileSync('v2/home/inline-play.css','utf8');

assert.match(previewCss,/#homeBoardPreview:not\(\.inline-play-active\) \.desktop-board-square::after/,'طبقة قطع المعاينة يجب أن تختفي فور دخول وضع اللعب لمنع تراكب طقمين');
assert.match(previewCss,/width:94%/,'قطع معاينة الرئيسية يجب أن تستخدم نفس عرض قطع اللعب');
assert.match(previewCss,/height:94%/,'قطع معاينة الرئيسية يجب أن تستخدم نفس ارتفاع قطع اللعب');
assert.match(previewCss,/transform:translate\(-50%,-50%\) scale\(var\(--piece-scale,1\)\)/,'قطع المعاينة يجب أن تستخدم نفس طريقة تمركز قطع اللعب');

for(const code of ['wp','wn','wb','wr','wq','wk','bp','bn','bb','br','bq','bk']){
  assert.match(previewCss,new RegExp(`assets/pieces/${code}\\.png`),`معاينة الرئيسية يجب أن تستخدم نفس ملف القطعة ${code}`);
  const playRule=playCss.match(new RegExp(`\\.inline-play-piece\\[src\\$=["']${code}\\.png["']\\]\\{([^}]*)\\}`));
  assert.ok(playRule,`يجب وجود ضبط قطعة اللعب ${code}`);
  for(const variable of ['--piece-left','--piece-top','--piece-scale']){
    const value=playRule[1].match(new RegExp(`${variable}:([^;}]+)`))?.[1]?.trim();
    assert.ok(value,`يجب وجود ${variable} للقطعة ${code}`);
    assert.match(previewCss,new RegExp(`${code}\\.png["']?\\)?[^}]*${variable}:${value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`),`معاينة ${code} يجب أن تطابق ${variable} المستخدم أثناء اللعب`);
  }
}

assert.doesNotMatch(previewCss,/\.desktop-board-square::after\s*\{[\s\S]*?inset:2%/,'يجب إزالة الحجم القديم الأصغر من قطع المعاينة');

console.log('desktop board preview pieces verification passed');
