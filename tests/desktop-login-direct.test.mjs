import fs from 'node:fs';
import assert from 'node:assert/strict';

const dashboard=fs.readFileSync('v2/home/dashboard.mjs','utf8');

assert.match(
  dashboard,
  /functions\/v1\/username-login/,
  'تسجيل الدخول في نسخة الكمبيوتر يجب أن يرسل الطلب مباشرة إلى دالة username-login'
);

assert.match(
  dashboard,
  /AbortController/,
  'طلب تسجيل الدخول يجب أن يملك مهلة زمنية حتى لا يبقى عالقًا على جاري الدخول'
);

assert.match(
  dashboard,
  /supabase\.auth\.setSession/,
  'بعد نجاح الطلب يجب حفظ جلسة Supabase'
);

assert.match(
  dashboard,
  /location\.reload\(\)/,
  'بعد نجاح تسجيل الدخول يجب إعادة تحميل الواجهة لتقرأ الجلسة الجديدة'
);

console.log('desktop direct login verification passed');
