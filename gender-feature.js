(() => {
  'use strict';
  if (window.__SHATRANJ_GENDER_FEATURE__) return;
  window.__SHATRANJ_GENDER_FEATURE__ = true;

  const fallbackCfg = {
    enabled: true,
    url: 'https://zjxkxhsvltihucdacjrv.supabase.co',
    anonKey: 'sb_publishable_bwFGOiJzT_Xv656pLPR8ww_oJxFzSGJ'
  };
  const cfg = window.SHATRANJ_CONFIG?.supabase || fallbackCfg;
  let clientPromise = null;
  let playScope = 'all';
  let playGender = null;
  let playTimer = null;
  let playStartedAt = 0;
  let adminSearchTimer = null;
  let rankedPlayers = [];

  const $ = (selector, root=document) => root.querySelector(selector);
  const first = (data) => Array.isArray(data) ? (data[0] || null) : data;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const genderLabel = (g) => g === 'male' ? 'ذكر' : g === 'female' ? 'أنثى' : 'غير محدد';

  function getClient(){
    if (clientPromise) return clientPromise;
    clientPromise = (async () => {
      if (!cfg?.enabled || !cfg.url || !cfg.anonKey) throw new Error('Supabase config unavailable');
      if (window.supabase?.createClient) return window.supabase.createClient(cfg.url, cfg.anonKey);
      const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      return mod.createClient(cfg.url, cfg.anonKey);
    })();
    return clientPromise;
  }

  async function rpc(name,args={}){
    const client = await getClient();
    const {data,error} = await client.rpc(name,args);
    if (error) throw error;
    return data;
  }

  function addStyles(){
    if ($('#genderFeatureStyles')) return;
    const style = document.createElement('style');
    style.id = 'genderFeatureStyles';
    style.textContent = `
      .gender-scope-tabs{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
      .gender-scope-tabs button{border:1px solid rgba(212,180,103,.28);background:rgba(255,255,255,.04);color:inherit;border-radius:10px;padding:8px 12px;font:inherit;font-weight:800;cursor:pointer}
      .gender-scope-tabs button.active{background:#d4b467;color:#173536;border-color:#d4b467}
      .gender-scope-tabs button:disabled{opacity:.45;cursor:not-allowed}
      .gender-feature-note{font-size:12px;color:#adc1bc;margin:7px 0 0}
      .gender-completion-card{margin:14px 0;padding:16px;border:1px solid rgba(212,180,103,.3);border-radius:16px;background:rgba(212,180,103,.07)}
      .gender-completion-card h2{margin:0 0 6px;font-size:18px}.gender-completion-card p{margin:0 0 12px;color:#adc1bc}
      .gender-completion-actions{display:flex;gap:8px}.gender-completion-actions button{min-width:110px}
      .admin-gender-tools{margin-top:12px;padding:12px;border:1px solid rgba(216,181,106,.2);border-radius:12px;background:rgba(3,38,43,.3)}
      .admin-gender-tools .admin-gender-row{display:grid;grid-template-columns:140px 1fr auto;gap:8px;align-items:center}
      .admin-gender-tools input,.admin-gender-tools select{min-height:40px;border:1px solid rgba(216,181,106,.27);border-radius:10px;background:#032d32;color:#fff;padding:0 10px}
      .admin-gender-tools button{min-height:40px;border:1px solid rgba(216,181,106,.4);border-radius:10px;background:rgba(216,181,106,.12);color:#f0cc7d;font-weight:800;padding:0 12px}
      .admin-gender-message{min-height:18px;margin-top:7px;font-size:12px;color:#ff9b9b}.admin-gender-message.ok{color:#8be5a7}
      .gender-name-tag{display:inline-block;margin-right:7px;font-size:10px;padding:2px 6px;border-radius:999px;background:rgba(216,181,106,.12);color:#f0cc7d}
      @media(max-width:600px){.admin-gender-tools .admin-gender-row{grid-template-columns:1fr}.gender-completion-actions{display:grid;grid-template-columns:1fr 1fr}.gender-scope-tabs{display:grid;grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  function setIndexMessage(text,type=''){
    const el = $('#authMsg');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'msg ' + type;
  }

  function normalizeSaudiMobile(value){
    const digits = String(value || '').replace(/\D/g,'');
    if (/^05\d{8}$/.test(digits)) return digits;
    if (/^5\d{8}$/.test(digits)) return '0' + digits;
    if (/^9665\d{8}$/.test(digits)) return '0' + digits.slice(3);
    return null;
  }

  function injectIndexControls(){
    const form = $('#signupForm');
    if (form && !$('#signupGender')) {
      const categoryLabel = $('#signupCategory')?.closest('label');
      const label = document.createElement('label');
      label.innerHTML = `<span>الجنس</span><select id="signupGender" required><option value="">اختر</option><option value="male">ذكر</option><option value="female">أنثى</option></select>`;
      form.insertBefore(label, categoryLabel || null);
    }

    const filters = $('#ranking .filters');
    if (filters && !$('#genderFilter')) {
      const select = document.createElement('select');
      select.id = 'genderFilter';
      select.setAttribute('aria-label','تصنيف الرجال والنساء');
      select.innerHTML = '<option value="">الكل</option><option value="male">الرجال</option><option value="female">النساء</option>';
      filters.prepend(select);
    }
  }

  async function handleIndexSignup(event){
    const form = event.target;
    if (form?.id !== 'signupForm') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setIndexMessage('');

    const name = $('#signupName')?.value.trim() || '';
    const username = ($('#signupUsername')?.value || '').trim().toLowerCase();
    const email = ($('#signupEmail')?.value || '').trim().toLowerCase();
    const mobile = normalizeSaudiMobile($('#signupMobile')?.value);
    const password = $('#signupPassword')?.value || '';
    const password2 = $('#signupPassword2')?.value || '';
    const region = $('#signupRegion')?.value || '';
    const city = $('#signupCity')?.value || '';
    const category = $('#signupCategory')?.value || 'open';
    const gender = $('#signupGender')?.value || '';

    if (name.length < 2) return setIndexMessage('اكتب الاسم الظاهر للاعب.','err');
    if (!/^[a-z0-9_]{3,20}$/.test(username)) return setIndexMessage('اسم المستخدم يجب أن يكون من 3 إلى 20 خانة: أحرف إنجليزية أو أرقام أو _ فقط.','err');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setIndexMessage('أدخل بريدًا إلكترونيًا صحيحًا.','err');
    if (!mobile) return setIndexMessage('رقم الجوال يجب أن يكون بصيغة 05xxxxxxxx.','err');
    if (password.length < 8) return setIndexMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل.','err');
    if (password !== password2) return setIndexMessage('كلمتا المرور غير متطابقتين.','err');
    if (!region) return setIndexMessage('اختر المنطقة.','err');
    if (!city) return setIndexMessage('اختر المدينة.','err');
    if (!['male','female'].includes(gender)) return setIndexMessage('اختر ذكر أو أنثى.','err');
    if (!$('#signupTerms')?.checked) return setIndexMessage('وافق على قواعد المنصة أولًا.','err');

    const button = $('#signupBtn');
    if (button) { button.disabled = true; button.textContent = 'جاري إنشاء الحساب...'; }

    try {
      const client = await getClient();
      const {data:available,error:availabilityError} = await client.rpc('is_username_available',{p_username:username});
      if (availabilityError) throw availabilityError;
      if (!available) return setIndexMessage('اسم المستخدم محجوز. اختر اسمًا آخر.','err');

      const profileData = {name,username,mobile,region,city,category,gender};
      sessionStorage.setItem('pending_signup_profile',JSON.stringify(profileData));
      const redirectUrl = location.origin + location.pathname;
      const {data,error} = await client.auth.signUp({email,password,options:{emailRedirectTo:redirectUrl,data:profileData}});
      if (error) throw error;

      if (data.session) {
        const {error:claimError} = await client.rpc('claim_player_profile_v2',{
          p_name:name,p_mobile:mobile,p_region:region,p_city:city,p_category:category,p_gender:gender
        });
        if (claimError) throw claimError;
        sessionStorage.removeItem('pending_signup_profile');
        setIndexMessage('تم إنشاء الحساب وتسجيل الدخول بنجاح.','ok');
        setTimeout(()=>location.reload(),500);
      } else {
        setIndexMessage('تم إنشاء الحساب. افتح بريدك الإلكتروني واضغط رابط التأكيد، ثم عد للموقع وسجّل الدخول.','ok');
        form.reset();
        $('#loginTab')?.click();
      }
    } catch (error) {
      console.error(error);
      const raw = String(error?.message || '');
      if (raw.toLowerCase().includes('already')) setIndexMessage('يوجد حساب بهذه البيانات بالفعل. استخدم تسجيل الدخول.','err');
      else setIndexMessage(raw || 'تعذر إنشاء الحساب.','err');
    } finally {
      if (button) { button.disabled = false; button.textContent = 'إنشاء الحساب'; }
    }
  }

  async function reconcileSignupGender(){
    if (!$('#signupForm')) return;
    try {
      const client = await getClient();
      const {data:{session}} = await client.auth.getSession();
      if (!session) return;
      const meta = session.user?.user_metadata || {};
      const pending = (()=>{ try{return JSON.parse(sessionStorage.getItem('pending_signup_profile')||'null')}catch{return null} })();
      const gender = pending?.gender || meta.gender;
      if (!['male','female'].includes(gender)) return;

      const {data,error} = await client.rpc('get_my_player_profile_v2');
      if (error) throw error;
      const profile = first(data);
      if (profile?.gender) return;
      if (profile?.id) {
        const {error:setError} = await client.rpc('set_my_gender_once',{p_gender:gender});
        if (setError && !String(setError.message).includes('already set')) throw setError;
        return;
      }
      const source = pending || meta;
      if (source.name && source.mobile && source.region && source.city) {
        const {error:claimError} = await client.rpc('claim_player_profile_v2',{
          p_name:source.name,p_mobile:source.mobile,p_region:source.region,p_city:source.city,
          p_category:source.category || 'open',p_gender:gender
        });
        if (claimError) throw claimError;
      }
    } catch (error) { console.warn('gender reconciliation failed',error); }
  }

  const CATEGORY = {open:'مفتوح',u18:'تحت 18',u14:'تحت 14',u10:'تحت 10'};

  function renderIndexRankings(){
    const tbody = $('#tbody');
    if (!tbody) return;
    const region = $('#regionFilter')?.value.trim() || '';
    const city = $('#cityFilter')?.value.trim() || '';
    const rows = rankedPlayers.filter(p => (!region || p.region === region) && (!city || p.city === city));
    tbody.innerHTML = rows.map((p,i)=>`<tr><td>${i+1}</td><td><span class="player-name">${esc(p.name)}</span>${p.username?`<span class="player-username">@${esc(p.username)}</span>`:''}</td><td>${esc(p.region)}</td><td>${esc(p.city)}</td><td><span class="badge">${CATEGORY[p.category]||'مفتوح'}</span></td><td class="rating">${Number(p.rating)||1500}</td></tr>`).join('');
    const results = $('#results'); if (results) results.textContent = rows.length + ' لاعب';
    const empty = $('#empty'); if (empty) empty.style.display = rows.length ? 'none' : 'block';
  }

  async function loadIndexRankings(){
    if (!$('#ranking')) return;
    try {
      rankedPlayers = await rpc('get_public_ranked_players',{p_gender:$('#genderFilter')?.value || null}) || [];
      renderIndexRankings();
    } catch (error) { console.warn('gender rankings unavailable',error); }
  }

  async function initProfileGender(){
    const hero = $('#profileHero');
    if (!hero || $('#genderCompletion')) return;
    try {
      const client = await getClient();
      const {data:{session}} = await client.auth.getSession();
      if (!session) return;
      const {data,error} = await client.rpc('get_my_player_profile_v2');
      if (error) throw error;
      const profile = first(data);
      if (!profile?.id || profile.gender) return;

      const card = document.createElement('section');
      card.id = 'genderCompletion';
      card.className = 'gender-completion-card';
      card.innerHTML = `<h2>إكمال بيانات الحساب</h2><p>اختر الجنس مرة واحدة لاستخدام خيارات البحث والتصنيف المناسبة.</p><div class="gender-completion-actions"><button class="btn" type="button" data-set-gender="male">ذكر</button><button class="btn" type="button" data-set-gender="female">أنثى</button></div><div class="gender-feature-note" id="genderCompletionMessage"></div>`;
      hero.insertAdjacentElement('afterend',card);
    } catch (error) { console.warn(error); }
  }

  async function saveOwnGender(button){
    const gender = button.dataset.setGender;
    if (!['male','female'].includes(gender)) return;
    button.disabled = true;
    const msg = $('#genderCompletionMessage');
    try {
      await rpc('set_my_gender_once',{p_gender:gender});
      if (msg) msg.textContent = 'تم حفظ الاختيار.';
      setTimeout(()=>$('#genderCompletion')?.remove(),450);
    } catch (error) {
      if (msg) msg.textContent = String(error?.message || 'تعذر حفظ الاختيار.');
    } finally { button.disabled = false; }
  }

  function injectPlayScope(){
    const setup = $('#matchmakingSetup');
    const times = setup?.querySelector('.time-options');
    if (!setup || !times || $('#matchGenderScope')) return;
    const wrap = document.createElement('div');
    wrap.id = 'matchGenderScope';
    wrap.innerHTML = `<div class="gender-scope-tabs" aria-label="نطاق البحث عن الخصم"><button class="active" type="button" data-match-scope="all">الجميع</button><button id="sameGenderScope" type="button" data-match-scope="same_gender">نفس الجنس فقط</button></div><p class="gender-feature-note" id="sameGenderNote" hidden>أكمل اختيار الجنس من حسابك لاستخدام هذا الخيار.</p>`;
    times.insertAdjacentElement('beforebegin',wrap);
  }

  async function initPlayGender(){
    if (!$('#matchmakingSetup')) return;
    injectPlayScope();
    try {
      const data = await rpc('get_my_player_profile_v2');
      const profile = first(data);
      playGender = profile?.gender || null;
      const same = $('#sameGenderScope');
      const note = $('#sameGenderNote');
      if (same && !playGender) same.disabled = true;
      if (note) note.hidden = !!playGender;
    } catch (error) { console.warn(error); }
  }

  function setPlayWaiting(waiting){
    const setup=$('#matchmakingSetup'), wait=$('#matchmakingWaiting'), found=$('#matchmakingFound');
    if (setup) setup.hidden = waiting;
    if (wait) wait.hidden = !waiting;
    if (found) found.hidden = true;
  }

  function updatePlayWaiting(row){
    const elapsed = Math.max(0,Number(row?.waited_seconds ?? ((Date.now()-playStartedAt)/1000)));
    const el=$('#matchmakingElapsed'); if(el) el.textContent=String(Math.floor(elapsed/60)).padStart(2,'0')+':'+String(Math.floor(elapsed%60)).padStart(2,'0');
    const range=$('#matchmakingRange'); if(range) range.textContent='±'+Number(row?.rating_window||150);
  }

  async function enterPlayMatch(row){
    if (!row?.game_id || !row?.seat_key || !row?.color) return false;
    sessionStorage.setItem('shatranj_live_game_id',row.game_id);
    sessionStorage.setItem('shatranj_live_game_code',row.game_code||'');
    sessionStorage.setItem('shatranj_live_seat_key',row.seat_key);
    sessionStorage.setItem('shatranj_live_color',row.color);
    sessionStorage.removeItem('shatranj_matchmaking_active');
    sessionStorage.removeItem('shatranj_matchmaking_started_at');
    clearInterval(playTimer);
    const setup=$('#matchmakingSetup'), wait=$('#matchmakingWaiting'), found=$('#matchmakingFound');
    if(setup) setup.hidden=true; if(wait) wait.hidden=true; if(found) found.hidden=false;
    const opp=$('#matchmakingOpponent'); if(opp) opp.textContent=row.opponent_name?`خصمك: ${row.opponent_name}`:'الخصم جاهز — جارٍ فتح المباراة...';
    setTimeout(()=>{location.href=`play.html?game=${encodeURIComponent(row.game_id)}`},850);
    return true;
  }

  async function pollPlayGenderMatch(){
    try {
      const row=first(await rpc('poll_matchmaking'));
      if (!row) return;
      if (row.state==='matched') { await enterPlayMatch(row); return; }
      if (row.state==='waiting') { updatePlayWaiting(row); return; }
      clearInterval(playTimer); playTimer=null; setPlayWaiting(false);
    } catch(error){ const el=$('#matchmakingWaitingError'); if(el) el.textContent='تعذر متابعة البحث. سنحاول من جديد تلقائيًا.'; }
  }

  async function startPlayGenderMatch(minutes){
    const err=$('#matchmakingError'); if(err) err.textContent='';
    const waitErr=$('#matchmakingWaitingError'); if(waitErr) waitErr.textContent='';
    if (playScope==='same_gender' && !playGender) { if(err) err.textContent='أكمل اختيار الجنس من حسابك لاستخدام البحث من نفس الجنس.'; return; }
    setPlayWaiting(true);
    playStartedAt=Date.now();
    sessionStorage.setItem('shatranj_matchmaking_active','1');
    sessionStorage.setItem('shatranj_matchmaking_started_at',String(playStartedAt));
    updatePlayWaiting({waited_seconds:0,rating_window:150});
    try {
      const row=first(await rpc('start_matchmaking_v2',{p_minutes:Number(minutes),p_gender_scope:playScope}));
      if (row?.state==='matched') { await enterPlayMatch(row); return; }
      if (row?.state!=='waiting') throw new Error('unexpected matchmaking state');
      updatePlayWaiting(row);
      clearInterval(playTimer); playTimer=setInterval(pollPlayGenderMatch,1500);
    } catch(error){
      sessionStorage.removeItem('shatranj_matchmaking_active'); clearInterval(playTimer); playTimer=null; setPlayWaiting(false);
      const raw=String(error?.message||'');
      if(err) err.textContent=raw.includes('gender required')?'أكمل اختيار الجنس من حسابك لاستخدام البحث من نفس الجنس.':raw.includes('active game exists')?'لديك مباراة نشطة بالفعل.':'تعذر بدء البحث عن خصم. حاول مرة أخرى.';
    }
  }

  async function cancelPlayGenderMatch(){
    clearInterval(playTimer); playTimer=null;
    sessionStorage.removeItem('shatranj_matchmaking_active'); sessionStorage.removeItem('shatranj_matchmaking_started_at');
    try{await rpc('cancel_matchmaking')}catch{}
    setPlayWaiting(false);
    const e=$('#matchmakingWaitingError'); if(e) e.textContent='';
  }

  function injectAdminFilter(){
    const toolbar=$('#playersView .toolbar');
    if(!toolbar || $('#adminGenderFilter')) return;
    const select=document.createElement('select');
    select.id='adminGenderFilter'; select.className='field';
    select.innerHTML='<option value="">كل الجنسين</option><option value="male">ذكر</option><option value="female">أنثى</option><option value="unset">غير محدد</option>';
    toolbar.appendChild(select);
  }

  async function loadAdminPlayersV2(){
    const body=$('#playersTableBody'); if(!body) return;
    try{
      const rows=await rpc('admin_list_players_v2',{
        p_search:$('#playerSearch')?.value.trim()||null,
        p_status:$('#playerStatusFilter')?.value||null,
        p_city:$('#playerCityFilter')?.value||null,
        p_gender:$('#adminGenderFilter')?.value||null
      })||[];
      body.innerHTML=rows.map(p=>`<tr><td><button class="link-btn" data-player="${esc(p.id)}">${esc(p.name)}</button><span class="gender-name-tag">${genderLabel(p.gender)}</span></td><td>${esc(p.rating)}</td><td>${esc(p.city)}</td><td>${esc(p.games_count)}</td><td>${p.status==='banned'?'<span class="status-pill status-banned">محظور</span>':'<span class="status-pill status-active">نشط</span>'}</td><td>${p.created_at?new Date(p.created_at).toLocaleString('ar-SA',{dateStyle:'medium'}):'—'}</td><td><button class="link-btn" data-player="${esc(p.id)}">فتح</button></td></tr>`).join('')||'<tr><td colspan="7" class="empty">لا توجد بيانات</td></tr>';
    }catch(error){console.warn('admin gender filter failed',error)}
  }

  async function augmentAdminPlayer(playerId){
    try{
      const p=first(await rpc('admin_get_player_v2',{p_player_id:playerId}));
      if(!p) return;
      let tries=0;
      const timer=setInterval(()=>{
        tries++;
        const body=$('#playerModalBody');
        if(!body || $('#adminGenderTools')){if(tries>20||$('#adminGenderTools'))clearInterval(timer);return}
        const grid=body.querySelector('.detail-grid');
        if(!grid){if(tries>20)clearInterval(timer);return}
        clearInterval(timer);
        const item=document.createElement('div'); item.className='detail-item'; item.id='adminGenderDetail'; item.innerHTML=`<small>الجنس</small><strong>${genderLabel(p.gender)}</strong>`; grid.appendChild(item);
        const tools=document.createElement('div'); tools.id='adminGenderTools'; tools.className='admin-gender-tools'; tools.innerHTML=`<div class="admin-gender-row"><select id="adminGenderValue"><option value="male" ${p.gender==='male'?'selected':''}>ذكر</option><option value="female" ${p.gender==='female'?'selected':''}>أنثى</option></select><input id="adminGenderReason" type="text" minlength="3" placeholder="سبب التصحيح"><button type="button" id="adminSaveGender" data-player-id="${esc(p.id)}">حفظ الجنس</button></div><div class="admin-gender-message" id="adminGenderMessage"></div>`; body.appendChild(tools);
      },50);
    }catch(error){console.warn(error)}
  }

  async function saveAdminGender(button){
    const msg=$('#adminGenderMessage'); button.disabled=true;
    try{
      const gender=$('#adminGenderValue')?.value;
      const reason=$('#adminGenderReason')?.value.trim()||'';
      if(reason.length<3){if(msg)msg.textContent='اكتب سبب التصحيح.';return}
      await rpc('admin_set_player_gender',{p_player_id:button.dataset.playerId,p_gender:gender,p_reason:reason});
      const detail=$('#adminGenderDetail strong'); if(detail) detail.textContent=genderLabel(gender);
      if(msg){msg.textContent='تم حفظ التصحيح وتسجيله في سجل الإدارة.';msg.className='admin-gender-message ok'}
      await loadAdminPlayersV2();
    }catch(error){if(msg)msg.textContent=String(error?.message||'تعذر الحفظ')}
    finally{button.disabled=false}
  }

  function relabelAdminActions(){
    $('#actionsTableBody')?.querySelectorAll('td').forEach(td=>{if(td.textContent.trim()==='gender_change')td.textContent='تعديل الجنس'});
  }

  document.addEventListener('submit',(event)=>{
    if(event.target?.id==='signupForm') handleIndexSignup(event);
  },true);

  document.addEventListener('click',(event)=>{
    const scope=event.target.closest?.('[data-match-scope]');
    if(scope){
      event.preventDefault();
      if(scope.disabled)return;
      playScope=scope.dataset.matchScope;
      document.querySelectorAll('[data-match-scope]').forEach(b=>b.classList.toggle('active',b===scope));
      return;
    }
    const time=event.target.closest?.('.time-option[data-minutes]');
    if(time && $('#matchmakingSetup')){
      event.preventDefault(); event.stopImmediatePropagation();
      startPlayGenderMatch(time.dataset.minutes); return;
    }
    const cancel=event.target.closest?.('#cancelMatchmaking');
    if(cancel && $('#matchmakingSetup')){
      event.preventDefault(); event.stopImmediatePropagation(); cancelPlayGenderMatch(); return;
    }
    const ownGender=event.target.closest?.('[data-set-gender]');
    if(ownGender){event.preventDefault();saveOwnGender(ownGender);return}
    const adminSave=event.target.closest?.('#adminSaveGender');
    if(adminSave){event.preventDefault();event.stopPropagation();saveAdminGender(adminSave);return}
    const player=event.target.closest?.('[data-player]');
    if(player && !player.dataset.action && $('#adminApp')) setTimeout(()=>augmentAdminPlayer(player.dataset.player),0);
    const playersNav=event.target.closest?.('[data-view="playersView"]');
    if(playersNav) setTimeout(loadAdminPlayersV2,120);
    const actionsNav=event.target.closest?.('[data-view="actionsView"]');
    if(actionsNav) setTimeout(relabelAdminActions,250);
  },true);

  document.addEventListener('change',(event)=>{
    if(event.target?.id==='genderFilter'){loadIndexRankings();return}
    if(event.target?.id==='regionFilter'||event.target?.id==='cityFilter')setTimeout(renderIndexRankings,0);
    if(event.target?.id==='adminGenderFilter'){event.stopImmediatePropagation();loadAdminPlayersV2();return}
    if(['playerStatusFilter','playerCityFilter'].includes(event.target?.id)&&$('#adminApp')){event.stopImmediatePropagation();loadAdminPlayersV2()}
  },true);

  document.addEventListener('input',(event)=>{
    if(event.target?.id==='playerSearch'&&$('#adminApp')){
      event.stopImmediatePropagation();clearTimeout(adminSearchTimer);adminSearchTimer=setTimeout(loadAdminPlayersV2,250);
    }
  },true);

  function init(){
    addStyles();
    injectIndexControls();
    injectPlayScope();
    injectAdminFilter();
    reconcileSignupGender();
    loadIndexRankings();
    initProfileGender();
    initPlayGender();
    if($('#adminApp')) setTimeout(()=>{injectAdminFilter(); if(!$('#adminApp').hidden)loadAdminPlayersV2()},450);
    setTimeout(()=>{if($('#ranking'))loadIndexRankings();if($('#actionsTableBody'))relabelAdminActions()},900);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
