from pathlib import Path

html = Path('index.html').read_text(encoding='utf-8')
edge_path = Path('supabase/functions/username-login/index.ts')

# Login uses username, never asks for email.
assert 'id="loginUsername"' in html
assert '<span>اسم المستخدم</span>' in html
assert 'id="loginEmail"' not in html
assert "supabase.functions.invoke('username-login'" in html
assert "supabase.auth.setSession" in html
assert 'اسم المستخدم أو كلمة المرور غير صحيحة.' in html

# Recovery starts from email and supports choosing a new password after the recovery link.
assert 'id="forgotPasswordBtn"' in html
assert 'id="recoveryEmail"' in html
assert 'id="resetPasswordForm"' in html
assert "supabase.auth.resetPasswordForEmail" in html
assert "event==='PASSWORD_RECOVERY'" in html
assert "supabase.auth.updateUser({password" in html

# The server-side username login function must exist and keep lookup details private.
assert edge_path.exists(), 'username-login Edge Function is missing'
edge = edge_path.read_text(encoding='utf-8')
assert "username_registry" in edge
assert "SUPABASE_SERVICE_ROLE_KEY" in edge
assert "signInWithPassword" in edge
assert "Invalid username or password" in edge
assert "email:" not in edge.split('return new Response(JSON.stringify({', 1)[-1]
