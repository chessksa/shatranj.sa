import fs from 'node:fs';
import assert from 'node:assert/strict';

const shell=fs.readFileSync('v2/home/desktop-board-shell.mjs','utf8');
const inline=fs.readFileSync('v2/home/inline-play.mjs','utf8');
const authCss=fs.readFileSync('v2/home/desktop-guest-auth.css','utf8');

assert.doesNotMatch(authCss,/desktop-board-preview-pieces\.css/,'معاينة الرقعة لا يجب أن تستخدم طبقة CSS مستقلة للقطع لأنها تتراكب مع قطع اللعب');
assert.doesNotMatch(shell,/desktop-board-hint/,'واجهة الكمبيوتر لا يجب أن تعيد شريط اضغط على الرقعة للعب');
assert.match(shell,/const PREVIEW_STARTING_PIECES=\[/,'يجب تعريف وضع البداية للمعاينة داخل نفس مكوّن الرقعة');
assert.match(shell,/image\.className=['"]inline-play-piece desktop-preview-piece['"]/,'قطع المعاينة يجب أن تستخدم نفس فئة قطع اللعب حرفيًا');
assert.match(shell,/assets\/pieces\/\$\{piece\}\.png/,'قطع المعاينة يجب أن تستخدم نفس ملفات صور قطع اللعب');
assert.match(inline,/function restoreStaticBoard\(\)[\s\S]*?inline-play-piece desktop-preview-piece/,'عند الخروج من اللعب يجب إعادة نفس قطع المعاينة دون طبقة إضافية');
assert.doesNotMatch(inline,/function restoreStaticBoard\(\)[\s\S]*?desktop-board-hint/,'إعادة الرقعة بعد اللعب لا يجب أن تعيد شريط التلميح القديم');

console.log('desktop board preview pieces verification passed');
