from pathlib import Path

js = Path('v2/site/shell.mjs').read_text(encoding='utf-8')

assert "function installDesktopHomeAuth()" in js
assert "window.matchMedia('(min-width:901px)').matches" in js
assert "account.textContent='تسجيل الدخول'" in js
assert "<span>تسجيل</span>" in js
assert "document.getElementById('loginTab')?.click()" in js
assert "document.getElementById('signupTab')?.click()" in js
print('desktop guest auth shell: PASS')
