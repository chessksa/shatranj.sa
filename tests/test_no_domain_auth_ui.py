from pathlib import Path

html = Path('index.html').read_text(encoding='utf-8')
auth_workflow = Path('.github/workflows/apply-supabase-confirmation-email.yml').read_text(encoding='utf-8')

# No-domain mode: Supabase auto-confirms new accounts, so the UI must not promise a confirmation email.
assert '"mailer_autoconfirm": true' in auth_workflow
assert 'يتم تفعيل الحساب مباشرة بعد التسجيل حاليًا، دون رسالة تأكيد بالبريد.' in html
assert 'سيصلك رابط تأكيد على بريدك الإلكتروني لإكمال تفعيل الحساب.' not in html

# Keep the immediate-session success path used when auto-confirm is enabled.
assert 'تم إنشاء الحساب وتسجيل الدخول بنجاح.' in html
assert 'تم إنشاء الحساب. يمكنك الآن تسجيل الدخول باسم المستخدم وكلمة المرور.' in html
assert 'تم إنشاء الحساب. افتح بريدك الإلكتروني واضغط رابط التأكيد، ثم عد للموقع وسجّل الدخول.' not in html
