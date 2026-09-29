import fs from 'node:fs';
import assert from 'node:assert/strict';

const dashboard=fs.readFileSync('v2/home/dashboard.mjs','utf8');

assert.match(
  dashboard,
  /function closeHomeAuth\(\)\s*\{[\s\S]*?if\(document\.body\.classList\.contains\('desktop-auth-open'\)\)[\s\S]*?classList\.remove\('desktop-auth-open'\)/,
  'إغلاق نافذة الدخول يجب ألا يعيد كتابة class على body إذا كانت desktop-auth-open غير موجودة حتى لا يعيد MutationObserver استدعاء نفسه بلا نهاية'
);

console.log('desktop auth observer loop verification passed');
