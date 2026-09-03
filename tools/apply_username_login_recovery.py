from pathlib import Path

path = Path('index.html')
html = path.read_text(encoding='utf-8')


def replace_once(old, new, label):
    global html
    if old not in html:
        raise SystemExit(f'{label} not found')
    html = html.replace(old, new, 1)


replace_once(
'''  if(raw.includes('invalid login credentials')){
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }''',
'''  if(raw.includes('invalid login credentials')){
    return 'اسم المستخدم أو كلمة المرور غير صحيحة.';
  }''',
'login error message',
)

login_old = '''        <form id="loginForm" class="auth-form" hidden>
          <label class="full">
            <span>البريد الإلكتروني</span>
            <input id="loginEmail" type="email" required maxlength="160" placeholder="name@example.com" autocomplete="email">
          </label>

          <label class="password-wrap full">
            <span>كلمة المرور</span>
            <input id="loginPassword" type="password" required minlength="8" maxlength="72" autocomplete="current-password">
            <button class="show-pass" type="button" data-target="loginPassword">إظهار</button>
          </label>

          <button class="btn full" type="submit" id="loginBtn">تسجيل الدخول</button>
        </form>'''

login_new = '''        <form id="loginForm" class="auth-form" hidden>
          <label class="full">
            <span>اسم المستخدم</span>
            <input id="loginUsername" required minlength="3" maxlength="20"
                   autocomplete="username" inputmode="latin" dir="ltr"
                   placeholder="مثال: ahmed_99">
          </label>

          <label class="password-wrap full">
            <span>كلمة المرور</span>
            <input id="loginPassword" type="password" required minlength="8" maxlength="72" autocomplete="current-password">
            <button class="show-pass" type="button" data-target="loginPassword">إظهار</button>
          </label>

          <div class="login-help full">
            <button class="text-link" type="button" id="forgotPasswordBtn">نسيت كلمة المرور؟</button>
          </div>

          <button class="btn full" type="submit" id="loginBtn">تسجيل الدخول</button>
        </form>

        <form id="recoveryForm" class="auth-form" hidden>
          <label class="full">
            <span>البريد الإلكتروني للاستعادة</span>
            <input id="recoveryEmail" type="email" required maxlength="160"
                   placeholder="name@example.com" autocomplete="email">
          </label>

          <button class="btn full" type="submit" id="recoveryBtn">إرسال رابط الاستعادة</button>
          <button class="text-link full" type="button" id="backToLoginBtn">العودة لتسجيل الدخول</button>
        </form>'''
replace_once(login_old, login_new, 'login form')

account_anchor = '''        <div id="authMsg" class="msg"></div>
        <div class="auth-note">سيصلك رابط تأكيد على بريدك الإلكتروني لإكمال تفعيل الحساب.</div>
      </div>

      <div id="accountPanel" class="account-panel" hidden>'''

account_insert = '''        <div id="authMsg" class="msg"></div>
        <div class="auth-note">سيصلك رابط تأكيد على بريدك الإلكتروني لإكمال تفعيل الحساب.</div>
      </div>

      <form id="resetPasswordForm" class="auth-form" hidden>
        <h3 class="full reset-password-title">تعيين كلمة مرور جديدة</h3>

        <label class="password-wrap full">
          <span>كلمة المرور الجديدة</span>
          <input id="resetPassword" type="password" required minlength="8" maxlength="72" autocomplete="new-password">
          <button class="show-pass" type="button" data-target="resetPassword">إظهار</button>
        </label>

        <label class="password-wrap full">
          <span>تأكيد كلمة المرور الجديدة</span>
          <input id="resetPassword2" type="password" required minlength="8" maxlength="72" autocomplete="new-password">
          <button class="show-pass" type="button" data-target="resetPassword2">إظهار</button>
        </label>

        <button class="btn full" type="submit" id="resetPasswordBtn">حفظ كلمة المرور</button>
        <div id="resetPasswordMsg" class="msg full"></div>
      </form>

      <div id="accountPanel" class="account-panel" hidden>'''
replace_once(account_anchor, account_insert, 'reset password form anchor')

css_anchor = '''.auth-note{
  margin-top:7px;
  font-size:10px;
  color:#777;
}
'''
css_new = '''.auth-note{
  margin-top:7px;
  font-size:10px;
  color:#777;
}

.login-help{
  display:flex;
  justify-content:flex-start;
  margin-top:-2px;
}

.text-link{
  border:0;
  background:transparent;
  color:var(--green2);
  padding:4px 0;
  font:inherit;
  font-weight:900;
  cursor:pointer;
  text-decoration:underline;
  text-underline-offset:3px;
}

.reset-password-title{
  margin:0 0 4px;
  color:var(--green);
  font-size:18px;
}
'''
replace_once(css_anchor, css_new, 'auth helper css')

replace_once(
'''let usernameAvailability=null;
let usernameCheckTimer=null;''',
'''let usernameAvailability=null;
let usernameCheckTimer=null;
let passwordRecoveryMode=false;''',
'auth state variables',
)

switch_old = '''function switchAuthTab(tab){
  const signup=tab==='signup';

  $('#signupTab').classList.toggle('active',signup);
  $('#loginTab').classList.toggle('active',!signup);
  $('#signupForm').hidden=!signup;
  $('#loginForm').hidden=signup;

  setAuthMsg('');
}'''

switch_new = '''function switchAuthTab(tab){
  const signup=tab==='signup';

  $('#signupTab').classList.toggle('active',signup);
  $('#loginTab').classList.toggle('active',!signup);
  $('#signupForm').hidden=!signup;
  $('#loginForm').hidden=signup;
  $('#recoveryForm').hidden=true;

  setAuthMsg('');
}'''
replace_once(switch_old, switch_new, 'switchAuthTab')

render_old = '''function renderAccount(){
  const loggedIn=!!currentSession;

  $('#guestAuth').hidden=loggedIn;
  $('#accountPanel').hidden=!loggedIn;
'''

render_new = '''function renderAccount(){
  const loggedIn=!!currentSession;

  if(passwordRecoveryMode){
    $('#guestAuth').hidden=true;
    $('#accountPanel').hidden=true;
    $('#resetPasswordForm').hidden=false;
    $('#navAccount').textContent='تغيير كلمة المرور';
    $('#navAccount').href='#register';
    $('#navLogout').hidden=true;
    return;
  }

  $('#resetPasswordForm').hidden=true;
  $('#guestAuth').hidden=loggedIn;
  $('#accountPanel').hidden=!loggedIn;
'''
replace_once(render_old, render_new, 'renderAccount')

login_handler_old = '''/* تسجيل الدخول */
$('#loginForm').addEventListener('submit',async event=>{
  event.preventDefault();
  setAuthMsg('');

  const email=$('#loginEmail').value.trim().toLowerCase();
  const password=$('#loginPassword').value;

  if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)){
    return setAuthMsg('أدخل بريدًا إلكترونيًا صحيحًا.','err');
  }

  if(password.length<8){
    return setAuthMsg('أدخل كلمة المرور.','err');
  }

  const button=$('#loginBtn');
  button.disabled=true;
  button.textContent='جاري الدخول...';

  try{
    const {data,error}=await supabase.auth.signInWithPassword({
      email,
      password
    });

    if(error) throw error;

    currentSession=data.session;
    await refreshAuthUI(data.session);

    setAuthMsg('تم تسجيل الدخول.','ok');
  }catch(error){
    console.error(error);
    setAuthMsg(authErrorMessage(error),'err');
  }finally{
    button.disabled=false;
    button.textContent='تسجيل الدخول';
  }
});'''

login_handler_new = '''/* تسجيل الدخول باسم المستخدم */
$('#loginForm').addEventListener('submit',async event=>{
  event.preventDefault();
  setAuthMsg('');

  const username=$('#loginUsername').value.trim().toLowerCase();
  const password=$('#loginPassword').value;

  if(!/^[a-z0-9_]{3,20}$/.test(username)){
    return setAuthMsg('أدخل اسم مستخدم صحيحًا.','err');
  }

  if(password.length<8){
    return setAuthMsg('أدخل كلمة المرور.','err');
  }

  const button=$('#loginBtn');
  button.disabled=true;
  button.textContent='جاري الدخول...';

  try{
    const {data,error}=await supabase.functions.invoke('username-login',{
      body:{username,password}
    });

    if(error || !data?.access_token || !data?.refresh_token){
      throw new Error('Invalid username or password');
    }

    const {data:sessionData,error:sessionError}=await supabase.auth.setSession({
      access_token:data.access_token,
      refresh_token:data.refresh_token
    });

    if(sessionError || !sessionData.session) throw sessionError||new Error('Invalid username or password');

    currentSession=sessionData.session;
    await refreshAuthUI(sessionData.session);

    setAuthMsg('تم تسجيل الدخول.','ok');
  }catch(error){
    console.error(error);
    setAuthMsg('اسم المستخدم أو كلمة المرور غير صحيحة.','err');
  }finally{
    button.disabled=false;
    button.textContent='تسجيل الدخول';
  }
});

$('#forgotPasswordBtn').addEventListener('click',()=>{
  $('#loginForm').hidden=true;
  $('#recoveryForm').hidden=false;
  setAuthMsg('اكتب البريد المرتبط بالحساب لإرسال رابط الاستعادة.');
});

$('#backToLoginBtn').addEventListener('click',()=>switchAuthTab('login'));

$('#recoveryForm').addEventListener('submit',async event=>{
  event.preventDefault();
  setAuthMsg('');

  const email=$('#recoveryEmail').value.trim().toLowerCase();
  if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)){
    return setAuthMsg('أدخل بريدًا إلكترونيًا صحيحًا.','err');
  }

  const button=$('#recoveryBtn');
  button.disabled=true;
  button.textContent='جاري الإرسال...';

  try{
    const redirectTo=location.origin + location.pathname;
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo});
    if(error) throw error;

    setAuthMsg(
      'إذا كان البريد مرتبطًا بحساب فسيصلك رابط استعادة كلمة المرور.',
      'ok'
    );
  }catch(error){
    console.error(error);
    setAuthMsg('تعذر إرسال رابط الاستعادة الآن. حاول لاحقًا.','err');
  }finally{
    button.disabled=false;
    button.textContent='إرسال رابط الاستعادة';
  }
});

function setResetPasswordMsg(text,type=''){
  const el=$('#resetPasswordMsg');
  el.textContent=text||'';
  el.className='msg full '+type;
}

function showPasswordReset(session){
  passwordRecoveryMode=true;
  currentSession=session||currentSession;
  currentProfile=null;
  setResetPasswordMsg('اختر كلمة مرور جديدة للحساب.');
  renderAccount();
}

$('#resetPasswordForm').addEventListener('submit',async event=>{
  event.preventDefault();
  setResetPasswordMsg('');

  const password=$('#resetPassword').value;
  const password2=$('#resetPassword2').value;

  if(password.length<8){
    return setResetPasswordMsg('كلمة المرور يجب أن تكون 8 أحرف على الأقل.','err');
  }

  if(password!==password2){
    return setResetPasswordMsg('كلمتا المرور غير متطابقتين.','err');
  }

  const button=$('#resetPasswordBtn');
  button.disabled=true;
  button.textContent='جاري الحفظ...';

  try{
    const {error}=await supabase.auth.updateUser({password});
    if(error) throw error;

    passwordRecoveryMode=false;
    $('#resetPasswordForm').reset();
    history.replaceState({},document.title,location.pathname+location.search);
    await supabase.auth.signOut();

    currentSession=null;
    currentProfile=null;
    renderAccount();
    switchAuthTab('login');
    setAuthMsg('تم تغيير كلمة المرور. سجّل الدخول باسم المستخدم.','ok');
  }catch(error){
    console.error(error);
    setResetPasswordMsg('تعذر تغيير كلمة المرور. افتح رابط الاستعادة مرة أخرى.','err');
  }finally{
    button.disabled=false;
    button.textContent='حفظ كلمة المرور';
  }
});'''
replace_once(login_handler_old, login_handler_new, 'login handler')

init_old = '''const {data:{session}}=await supabase.auth.getSession();
await refreshAuthUI(session);

supabase.auth.onAuthStateChange((event,session)=>{
  if(
    event==='SIGNED_IN' ||
    event==='SIGNED_OUT' ||
    event==='TOKEN_REFRESHED'
  ){
    setTimeout(()=>refreshAuthUI(session),0);
  }
});'''

init_new = '''const {data:{session}}=await supabase.auth.getSession();
const recoveryFromUrl=new URLSearchParams(location.hash.replace(/^#/,''))
  .get('type')==='recovery';

if(recoveryFromUrl && session){
  showPasswordReset(session);
}else{
  await refreshAuthUI(session);
}

supabase.auth.onAuthStateChange((event,session)=>{
  if(event==='PASSWORD_RECOVERY'){
    setTimeout(()=>showPasswordReset(session),0);
    return;
  }

  if(
    event==='SIGNED_IN' ||
    event==='SIGNED_OUT' ||
    event==='TOKEN_REFRESHED'
  ){
    setTimeout(()=>refreshAuthUI(session),0);
  }
});'''
replace_once(init_old, init_new, 'auth initialization')

path.write_text(html, encoding='utf-8')

sw_path = Path('sw.js')
sw = sw_path.read_text(encoding='utf-8')
sw = sw.replace('shatranj-saudi-v3', 'shatranj-saudi-v4')
sw_path.write_text(sw, encoding='utf-8')

print('username login and recovery applied')
