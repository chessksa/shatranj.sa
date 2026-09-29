import fs from 'node:fs';
import assert from 'node:assert/strict';

const dashboard=fs.readFileSync('v2/home/dashboard.mjs','utf8');
const css=fs.readFileSync('v2/home/desktop-guest-auth.css','utf8');

assert.match(
  dashboard,
  /function openHomeAuthTab\(tab\)[\s\S]*?document\.body\.classList\.add\(['"]desktop-auth-open['"]\)/,
  'زر تسجيل الدخول/التسجيل في الكمبيوتر يجب أن يفتح واجهة المصادقة بدل محاولة الانتقال إلى قسم مخفي'
);

assert.match(
  css,
  /body\.desktop-board-workspace\.desktop-auth-open #register\s*\{[\s\S]*?display:block!important[\s\S]*?position:fixed!important/,
  'قسم التسجيل المخفي يجب أن يظهر كواجهة ثابتة عند فتح المصادقة على الكمبيوتر'
);

console.log('desktop guest auth activation verification passed');
