import fs from 'node:fs';
import assert from 'node:assert/strict';

const authCss=fs.readFileSync('v2/home/desktop-guest-auth.css','utf8');
const previewCssPath='v2/home/desktop-board-preview-pieces.css';

assert.match(authCss,/desktop-board-preview-pieces\.css/,'يجب تحميل تنسيق قطع معاينة الرقعة في نسخة الكمبيوتر');
assert.ok(fs.existsSync(previewCssPath),'يجب وجود تنسيق مستقل لإظهار قطع وضع البداية على الرقعة الرئيسية');

const previewCss=fs.readFileSync(previewCssPath,'utf8');
assert.match(previewCss,/\.desktop-board-hint\s*\{\s*display:none!important/,'يجب إخفاء شريط اضغط على الرقعة للعب نهائيًا');
for(const code of ['wp','wn','wb','wr','wq','wk','bp','bn','bb','br','bq','bk']){
  assert.match(previewCss,new RegExp(`assets/pieces/${code}\\.png`),`يجب استخدام القطعة المعتمدة ${code} في معاينة الرقعة`);
}
assert.match(previewCss,/nth-child\(49\)/,'يجب وضع بيادق الأبيض في الصف السابع');
assert.match(previewCss,/nth-child\(16\)/,'يجب وضع بيادق الأسود في الصف الثاني');

console.log('desktop board preview pieces verification passed');
