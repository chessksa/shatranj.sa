from pathlib import Path

path = Path('index.html')
html = path.read_text(encoding='utf-8')

replacements = [
    (
        '<div class="auth-note">سيصلك رابط تأكيد على بريدك الإلكتروني لإكمال تفعيل الحساب.</div>',
        '<div class="auth-note">يتم تفعيل الحساب مباشرة بعد التسجيل حاليًا، دون رسالة تأكيد بالبريد.</div>',
    ),
    (
        'تم إنشاء الحساب. افتح بريدك الإلكتروني واضغط رابط التأكيد، ثم عد للموقع وسجّل الدخول.',
        'تم إنشاء الحساب. يمكنك الآن تسجيل الدخول باسم المستخدم وكلمة المرور.',
    ),
]

for old, new in replacements:
    if old not in html:
        if new in html:
            continue
        raise SystemExit(f'Expected signup text was not found: {old}')
    html = html.replace(old, new, 1)

path.write_text(html, encoding='utf-8')
