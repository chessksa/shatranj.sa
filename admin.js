import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { ARAB_CITIES_DATA } from './arab-cities.js';

const cfg=window.SHATRANJ_CONFIG?.supabase||{};
const supabase=cfg.enabled&&cfg.url&&cfg.anonKey?createClient(cfg.url,cfg.anonKey):null;
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const first=data=>Array.isArray(data)?(data[0]||null):data;
const fmtDate=value=>value?new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'—';
const countries=Object.keys(ARAB_CITIES_DATA);

const state={
  view:'dashboardView',players:[],allPlayers:[],games:[],reports:[],actions:[],moderators:[],tournaments:[],
  selectedPlayer:null,selectedGame:null,selectedReport:null,selectedTournament:null,pendingAction:null,session:null,access:null
};

const titles={
  dashboardView:['الرئيسية','نظرة سريعة على نشاط الموقع.'],
  playersView:['اللاعبون','إدارة الحسابات والنقاط والحظر.'],
  gamesView:['المباريات','متابعة المباريات وسجل النقلات.'],
  reportsView:['البلاغات','مراجعة بلاغات اللاعبين واتخاذ الإجراء المناسب.'],
  moderatorsView:['المشرفون','إضافة المشرفين وتحديد نطاق الدولة أو المدينة.'],
  tournamentsView:['البطولات','إنشاء وإدارة البطولات العامة أو المحلية.'],
  actionsView:['سجل الإدارة','سجل دائم لكل الإجراءات الإدارية الحساسة.']
};

const actionNames={
  ban:'حظر دائم',unban:'فك الحظر',rating_plus_10:'إضافة 10 نقاط',rating_minus_10:'حسم 10 نقاط',close_report:'إغلاق بلاغ',gender_change:'تعديل الجنس',
  player_create:'إضافة لاعب',player_update:'تعديل لاعب',player_delete:'حذف لاعب',player_ban:'حظر لاعب',player_unban:'فك حظر لاعب',rating_change:'تعديل النقاط',
  moderator_create:'إضافة مشرف',moderator_update:'تعديل مشرف',moderator_remove:'إلغاء مشرف',
  tournament_create:'إنشاء بطولة',tournament_update:'تعديل بطولة',tournament_cancel:'إلغاء بطولة',tournament_start:'بدء بطولة'
};

function isOwner(){return state.access?.role==='owner'}
function showModal(id){const el=$(id);if(el)el.hidden=false}
function hideModal(id){const el=$(id);if(el)el.hidden=true}
function emptyRow(cols,text='لا توجد بيانات'){return `<tr><td colspan="${cols}" class="empty">${esc(text)}</td></tr>`}
function actionLabel(type){return actionNames[type]||type||'—'}
function scopeLabel(row){
  if(row.scope_type==='global')return 'عام';
  if(row.scope_type==='country')return row.country||row.scope_country||'دولة';
  return `${row.city||row.scope_city||'مدينة'} · ${row.country||row.scope_country||''}`;
}
function pill(status){
  const label={active:'نشط',banned:'محظور',open:'مفتوح',closed:'مغلق',finished:'منتهية',waiting:'انتظار',draft:'مسودة',running:'جارية',cancelled:'ملغاة',registered:'مسجل',withdrawn:'منسحب'}[status]||status||'—';
  return `<span class="status-pill status-${esc(status)}">${esc(label)}</span>`;
}

function injectExtendedUi(){
  if($('moderatorsView'))return;
  const style=document.createElement('style');
  style.textContent=`
    .admin-primary{min-height:42px;border:1px solid rgba(216,181,106,.55);background:rgba(216,181,106,.15);color:#f0cc7d;border-radius:11px;padding:0 14px;font-weight:900}
    .admin-danger{min-height:42px;border:1px solid rgba(228,107,107,.5);background:rgba(228,107,107,.12);color:#ffaaaa;border-radius:11px;padding:0 14px;font-weight:900}
    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.form-group{display:grid;gap:6px}.form-group.full{grid-column:1/-1}.form-group label{font-size:12px;color:#bfcac6;font-weight:800}
    .form-actions{display:flex;gap:9px;justify-content:flex-end;margin-top:15px}.owner-note{padding:9px 11px;border:1px solid rgba(216,181,106,.18);border-radius:10px;color:#bfcac6;font-size:12px;margin-bottom:12px}
    .scope-inline{display:flex;gap:6px;flex-wrap:wrap}.table-actions{display:flex;gap:7px;flex-wrap:wrap}.table-actions button{white-space:nowrap}
    @media(max-width:760px){.form-grid{grid-template-columns:1fr}.form-group.full{grid-column:auto}.form-actions{display:grid;grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);

  const nav=document.querySelector('.nav-list');
  const actionsNav=nav?.querySelector('[data-view="actionsView"]');
  if(nav){
    const moderatorBtn=document.createElement('button');
    moderatorBtn.className='nav-btn owner-only';moderatorBtn.dataset.view='moderatorsView';moderatorBtn.innerHTML='♜ المشرفون';
    const tournamentBtn=document.createElement('button');
    tournamentBtn.className='nav-btn';tournamentBtn.dataset.view='tournamentsView';tournamentBtn.innerHTML='♛ البطولات';
    nav.insertBefore(moderatorBtn,actionsNav||null);nav.insertBefore(tournamentBtn,actionsNav||null);
  }

  const playersToolbar=$('playersView')?.querySelector('.toolbar');
  if(playersToolbar){
    const country=document.createElement('select');country.id='playerCountryFilter';country.className='field';country.innerHTML='<option value="">كل الدول</option>';
    countries.forEach(c=>country.insertAdjacentHTML('beforeend',`<option value="${esc(c)}">${esc(c)}</option>`));
    playersToolbar.appendChild(country);
    const add=document.createElement('button');add.id='addPlayerBtn';add.type='button';add.className='admin-primary owner-only';add.textContent='+ إضافة لاعب';playersToolbar.appendChild(add);
  }

  const main=document.querySelector('main.content');
  main?.insertAdjacentHTML('beforeend',`
    <section id="moderatorsView" class="view">
      <div class="toolbar"><button id="addModeratorBtn" class="admin-primary owner-only" type="button">+ إضافة مشرف</button></div>
      <div class="owner-note">إدارة المشرفين متاحة للمالك فقط. يمكن تقييد المشرف بدولة أو مدينة.</div>
      <div class="table-wrap"><table><thead><tr><th>البريد</th><th>الدور</th><th>النطاق</th><th>الحالة</th><th>أضيف</th><th></th></tr></thead><tbody id="moderatorsTableBody"></tbody></table></div>
    </section>
    <section id="tournamentsView" class="view">
      <div class="toolbar"><button id="addTournamentBtn" class="admin-primary" type="button">+ إضافة بطولة</button></div>
      <div class="table-wrap"><table><thead><tr><th>البطولة</th><th>النطاق</th><th>الزمن</th><th>البداية</th><th>الحالة</th><th>المسجلون</th><th></th></tr></thead><tbody id="tournamentsTableBody"></tbody></table></div>
    </section>
  `);

  document.body.insertAdjacentHTML('beforeend',`
    <div id="createPlayerModal" class="modal" hidden><div class="modal-card"><div class="modal-head"><h2>إضافة لاعب</h2><button class="close-btn" data-close="createPlayerModal">×</button></div><div class="modal-body">
      <div class="form-grid">
        <div class="form-group"><label>الاسم</label><input id="newPlayerName" class="field" maxlength="60"></div>
        <div class="form-group"><label>البريد الإلكتروني</label><input id="newPlayerEmail" class="field" type="email"></div>
        <div class="form-group"><label>كلمة المرور الأولية</label><input id="newPlayerPassword" class="field" type="password" minlength="8"></div>
        <div class="form-group"><label>الجوال</label><input id="newPlayerMobile" class="field" placeholder="05xxxxxxxx أو +966..."></div>
        <div class="form-group"><label>الدولة</label><select id="newPlayerCountry" class="field"></select></div>
        <div class="form-group"><label>المدينة</label><select id="newPlayerCity" class="field"></select></div>
        <div class="form-group"><label>الجنس</label><select id="newPlayerGender" class="field"><option value="">غير محدد</option><option value="male">ذكر</option><option value="female">أنثى</option></select></div>
        <div class="form-group"><label>النقاط</label><input id="newPlayerRating" class="field" type="number" min="100" max="5000" value="1500"></div>
      </div>
      <p id="createPlayerMessage" class="modal-msg"></p><div class="form-actions"><button class="action-btn" data-close="createPlayerModal">إلغاء</button><button id="saveNewPlayer" class="admin-primary">إضافة اللاعب</button></div>
    </div></div></div>

    <div id="editPlayerModal" class="modal" hidden><div class="modal-card"><div class="modal-head"><h2>تعديل اللاعب</h2><button class="close-btn" data-close="editPlayerModal">×</button></div><div class="modal-body">
      <div class="form-grid">
        <div class="form-group"><label>الاسم</label><input id="editPlayerName" class="field" maxlength="60"></div>
        <div class="form-group"><label>النقاط</label><input id="editPlayerRating" class="field" type="number" min="100" max="5000"></div>
        <div class="form-group"><label>الدولة</label><select id="editPlayerCountry" class="field"></select></div>
        <div class="form-group"><label>المدينة</label><select id="editPlayerCity" class="field"></select></div>
        <div class="form-group"><label>الجنس</label><select id="editPlayerGender" class="field"><option value="">غير محدد</option><option value="male">ذكر</option><option value="female">أنثى</option></select></div>
        <div class="form-group"><label>الحالة</label><select id="editPlayerStatus" class="field"><option value="active">نشط</option><option value="banned">محظور</option></select></div>
        <div class="form-group full"><label>سبب التعديل</label><textarea id="editPlayerReason" class="reason" placeholder="سبب إداري واضح"></textarea></div>
      </div>
      <p id="editPlayerMessage" class="modal-msg"></p><div class="form-actions"><button class="action-btn" data-close="editPlayerModal">إلغاء</button><button id="savePlayerEdit" class="admin-primary">حفظ التعديلات</button></div>
    </div></div></div>

    <div id="deletePlayerModal" class="modal" hidden><div class="modal-card narrow"><div class="modal-head"><h2>حذف اللاعب نهائيًا</h2><button class="close-btn" data-close="deletePlayerModal">×</button></div><div class="modal-body">
      <div class="owner-note">سيُحذف حساب الدخول وملف اللاعب. هذا الإجراء متاح للمالك فقط ولا يمكن التراجع عنه.</div>
      <textarea id="deletePlayerReason" class="reason" placeholder="سبب الحذف"></textarea>
      <label style="display:flex;gap:8px;align-items:center;margin-top:12px"><input id="deletePlayerConfirm" type="checkbox"> أؤكد حذف اللاعب نهائيًا</label>
      <p id="deletePlayerMessage" class="modal-msg"></p><div class="form-actions"><button class="action-btn" data-close="deletePlayerModal">إلغاء</button><button id="confirmDeletePlayer" class="admin-danger">حذف اللاعب</button></div>
    </div></div></div>

    <div id="moderatorModal" class="modal" hidden><div class="modal-card narrow"><div class="modal-head"><h2>إضافة مشرف</h2><button class="close-btn" data-close="moderatorModal">×</button></div><div class="modal-body">
      <div class="form-grid">
        <div class="form-group full"><label>بريد المستخدم المسجل</label><input id="moderatorEmail" class="field" type="email"></div>
        <div class="form-group full"><label>النطاق</label><select id="moderatorScope" class="field"><option value="global">جميع الدول</option><option value="country">دولة محددة</option><option value="city">مدينة محددة</option></select></div>
        <div id="moderatorCountryGroup" class="form-group" hidden><label>الدولة</label><select id="moderatorCountry" class="field"></select></div>
        <div id="moderatorCityGroup" class="form-group" hidden><label>المدينة</label><select id="moderatorCity" class="field"></select></div>
      </div>
      <p id="moderatorMessage" class="modal-msg"></p><div class="form-actions"><button class="action-btn" data-close="moderatorModal">إلغاء</button><button id="saveModerator" class="admin-primary">إضافة المشرف</button></div>
    </div></div></div>

    <div id="tournamentModal" class="modal" hidden><div class="modal-card"><div class="modal-head"><h2 id="tournamentModalTitle">إضافة بطولة</h2><button class="close-btn" data-close="tournamentModal">×</button></div><div class="modal-body">
      <div class="form-grid">
        <div class="form-group full"><label>اسم البطولة</label><input id="tournamentName" class="field" maxlength="120"></div>
        <div class="form-group"><label>النطاق</label><select id="tournamentScope" class="field"><option value="global">عامة</option><option value="country">حسب الدولة</option><option value="city">حسب المدينة</option></select></div>
        <div class="form-group"><label>زمن المباراة</label><select id="tournamentTime" class="field"><option value="3">3 دقائق</option><option value="5">5 دقائق</option><option value="10" selected>10 دقائق</option><option value="15">15 دقيقة</option></select></div>
        <div id="tournamentCountryGroup" class="form-group" hidden><label>الدولة</label><select id="tournamentCountry" class="field"></select></div>
        <div id="tournamentCityGroup" class="form-group" hidden><label>المدينة</label><select id="tournamentCity" class="field"></select></div>
        <div class="form-group"><label>بداية البطولة</label><input id="tournamentStarts" class="field" type="datetime-local"></div>
        <div class="form-group"><label>عدد المشاركين</label><select id="tournamentCapacityMode" class="field"><option value="fixed">محدد</option><option value="open">مفتوح</option></select></div>
        <div id="tournamentMaxGroup" class="form-group"><label>العدد المحدد</label><input id="tournamentMax" class="field" type="number" min="2" step="1" placeholder="مثال: 16"></div>
        <div class="form-group"><label>فتح التسجيل</label><input id="tournamentRegOpen" class="field" type="datetime-local"></div>
        <div class="form-group"><label>إغلاق التسجيل</label><input id="tournamentRegClose" class="field" type="datetime-local"></div>
        <div class="form-group"><label>الحالة</label><select id="tournamentStatus" class="field"><option value="draft">مسودة</option><option value="open">مفتوحة</option><option value="running">جارية</option><option value="finished">منتهية</option></select></div>
        <div id="tournamentReasonGroup" class="form-group full" hidden><label>سبب التعديل</label><textarea id="tournamentReason" class="reason"></textarea></div>
      </div>
      <p id="tournamentMessage" class="modal-msg"></p><div class="form-actions"><button class="action-btn" data-close="tournamentModal">إلغاء</button><button id="saveTournament" class="admin-primary">حفظ البطولة</button></div>
    </div></div></div>
  `);

  ['newPlayerCountry','editPlayerCountry','moderatorCountry','tournamentCountry'].forEach(id=>fillCountries($(id)));
}

function fillCountries(select,selected=''){
  if(!select)return;
  select.innerHTML='<option value="">اختر الدولة</option>'+countries.map(c=>`<option value="${esc(c)}" ${c===selected?'selected':''}>${esc(c)}</option>`).join('');
}
function fillCities(countrySelect,citySelect,selected=''){
  if(!countrySelect||!citySelect)return;
  const list=ARAB_CITIES_DATA[countrySelect.value]||[];
  citySelect.innerHTML='<option value="">اختر المدينة</option>'+list.map(c=>`<option value="${esc(c)}" ${c===selected?'selected':''}>${esc(c)}</option>`).join('');
}
function setScopeFields(scopeId,countryGroupId,cityGroupId,countryId,cityId){
  const scope=$(scopeId)?.value||'global';
  if($(countryGroupId))$(countryGroupId).hidden=scope==='global';
  if($(cityGroupId))$(cityGroupId).hidden=scope!=='city';
  if(scope==='global'&&$(countryId))$(countryId).value='';
  if(scope!=='city'&&$(cityId))$(cityId).value='';
}
function toLocalInput(value){
  if(!value)return '';
  const d=new Date(value);const offset=d.getTimezoneOffset()*60000;
  return new Date(d.getTime()-offset).toISOString().slice(0,16);
}
function fromLocalInput(value){return value?new Date(value).toISOString():null}

async function rpc(name,args={}){
  const {data,error}=await supabase.rpc(name,args);
  if(error)throw error;
  return data;
}
async function invokeAdmin(body){
  const {data,error}=await supabase.functions.invoke('admin-management',{body});
  if(error)throw error;
  if(!data?.ok){
    const map={owner_access_required:'هذه العملية للمالك فقط.',invalid_email:'البريد غير صحيح.',password_too_short:'كلمة المرور يجب ألا تقل عن 8 أحرف.',invalid_mobile:'رقم الجوال غير صحيح.',email_already_exists:'البريد مسجل مسبقًا.',country_and_city_required:'اختر الدولة والمدينة.'};
    throw new Error(map[data?.error]||data?.error||'تعذر تنفيذ العملية.');
  }
  return data;
}

function setView(id){
  if(id==='moderatorsView'&&!isOwner())id='dashboardView';
  state.view=id;
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  const meta=titles[id]||titles.dashboardView;$('viewTitle').textContent=meta[0];$('viewSubtitle').textContent=meta[1];
  $('adminSidebar')?.classList.remove('open');
  refreshCurrent();
}

async function loadDashboard(){
  const [statsData,players,games,reports]=await Promise.all([
    rpc('admin_dashboard_stats_v2'),rpc('admin_list_players_v3',{p_search:null,p_status:null,p_country:null,p_city:null}),
    rpc('admin_list_games_v2',{p_status:null}),rpc('admin_list_reports_v2',{p_status:'open'})
  ]);
  const s=first(statsData)||{};
  $('totalPlayers').textContent=s.total_players??0;$('activeGames').textContent=s.active_games??0;$('finishedGames').textContent=s.finished_games??0;$('openReports').textContent=s.open_reports??0;
  $('recentPlayers').innerHTML=(players||[]).slice(0,5).map(p=>`<div class="recent-row"><strong>${esc(p.name)}</strong><span>${esc(p.country)} · ${esc(p.city)} · ${esc(p.rating)}</span></div>`).join('')||'<div class="empty">لا يوجد لاعبون</div>';
  $('recentGames').innerHTML=(games||[]).slice(0,5).map(g=>`<div class="recent-row"><strong>${esc(g.white_name)} × ${esc(g.black_name||'—')}</strong><span>${esc(g.time_control_minutes)} د · ${esc(g.status)}</span></div>`).join('')||'<div class="empty">لا توجد مباريات</div>';
  $('recentReports').innerHTML=(reports||[]).slice(0,5).map(r=>`<div class="recent-row"><strong>${esc(r.reporter_name)} ← ${esc(r.reported_name)}</strong><span>${esc(r.game_code)} · ${fmtDate(r.created_at)}</span></div>`).join('')||'<div class="empty">لا توجد بلاغات مفتوحة</div>';
}

function refreshPlayerFilterOptions(){
  const country=$('playerCountryFilter');const city=$('playerCityFilter');if(!country||!city)return;
  const selectedCountry=country.value,selectedCity=city.value;
  const countryValues=[...new Set(state.allPlayers.map(p=>p.country).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ar'));
  country.innerHTML='<option value="">كل الدول</option>'+countryValues.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');country.value=selectedCountry;
  const cities=[...new Set(state.allPlayers.filter(p=>!selectedCountry||p.country===selectedCountry).map(p=>p.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ar'));
  city.innerHTML='<option value="">كل المدن</option>'+cities.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');if(cities.includes(selectedCity))city.value=selectedCity;
}

async function loadPlayers(){
  if(!state.allPlayers.length)state.allPlayers=await rpc('admin_list_players_v3',{p_search:null,p_status:null,p_country:null,p_city:null})||[];
  refreshPlayerFilterOptions();
  const search=$('playerSearch').value.trim()||null,status=$('playerStatusFilter').value||null,country=$('playerCountryFilter')?.value||null,city=$('playerCityFilter').value||null;
  state.players=await rpc('admin_list_players_v3',{p_search:search,p_status:status,p_country:country,p_city:city})||[];
  $('playersTableBody').innerHTML=state.players.map(p=>`<tr><td><button class="link-btn" data-player="${esc(p.id)}">${esc(p.name)}</button></td><td>${esc(p.rating)}</td><td>${esc(p.city)}</td><td>${esc(p.games_count)}</td><td>${pill(p.status)}</td><td>${fmtDate(p.created_at)}</td><td><button class="link-btn" data-player="${esc(p.id)}">فتح</button></td></tr>`).join('')||emptyRow(7);
}

async function openPlayer(id){
  const p=first(await rpc('admin_get_player_v3',{p_player_id:id}));if(!p)return;
  state.selectedPlayer=p;const games=Array.isArray(p.last_games)?p.last_games:[];
  $('playerModalBody').innerHTML=`
    <div class="detail-grid">
      <div class="detail-item"><small>الاسم</small><strong>${esc(p.name)}</strong></div><div class="detail-item"><small>النقاط</small><strong>${esc(p.rating)}</strong></div><div class="detail-item"><small>الحالة</small><strong>${p.status==='banned'?'محظور':'نشط'}</strong></div>
      <div class="detail-item"><small>الدولة</small><strong>${esc(p.country)}</strong></div><div class="detail-item"><small>المدينة</small><strong>${esc(p.city)}</strong></div><div class="detail-item"><small>الجوال</small><strong>${esc(p.mobile)}</strong></div>
      <div class="detail-item"><small>المباريات</small><strong>${esc(p.games_count)}</strong></div><div class="detail-item"><small>فوز</small><strong>${esc(p.wins)}</strong></div><div class="detail-item"><small>تعادل / خسارة</small><strong>${esc(p.draws)} / ${esc(p.losses)}</strong></div>
    </div>
    <div class="action-row">
      <button class="action-btn" data-action="editPlayer">تعديل البيانات والنقاط</button>
      ${p.status==='banned'?'<button class="action-btn ok" data-action="unban">فك الحظر</button>':'<button class="action-btn danger" data-action="ban">حظر اللاعب</button>'}
      ${isOwner()?'<button class="action-btn danger owner-only" data-action="deletePlayer">حذف اللاعب</button>':''}
    </div>
    <h3 class="section-title">آخر المباريات</h3><div class="recent-list">${games.length?games.map(g=>`<div class="recent-row"><strong>${esc(g.white_name)} × ${esc(g.black_name||'—')}</strong><span>${esc(g.result||g.status)} · ${fmtDate(g.created_at)}</span></div>`).join(''):'<div class="empty">لا توجد مباريات</div>'}</div>`;
  showModal('playerModal');
}

function openEditPlayer(){
  const p=state.selectedPlayer;if(!p)return;
  $('editPlayerName').value=p.name||'';$('editPlayerRating').value=p.rating??1500;fillCountries($('editPlayerCountry'),p.country||'');fillCities($('editPlayerCountry'),$('editPlayerCity'),p.city||'');
  $('editPlayerGender').value=p.gender||'';$('editPlayerStatus').value=p.status==='banned'?'banned':'active';$('editPlayerReason').value='';$('editPlayerMessage').textContent='';showModal('editPlayerModal');
}

async function savePlayerEdit(){
  const p=state.selectedPlayer;if(!p)return;const reason=$('editPlayerReason').value.trim();
  if(reason.length<3){$('editPlayerMessage').textContent='اكتب سبب التعديل.';return}
  const button=$('savePlayerEdit');button.disabled=true;$('editPlayerMessage').textContent='جارٍ الحفظ...';
  try{
    await rpc('admin_update_player',{p_player_id:p.id,p_name:$('editPlayerName').value.trim(),p_country:$('editPlayerCountry').value,p_city:$('editPlayerCity').value,p_gender:$('editPlayerGender').value||null,p_status:$('editPlayerStatus').value,p_reason:reason});
    const rating=Number($('editPlayerRating').value);if(rating!==Number(p.rating))await rpc('admin_set_rating',{p_player_id:p.id,p_rating:rating,p_reason:reason});
    state.allPlayers=[];hideModal('editPlayerModal');hideModal('playerModal');await loadPlayers();
  }catch(err){console.error(err);$('editPlayerMessage').textContent=err.message||'تعذر حفظ التعديل.'}finally{button.disabled=false}
}

function openCreatePlayer(){
  ['newPlayerName','newPlayerEmail','newPlayerPassword','newPlayerMobile'].forEach(id=>$(id).value='');$('newPlayerRating').value='1500';$('newPlayerGender').value='';fillCountries($('newPlayerCountry'));fillCities($('newPlayerCountry'),$('newPlayerCity'));$('createPlayerMessage').textContent='';showModal('createPlayerModal');
}
async function saveNewPlayer(){
  const button=$('saveNewPlayer');button.disabled=true;$('createPlayerMessage').textContent='جارٍ إنشاء اللاعب...';
  try{
    await invokeAdmin({action:'create_player',name:$('newPlayerName').value,email:$('newPlayerEmail').value,password:$('newPlayerPassword').value,mobile:$('newPlayerMobile').value,country:$('newPlayerCountry').value,city:$('newPlayerCity').value,gender:$('newPlayerGender').value,rating:Number($('newPlayerRating').value)});
    state.allPlayers=[];hideModal('createPlayerModal');await loadPlayers();
  }catch(err){console.error(err);$('createPlayerMessage').textContent=err.message||'تعذر إضافة اللاعب.'}finally{button.disabled=false}
}

function openDeletePlayer(){
  if(!isOwner()||!state.selectedPlayer)return;$('deletePlayerReason').value='';$('deletePlayerConfirm').checked=false;$('deletePlayerMessage').textContent='';showModal('deletePlayerModal');
}
async function deletePlayer(){
  if(!isOwner()||!state.selectedPlayer)return;
  const reason=$('deletePlayerReason').value.trim();if(reason.length<3){$('deletePlayerMessage').textContent='اكتب سبب الحذف.';return}if(!$('deletePlayerConfirm').checked){$('deletePlayerMessage').textContent='فعّل تأكيد الحذف النهائي.';return}
  const button=$('confirmDeletePlayer');button.disabled=true;$('deletePlayerMessage').textContent='جارٍ حذف اللاعب...';
  try{await invokeAdmin({action:'delete_player',player_id:state.selectedPlayer.id,reason});state.allPlayers=[];hideModal('deletePlayerModal');hideModal('playerModal');await loadPlayers();}
  catch(err){console.error(err);$('deletePlayerMessage').textContent=err.message||'تعذر حذف اللاعب.'}finally{button.disabled=false}
}

async function loadGames(){
  state.games=await rpc('admin_list_games_v2',{p_status:$('gameStatusFilter').value||null})||[];
  $('gamesTableBody').innerHTML=state.games.map(g=>`<tr><td>${esc(g.game_code)}</td><td>${esc(g.white_name)}</td><td>${esc(g.black_name||'—')}</td><td>${esc(g.time_control_minutes)} د</td><td>${pill(g.status)}</td><td>${esc(g.result||'—')}</td><td>${fmtDate(g.created_at)}</td><td><button class="link-btn" data-game="${esc(g.game_id)}">تفاصيل</button></td></tr>`).join('')||emptyRow(8);
}
async function openGame(id){
  const g=first(await rpc('admin_get_game_v2',{p_game_id:id}));if(!g)return;state.selectedGame=g;const moves=Array.isArray(g.moves)?g.moves:[];
  $('gameModalBody').innerHTML=`<div class="detail-grid"><div class="detail-item"><small>الرمز</small><strong>${esc(g.game_code)}</strong></div><div class="detail-item"><small>الزمن</small><strong>${esc(g.time_control_minutes)} دقائق</strong></div><div class="detail-item"><small>الحالة</small><strong>${esc(g.status)}</strong></div><div class="detail-item"><small>الأبيض</small><strong>${esc(g.white_name)} (${esc(g.white_rating??'—')})</strong></div><div class="detail-item"><small>الأسود</small><strong>${esc(g.black_name||'—')} (${esc(g.black_rating??'—')})</strong></div><div class="detail-item"><small>النتيجة</small><strong>${esc(g.result||'—')}</strong></div></div><h3 class="section-title">سجل النقلات</h3><div class="move-list">${moves.length?moves.map((m,i)=>`<span class="move-chip">${i+1}. ${esc(m.san||`${m.from||''}-${m.to||''}`)}</span>`).join(''):'<span class="empty">لا توجد نقلات</span>'}</div>`;
  showModal('gameModal');
}

async function loadReports(){
  state.reports=await rpc('admin_list_reports_v2',{p_status:$('reportStatusFilter').value||null})||[];
  $('reportsTableBody').innerHTML=state.reports.map(r=>`<tr><td>${esc(r.reporter_name)}</td><td>${esc(r.reported_name)}</td><td>${esc(r.game_code)}</td><td>${esc(String(r.reason).slice(0,80))}</td><td>${pill(r.status)}</td><td>${fmtDate(r.created_at)}</td><td><button class="link-btn" data-report="${esc(r.id)}">فتح</button></td></tr>`).join('')||emptyRow(7);
}
async function openReport(id){
  const r=state.reports.find(x=>x.id===id);if(!r)return;state.selectedReport=r;const g=first(await rpc('admin_get_game_v2',{p_game_id:r.game_id}));const moves=Array.isArray(g?.moves)?g.moves:[];
  $('reportDetailBody').innerHTML=`<div class="detail-grid"><div class="detail-item"><small>المبلّغ</small><strong>${esc(r.reporter_name)}</strong></div><div class="detail-item"><small>المبلّغ عنه</small><strong>${esc(r.reported_name)}</strong></div><div class="detail-item"><small>المباراة</small><strong>${esc(r.game_code)}</strong></div><div class="detail-item"><small>الحالة</small><strong>${esc(r.status)}</strong></div><div class="detail-item"><small>التاريخ</small><strong>${fmtDate(r.created_at)}</strong></div><div class="detail-item"><small>النقلات</small><strong>${moves.length}</strong></div></div><h3 class="section-title">سبب البلاغ</h3><div class="detail-item"><strong>${esc(r.reason)}</strong></div><h3 class="section-title">إجراءات</h3><div class="action-row">${r.status==='open'?'<button class="action-btn ok" data-action="closeReport">إغلاق البلاغ</button>':''}<button class="action-btn danger" data-action="banReportPlayer">حظر اللاعب</button></div>`;
  showModal('reportDetailModal');
}

async function loadActions(){
  state.actions=await rpc('admin_list_actions_v2')||[];
  $('actionsTableBody').innerHTML=state.actions.map(a=>`<tr><td>${esc(actionLabel(a.action_type))}</td><td>${esc(a.player_name||a.details?.email||'—')}</td><td>${esc(a.reason)}</td><td>${esc(a.rating_before??'—')}</td><td>${a.rating_delta==null?'—':(a.rating_delta>0?'+':'')+esc(a.rating_delta)}</td><td>${esc(a.rating_after??'—')}</td><td>${esc(a.admin_email||'—')}</td><td>${fmtDate(a.created_at)}</td></tr>`).join('')||emptyRow(8);
}

async function loadModerators(){
  if(!isOwner())return;
  state.moderators=await rpc('admin_list_moderators')||[];
  $('moderatorsTableBody').innerHTML=state.moderators.map(m=>`<tr><td>${esc(m.email||'—')}</td><td>${m.role==='owner'?'المالك':'مشرف'}</td><td>${esc(scopeLabel(m))}</td><td>${m.is_active?pill('active'):'موقوف'}</td><td>${fmtDate(m.created_at)}</td><td>${m.role==='moderator'&&m.is_active?`<button class="link-btn" data-action="removeModerator" data-auth-user="${esc(m.auth_user_id)}">إلغاء الإشراف</button>`:''}</td></tr>`).join('')||emptyRow(6);
}
function openModeratorModal(){
  if(!isOwner())return;$('moderatorEmail').value='';$('moderatorScope').value='global';fillCountries($('moderatorCountry'));fillCities($('moderatorCountry'),$('moderatorCity'));setScopeFields('moderatorScope','moderatorCountryGroup','moderatorCityGroup','moderatorCountry','moderatorCity');$('moderatorMessage').textContent='';showModal('moderatorModal');
}
async function saveModerator(){
  const button=$('saveModerator');button.disabled=true;$('moderatorMessage').textContent='جارٍ إضافة المشرف...';
  try{const scope=$('moderatorScope').value;await rpc('admin_add_moderator',{p_email:$('moderatorEmail').value.trim(),p_scope_type:scope,p_scope_country:scope==='global'?null:$('moderatorCountry').value,p_scope_city:scope==='city'?$('moderatorCity').value:null});hideModal('moderatorModal');await loadModerators();}
  catch(err){console.error(err);$('moderatorMessage').textContent=err.message||'تعذر إضافة المشرف.'}finally{button.disabled=false}
}

function syncTournamentCapacityMode(){
  const mode=$('tournamentCapacityMode')?.value||'fixed';
  const group=$('tournamentMaxGroup');
  const input=$('tournamentMax');
  if(group)group.hidden=mode==='open';
  if(input){input.disabled=mode==='open';input.required=mode==='fixed';if(mode==='open')input.value='';}
}

async function loadTournaments(){
  state.tournaments=await rpc('admin_list_tournaments')||[];
  $('tournamentsTableBody').innerHTML=state.tournaments.map(t=>`<tr><td>${esc(t.name)}</td><td>${esc(scopeLabel(t))}</td><td>${esc(t.time_control)} د</td><td>${fmtDate(t.starts_at)}</td><td>${pill(t.status)}</td><td>${esc(t.registration_count||0)}${t.max_players?' / '+esc(t.max_players):''}</td><td><div class="table-actions"><button class="link-btn" data-action="editTournament" data-tournament="${esc(t.id)}">تعديل</button>${t.status==='open'?`<button class="admin-primary" data-action="startTournament" data-tournament="${esc(t.id)}">ابدأ البطولة الآن</button>`:''}${!['cancelled','finished'].includes(t.status)?`<button class="link-btn" data-action="cancelTournament" data-tournament="${esc(t.id)}">إلغاء</button>`:''}</div></td></tr>`).join('')||emptyRow(7);
}

async function startTournamentNow(tournamentId){
  try{
    await rpc('admin_start_tournament',{p_tournament_id:tournamentId});
    await loadTournaments();
  }catch(err){
    console.error(err);
    const message=String(err?.message||'');
    alert(message.includes('at least two registered players required')?'يلزم تسجيل لاعبين على الأقل لبدء البطولة.':'تعذر بدء البطولة الآن.');
  }
}
function openTournamentModal(t=null){
  state.selectedTournament=t;$('tournamentModalTitle').textContent=t?'تعديل البطولة':'إضافة بطولة';$('tournamentName').value=t?.name||'';$('tournamentScope').value=t?.scope_type||'global';$('tournamentTime').value=t?.time_control||'10';fillCountries($('tournamentCountry'),t?.country||'');fillCities($('tournamentCountry'),$('tournamentCity'),t?.city||'');$('tournamentStarts').value=toLocalInput(t?.starts_at);$('tournamentRegOpen').value=toLocalInput(t?.registration_opens_at);$('tournamentRegClose').value=toLocalInput(t?.registration_closes_at);$('tournamentCapacityMode').value=t?.max_players?'fixed':'open';$('tournamentMax').value=t?.max_players||'';$('tournamentStatus').value=t?.status==='cancelled'?'draft':(t?.status||'draft');$('tournamentReason').value='';$('tournamentReasonGroup').hidden=!t;setScopeFields('tournamentScope','tournamentCountryGroup','tournamentCityGroup','tournamentCountry','tournamentCity');syncTournamentCapacityMode();$('tournamentMessage').textContent='';
  [...$('tournamentStatus').options].forEach(o=>o.disabled=!t&&['running','finished'].includes(o.value));showModal('tournamentModal');
}
async function saveTournament(){
  const t=state.selectedTournament,scope=$('tournamentScope').value,button=$('saveTournament');
  const capacityMode=$('tournamentCapacityMode').value;
  const maxPlayers=capacityMode==='fixed'?Number($('tournamentMax').value):null;
  button.disabled=true;$('tournamentMessage').textContent='جارٍ الحفظ...';
  try{
    if(capacityMode==='fixed'&&(!Number.isInteger(maxPlayers)||maxPlayers<2))throw new Error('حدد عدد المشاركين للبطولة.');
    const common={p_name:$('tournamentName').value.trim(),p_scope_type:scope,p_country:scope==='global'?null:$('tournamentCountry').value,p_city:scope==='city'?$('tournamentCity').value:null,p_time_control:$('tournamentTime').value,p_starts_at:fromLocalInput($('tournamentStarts').value),p_registration_opens_at:fromLocalInput($('tournamentRegOpen').value),p_registration_closes_at:fromLocalInput($('tournamentRegClose').value),p_max_players:capacityMode==='open'?null:maxPlayers,p_status:$('tournamentStatus').value};
    if(t){const reason=$('tournamentReason').value.trim();if(reason.length<3)throw new Error('اكتب سبب التعديل.');await rpc('admin_update_tournament',{p_tournament_id:t.id,...common,p_reason:reason});}
    else await rpc('admin_create_tournament',common);
    hideModal('tournamentModal');await loadTournaments();
  }catch(err){console.error(err);$('tournamentMessage').textContent=err.message||'تعذر حفظ البطولة.'}finally{button.disabled=false}
}

function requestAction(action,payload={}){
  const map={ban:['حظر اللاعب','سيُمنع اللاعب من بدء مباريات جديدة.'],unban:['فك الحظر','سيعود اللاعب قادرًا على اللعب.'],closeReport:['إغلاق البلاغ','سيُغلق البلاغ بعد تسجيل السبب.'],removeModerator:['إلغاء صلاحية المشرف','سيفقد المستخدم صلاحية الدخول إلى لوحة الإدارة.'],cancelTournament:['إلغاء البطولة','ستتحول حالة البطولة إلى ملغاة.']};
  state.pendingAction={action,...payload};$('adminActionTitle').textContent=map[action][0];$('adminActionDescription').textContent=map[action][1];$('adminActionReason').value='';$('adminActionMessage').textContent='';$('adminActionMessage').className='modal-msg';showModal('adminActionModal');setTimeout(()=>$('adminActionReason')?.focus(),0);
}
async function confirmAction(){
  const p=state.pendingAction;if(!p)return;const reason=$('adminActionReason').value.trim();if(reason.length<3){$('adminActionMessage').textContent='اكتب سبب الإجراء.';return}
  const button=$('confirmAdminAction');button.disabled=true;$('adminActionMessage').textContent='جارٍ تنفيذ الإجراء...';
  try{
    if(p.action==='ban')await rpc('admin_ban_player_v2',{p_player_id:p.playerId,p_reason:reason});
    if(p.action==='unban')await rpc('admin_unban_player_v2',{p_player_id:p.playerId,p_reason:reason});
    if(p.action==='closeReport')await rpc('admin_close_report_v2',{p_report_id:p.reportId,p_reason:reason});
    if(p.action==='removeModerator')await rpc('admin_remove_moderator',{p_auth_user_id:p.authUserId,p_reason:reason});
    if(p.action==='cancelTournament')await rpc('admin_cancel_tournament',{p_tournament_id:p.tournamentId,p_reason:reason});
    $('adminActionMessage').textContent='تم تنفيذ الإجراء.';$('adminActionMessage').className='modal-msg ok';state.allPlayers=[];
    setTimeout(async()=>{hideModal('adminActionModal');hideModal('playerModal');hideModal('reportDetailModal');await refreshCurrent();},400);
  }catch(err){console.error(err);$('adminActionMessage').textContent='تعذر تنفيذ الإجراء: '+(err.message||'خطأ غير معروف')}finally{button.disabled=false}
}

async function refreshCurrent(){
  try{
    if(state.view==='dashboardView')await loadDashboard();
    if(state.view==='playersView')await loadPlayers();
    if(state.view==='gamesView')await loadGames();
    if(state.view==='reportsView')await loadReports();
    if(state.view==='moderatorsView')await loadModerators();
    if(state.view==='tournamentsView')await loadTournaments();
    if(state.view==='actionsView')await loadActions();
  }catch(err){console.error(err);alert('تعذر تحميل بيانات لوحة الإدارة: '+(err.message||''))}
}

async function handleRefresh(){
  const button=$('refreshBtn');if(!button||button.disabled)return;
  const original=button.textContent;
  button.disabled=true;button.textContent='↻ جارٍ التحديث...';
  state.allPlayers=[];
  try{await refreshCurrent();button.textContent='✓ تم التحديث';}
  finally{setTimeout(()=>{button.disabled=false;button.textContent=original;},650);}
}

function applyAccessUi(){
  document.querySelectorAll('.owner-only').forEach(el=>el.hidden=!isOwner());
  if(!isOwner()&&state.view==='moderatorsView')setView('dashboardView');
}

function wireEvents(){
  $('mobileMenuBtn')?.addEventListener('click',()=>$('adminSidebar').classList.toggle('open'));
  $('refreshBtn')?.addEventListener('click',handleRefresh);
  $('playerSearch')?.addEventListener('input',()=>{clearTimeout(loadPlayers.t);loadPlayers.t=setTimeout(loadPlayers,250)});
  $('playerStatusFilter')?.addEventListener('change',loadPlayers);$('playerCityFilter')?.addEventListener('change',loadPlayers);$('playerCountryFilter')?.addEventListener('change',()=>{if($('playerCityFilter'))$('playerCityFilter').value='';loadPlayers()});
  $('gameStatusFilter')?.addEventListener('change',loadGames);$('reportStatusFilter')?.addEventListener('change',loadReports);$('confirmAdminAction')?.addEventListener('click',confirmAction);
  $('addPlayerBtn')?.addEventListener('click',openCreatePlayer);$('saveNewPlayer')?.addEventListener('click',saveNewPlayer);$('newPlayerCountry')?.addEventListener('change',()=>fillCities($('newPlayerCountry'),$('newPlayerCity')));
  $('editPlayerCountry')?.addEventListener('change',()=>fillCities($('editPlayerCountry'),$('editPlayerCity')));$('savePlayerEdit')?.addEventListener('click',savePlayerEdit);$('confirmDeletePlayer')?.addEventListener('click',deletePlayer);
  $('addModeratorBtn')?.addEventListener('click',openModeratorModal);$('moderatorScope')?.addEventListener('change',()=>setScopeFields('moderatorScope','moderatorCountryGroup','moderatorCityGroup','moderatorCountry','moderatorCity'));$('moderatorCountry')?.addEventListener('change',()=>fillCities($('moderatorCountry'),$('moderatorCity')));$('saveModerator')?.addEventListener('click',saveModerator);
  $('addTournamentBtn')?.addEventListener('click',()=>openTournamentModal());$('tournamentScope')?.addEventListener('change',()=>setScopeFields('tournamentScope','tournamentCountryGroup','tournamentCityGroup','tournamentCountry','tournamentCity'));$('tournamentCountry')?.addEventListener('change',()=>fillCities($('tournamentCountry'),$('tournamentCity')));$('tournamentCapacityMode')?.addEventListener('change',syncTournamentCapacityMode);$('saveTournament')?.addEventListener('click',saveTournament);

  document.addEventListener('click',e=>{
    const close=e.target.closest('[data-close]');if(close){hideModal(close.dataset.close);return}
    const nav=e.target.closest('.nav-btn[data-view]');if(nav){setView(nav.dataset.view);return}
    const action=e.target.closest('[data-action]');
    if(action){
      const type=action.dataset.action;
      if(type==='editPlayer'){openEditPlayer();return}
      if(type==='deletePlayer'){openDeletePlayer();return}
      if(type==='ban'){requestAction('ban',{playerId:state.selectedPlayer?.id});return}
      if(type==='unban'){requestAction('unban',{playerId:state.selectedPlayer?.id});return}
      if(type==='closeReport'){requestAction('closeReport',{reportId:state.selectedReport?.id});return}
      if(type==='banReportPlayer'){requestAction('ban',{playerId:state.selectedReport?.reported_player_id});return}
      if(type==='removeModerator'){requestAction('removeModerator',{authUserId:action.dataset.authUser});return}
      if(type==='editTournament'){openTournamentModal(state.tournaments.find(t=>t.id===action.dataset.tournament)||null);return}
      if(type==='startTournament'){startTournamentNow(action.dataset.tournament);return}
      if(type==='cancelTournament'){requestAction('cancelTournament',{tournamentId:action.dataset.tournament});return}
    }
    const p=e.target.closest('[data-player]');if(p){openPlayer(p.dataset.player);return}
    const g=e.target.closest('[data-game]');if(g){openGame(g.dataset.game);return}
    const r=e.target.closest('[data-report]');if(r){openReport(r.dataset.report);return}
  });
  document.querySelectorAll('.modal').forEach(modal=>modal.addEventListener('click',e=>{if(e.target===modal)hideModal(modal.id)}));
}

async function init(){
  injectExtendedUi();wireEvents();
  if(!supabase){$('accessMessage').textContent='تعذر الاتصال بخدمة الموقع.';return}
  const {data:{session}}=await supabase.auth.getSession();state.session=session;
  if(!session){location.href='index.html#register';return}
  try{state.access=first(await rpc('admin_get_access'));}catch(err){console.error(err)}
  if(!state.access){$('accessMessage').textContent='ليس لديك صلاحية الدخول إلى لوحة الإدارة.';setTimeout(()=>location.href='index.html',1400);return}
  $('adminIdentity').textContent=`${session.user.email||'إدارة الموقع'} · ${isOwner()?'المالك':'مشرف'}`;applyAccessUi();$('accessGate').hidden=true;$('adminApp').hidden=false;await loadDashboard();
}

init();
