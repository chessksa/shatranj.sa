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

assert.match(
  css,
  /desktop-auth-open #register \.form-card\s*\{[\s\S]*?background:linear-gradient\(145deg,#302e2b,#302e2b\)!important/,
  'نافذة المصادقة على الكمبيوتر يجب أن تستخدم الخلفية الرمادية المتناسقة مع هوية الواجهة'
);

assert.match(
  css,
  /desktop-auth-open #register \.auth-tab\.active\s*\{[\s\S]*?background:linear-gradient\(135deg,#e2dcd3,#e2dcd3\)!important[\s\S]*?color:#302e2b!important/,
  'التبويب النشط يجب أن يكون متناسقًا مع التدرج الرمادي'
);

assert.match(
  css,
  /desktop-auth-open #register input[\s\S]*?background:#302e2b!important[\s\S]*?color:#e2dcd3!important/,
  'حقول المصادقة يجب أن تكون رمادية داكنة ونصها فاتح'
);

assert.match(
  css,
  /desktop-auth-open #register \.btn[\s\S]*?background:linear-gradient\(135deg,#e2dcd3,#e2dcd3\)!important[\s\S]*?color:#302e2b!important/,
  'زر الإجراء الرئيسي في نافذة المصادقة يجب أن يستخدم التدرج الرمادي للواجهة'
);

console.log('desktop guest auth activation verification passed');
