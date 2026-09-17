import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=(path)=>fs.readFileSync(path,'utf8');
const tune=read('v2/home/desktop-board-shell-tune.mjs');
const inlinePath='v2/home/inline-play.mjs';
const inlineCss=read('v2/home/inline-play.css');

assert.ok(fs.existsSync(inlinePath),'يجب وجود وحدة لعب داخلية للواجهة الرئيسية');
const inline=read(inlinePath);

assert.match(tune,/inline-play\.mjs/,'يجب تحميل وحدة اللعب الداخلي من الواجهة الرئيسية');
assert.match(inline,/data-desktop-nav=["']play["']/,'وحدة اللعب الداخلي يجب أن تعالج زر اللعب في القائمة');
assert.match(inline,/data-tune-action=["']play["']/,'وحدة اللعب الداخلي يجب أن تعالج زر ابدأ اللعب');
assert.match(inline,/homeBoardPreview/,'وحدة اللعب الداخلي يجب أن تستخدم الرقعة الحالية');
assert.match(inline,/preventDefault\(\)/,'الضغط على اللعب يجب أن يمنع الانتقال إلى صفحة أخرى');
assert.match(inline,/setAttribute\(["']href["'],["']#play["']\)/,'يجب تحويل روابط اللعب في الواجهة إلى رابط داخلي');
assert.doesNotMatch(inline,/play-v2\.html\?game=/,'وضع اللعب الداخلي لا يجب أن يغيّر العنوان إلى صفحة اللعب المنفصلة');
assert.match(inlineCss,/\.inline-play-piece\s*\{[\s\S]*?width:94%[\s\S]*?height:94%/,'قطع اللعب داخل الواجهة يجب أن تكون بحجم 94% من المربع');

console.log('home inline play verification passed');
