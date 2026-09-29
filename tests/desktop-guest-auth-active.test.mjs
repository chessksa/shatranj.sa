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
  /desktop-auth-open #register \.form-card\s*\{[\s\S]*?background:linear-gradient\(145deg,#073f43,#032f33\)!important/,
  'نافذة المصادقة على الكمبيوتر يجب أن تستخدم الخلفية البترولية الخاصة بالواجهة'
);

assert.match(
  css,
  /desktop-auth-open #register \.auth-tab\.active\s*\{[\s\S]*?background:linear-gradient\(135deg,#efca72,#d9aa4f\)!important[\s\S]*?color:#173536!important/,
  'التبويب النشط يجب أن يكون ذهبيًا بنفس هوية الواجهة'
);

assert.match(
  css,
  /desktop-auth-open #register input[\s\S]*?background:#062f33!important[\s\S]*?color:#f4efe6!important/,
  'حقول المصادقة يجب أن تكون بترولية داكنة ونصها سكري'
);

assert.match(
  css,
  /desktop-auth-open #register \.btn[\s\S]*?background:linear-gradient\(135deg,#efca72,#d9aa4f\)!important[\s\S]*?color:#173536!important/,
  'زر الإجراء الرئيسي في نافذة المصادقة يجب أن يستخدم اللون الذهبي للواجهة'
);

console.log('desktop guest auth activation verification passed');
