import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg=window.SHATRANJ_CONFIG?.supabase||{};
const supabase=cfg.enabled&&cfg.url&&cfg.anonKey?createClient(cfg.url,cfg.anonKey):null;
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const first=data=>Array.isArray(data)?(data[0]||null):data;
const fmtDate=value=>value?new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'—';

const state={view:'dashboardView',players:[],games:[],reports:[],actions:[],selectedPlayer:null,selectedGame:null,selectedReport:null,pendingAction:null,session:null};
const titles={
  dashboardView:['الرئيسية','نظرة سريعة على نشاط الموقع.'],
  playersView:['اللاعبون','إدارة الحسابات والحظر وتعديل التصنيف.'],
  gamesView:['المباريات','متابعة المباريات دون التدخل في نتائجها.'],
  reportsView:['البلاغات','مراجعة بلاغات اللاعبين واتخاذ الإجراء المناسب.'],
  actionsView:['سجل الإدارة','سجل دائم لكل الإجراءات الإدارية الحساسة.']
};

function setView(id){
  state.view=id;
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  $('viewTitle').textContent=titles[id][0];$('viewSubtitle').textContent=titles[id][1];
  $('adminSidebar').classList.remove('open');
  refreshCurrent();
}
function pill(status){
  const label={active:'نشط',banned:'محظور',open:'مفتوح',closed:'مغلق',finished:'منتهية',waiting:'انتظار'}[status]||status||'—';
  return `<span class="status-pill status-${esc(status)}">${esc(label)}</span>`;
}
function emptyRow(cols,text='لا توجد بيانات'){return `<tr><td colspan="${cols}" class="empty">${esc(text)}</td></tr>`}
function showModal(id){$(id).hidden=false}
function hideModal(id){$(id).hidden=true}
function actionLabel(type){return ({ban:'حظر دائم',unban:'فك الحظر',rating_plus_10:'إضافة 10 نقاط',rating_minus_10:'حسم 10 نقاط',close_report:'إغلاق بلاغ'})[type]||type}

async function rpc(name,args={}){
  const {data,error}=await supabase.rpc(name,args);
  if(error) throw error;
  return data;
}

async function loadDashboard(){
  const [statsData,players,games,reports]=await Promise.all([
    rpc('admin_dashboard_stats'),
    rpc('admin_list_players',{p_search:null,p_status:null,p_city:null}),
    rpc('admin_list_games',{p_status:null}),
    rpc('admin_list_reports',{p_status:'open'})
  ]);
  const s=first(statsData)||{};
  $('totalPlayers').textContent=s.total_players??0;$('activeGames').textContent=s.active_games??0;$('finishedGames').textContent=s.finished_games??0;$('openReports').textContent=s.open_reports??0;
  $('recentPlayers').innerHTML=(players||[]).slice(0,5).map(p=>`<div class="recent-row"><strong>${esc(p.name)}</strong><span>${esc(p.city)} · ${esc(p.rating)}</span></div>`).join('')||'<div class="empty">لا يوجد لاعبون</div>';
  $('recentGames').innerHTML=(games||[]).slice(0,5).map(g=>`<div class="recent-row"><strong>${esc(g.white_name)} × ${esc(g.black_name||'—')}</strong><span>${esc(g.time_control_minutes)} د · ${esc(g.status)}</span></div>`).join('')||'<div class="empty">لا توجد مباريات</div>';
  $('recentReports').innerHTML=(reports||[]).slice(0,5).map(r=>`<div class="recent-row"><strong>${esc(r.reporter_name)} ← ${esc(r.reported_name)}</strong><span>${esc(r.game_code)} · ${fmtDate(r.created_at)}</span></div>`).join('')||'<div class="empty">لا توجد بلاغات مفتوحة</div>';
}

async function loadPlayers(){
  const search=$('playerSearch').value.trim()||null,status=$('playerStatusFilter').value||null,city=$('playerCityFilter').value||null;
  state.players=await rpc('admin_list_players',{p_search:search,p_status:status,p_city:city})||[];
  $('playersTableBody').innerHTML=state.players.map(p=>`<tr><td><button class="link-btn" data-player="${esc(p.id)}">${esc(p.name)}</button></td><td>${esc(p.rating)}</td><td>${esc(p.city)}</td><td>${esc(p.games_count)}</td><td>${pill(p.status)}</td><td>${fmtDate(p.created_at)}</td><td><button class="link-btn" data-player="${esc(p.id)}">فتح</button></td></tr>`).join('')||emptyRow(7);
  if(!$('playerCityFilter').dataset.loaded){
    const all=await rpc('admin_list_players',{p_search:null,p_status:null,p_city:null})||[];
    [...new Set(all.map(p=>p.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ar')).forEach(city=>{const o=document.createElement('option');o.value=city;o.textContent=city;$('playerCityFilter').appendChild(o)});
    $('playerCityFilter').dataset.loaded='1';
  }
}

async function openPlayer(id){
  const p=first(await rpc('admin_get_player',{p_player_id:id}));
  if(!p)return;
  state.selectedPlayer=p;
  const games=Array.isArray(p.last_games)?p.last_games:[];
  $('playerModalBody').innerHTML=`
    <div class="detail-grid">
      <div class="detail-item"><small>الاسم</small><strong>${esc(p.name)}</strong></div>
      <div class="detail-item"><small>التصنيف</small><strong>${esc(p.rating)}</strong></div>
      <div class="detail-item"><small>الحالة</small><strong>${p.status==='banned'?'محظور':'نشط'}</strong></div>
      <div class="detail-item"><small>المدينة</small><strong>${esc(p.city)}</strong></div>
      <div class="detail-item"><small>المنطقة</small><strong>${esc(p.region)}</strong></div>
      <div class="detail-item"><small>المباريات</small><strong>${esc(p.games_count)}</strong></div>
      <div class="detail-item"><small>فوز</small><strong>${esc(p.wins)}</strong></div>
      <div class="detail-item"><small>تعادل</small><strong>${esc(p.draws)}</strong></div>
      <div class="detail-item"><small>خسارة</small><strong>${esc(p.losses)}</strong></div>
    </div>
    <div class="action-row">
      ${p.status==='banned'?`<button class="action-btn ok" data-action="unban" data-player="${esc(p.id)}">فك الحظر</button>`:`<button class="action-btn danger" data-action="ban" data-player="${esc(p.id)}">حظر دائم</button>`}
      <button class="action-btn" data-action="plus10" data-player="${esc(p.id)}">+10 نقاط</button>
      <button class="action-btn" data-action="minus10" data-player="${esc(p.id)}">-10 نقاط</button>
    </div>
    <h3 class="section-title">آخر المباريات</h3>
    <div class="recent-list">${games.length?games.map(g=>`<div class="recent-row"><strong>${esc(g.white_name)} × ${esc(g.black_name||'—')}</strong><span>${esc(g.result||g.status)} · ${fmtDate(g.created_at)}</span></div>`).join(''):'<div class="empty">لا توجد مباريات</div>'}</div>`;
  showModal('playerModal');
}

async function loadGames(){
  const status=$('gameStatusFilter').value||null;
  state.games=await rpc('admin_list_games',{p_status:status})||[];
  $('gamesTableBody').innerHTML=state.games.map(g=>`<tr><td>${esc(g.game_code)}</td><td>${esc(g.white_name)}</td><td>${esc(g.black_name||'—')}</td><td>${esc(g.time_control_minutes)} د</td><td>${pill(g.status)}</td><td>${esc(g.result||'—')}</td><td>${fmtDate(g.created_at)}</td><td><button class="link-btn" data-game="${esc(g.game_id)}">تفاصيل</button></td></tr>`).join('')||emptyRow(8);
}

async function openGame(id){
  const g=first(await rpc('admin_get_game',{p_game_id:id}));if(!g)return;state.selectedGame=g;
  const moves=Array.isArray(g.moves)?g.moves:[];
  $('gameModalBody').innerHTML=`<div class="detail-grid">
    <div class="detail-item"><small>الرمز</small><strong>${esc(g.game_code)}</strong></div><div class="detail-item"><small>الزمن</small><strong>${esc(g.time_control_minutes)} دقائق</strong></div><div class="detail-item"><small>الحالة</small><strong>${esc(g.status)}</strong></div>
    <div class="detail-item"><small>الأبيض</small><strong>${esc(g.white_name)} (${esc(g.white_rating??'—')})</strong></div><div class="detail-item"><small>الأسود</small><strong>${esc(g.black_name||'—')} (${esc(g.black_rating??'—')})</strong></div><div class="detail-item"><small>النتيجة</small><strong>${esc(g.result||'—')}</strong></div>
    <div class="detail-item"><small>بدأت</small><strong>${fmtDate(g.created_at)}</strong></div><div class="detail-item"><small>آخر تحديث</small><strong>${fmtDate(g.updated_at)}</strong></div><div class="detail-item"><small>عدد النقلات</small><strong>${moves.length}</strong></div>
  </div><h3 class="section-title">سجل النقلات</h3><div class="move-list">${moves.length?moves.map((m,i)=>`<span class="move-chip">${i+1}. ${esc(m.san||`${m.from||''}-${m.to||''}`)}</span>`).join(''):'<span class="empty">لا توجد نقلات</span>'}</div>`;
  showModal('gameModal');
}

async function loadReports(){
  const status=$('reportStatusFilter').value||null;
  state.reports=await rpc('admin_list_reports',{p_status:status})||[];
  $('reportsTableBody').innerHTML=state.reports.map(r=>`<tr><td>${esc(r.reporter_name)}</td><td>${esc(r.reported_name)}</td><td>${esc(r.game_code)}</td><td>${esc(String(r.reason).slice(0,80))}</td><td>${pill(r.status)}</td><td>${fmtDate(r.created_at)}</td><td><button class="link-btn" data-report="${esc(r.id)}">فتح</button></td></tr>`).join('')||emptyRow(7);
}

async function openReport(id){
  const r=state.reports.find(x=>x.id===id) || (await rpc('admin_list_reports',{p_status:null})||[]).find(x=>x.id===id);if(!r)return;state.selectedReport=r;
  const g=first(await rpc('admin_get_game',{p_game_id:r.game_id}));const moves=Array.isArray(g?.moves)?g.moves:[];
  $('reportDetailBody').innerHTML=`<div class="detail-grid"><div class="detail-item"><small>المبلّغ</small><strong>${esc(r.reporter_name)}</strong></div><div class="detail-item"><small>المبلّغ عنه</small><strong>${esc(r.reported_name)}</strong></div><div class="detail-item"><small>المباراة</small><strong>${esc(r.game_code)}</strong></div><div class="detail-item"><small>الحالة</small><strong>${esc(r.status)}</strong></div><div class="detail-item"><small>التاريخ</small><strong>${fmtDate(r.created_at)}</strong></div><div class="detail-item"><small>النقلات</small><strong>${moves.length}</strong></div></div><h3 class="section-title">سبب البلاغ</h3><div class="detail-item"><strong>${esc(r.reason)}</strong></div><h3 class="section-title">إجراءات</h3><div class="action-row">${r.status==='open'?`<button class="action-btn ok" data-action="closeReport" data-report="${esc(r.id)}">إغلاق البلاغ</button>`:''}<button class="action-btn danger" data-action="ban" data-player="${esc(r.reported_player_id)}">حظر دائم</button><button class="action-btn" data-action="plus10" data-player="${esc(r.reported_player_id)}">+10 نقاط</button><button class="action-btn" data-action="minus10" data-player="${esc(r.reported_player_id)}">-10 نقاط</button></div><h3 class="section-title">نقلات المباراة</h3><div class="move-list">${moves.length?moves.map((m,i)=>`<span class="move-chip">${i+1}. ${esc(m.san||`${m.from||''}-${m.to||''}`)}</span>`).join(''):'<span class="empty">لا توجد نقلات</span>'}</div>`;
  showModal('reportDetailModal');
}

async function loadActions(){
  state.actions=await rpc('admin_list_actions')||[];
  $('actionsTableBody').innerHTML=state.actions.map(a=>`<tr><td>${esc(actionLabel(a.action_type))}</td><td>${esc(a.player_name||'—')}</td><td>${esc(a.reason)}</td><td>${esc(a.rating_before??'—')}</td><td>${a.rating_delta==null?'—':(a.rating_delta>0?'+':'')+esc(a.rating_delta)}</td><td>${esc(a.rating_after??'—')}</td><td>${esc(a.admin_email||'—')}</td><td>${fmtDate(a.created_at)}</td></tr>`).join('')||emptyRow(8);
}

function requestAction(action,playerId=null,reportId=null){
  const map={ban:['حظر اللاعب دائمًا','سيُمنع اللاعب من بدء مباريات جديدة.'],unban:['فك الحظر','سيعود اللاعب قادرًا على اللعب.'],plus10:['إضافة 10 نقاط','سيُضاف 10 نقاط فقط إلى التصنيف.'],minus10:['حسم 10 نقاط','سيُحسم 10 نقاط فقط من التصنيف.'],closeReport:['إغلاق البلاغ','سيُغلق البلاغ بدون تعديل نتيجة المباراة.']};
  state.pendingAction={action,playerId,reportId};$('adminActionTitle').textContent=map[action][0];$('adminActionDescription').textContent=map[action][1];$('adminActionReason').value='';$('adminActionMessage').textContent='';$('adminActionMessage').className='modal-msg';showModal('adminActionModal');setTimeout(()=>$('adminActionReason').focus(),0);
}

async function confirmAction(){
  const pending=state.pendingAction;if(!pending)return;const reason=$('adminActionReason').value.trim();if(reason.length<3){$('adminActionMessage').textContent='اكتب سبب الإجراء.';return}
  $('confirmAdminAction').disabled=true;$('adminActionMessage').textContent='جارٍ تنفيذ الإجراء...';
  try{
    if(pending.action==='ban') await rpc('admin_ban_player',{p_player_id:pending.playerId,p_reason:reason});
    if(pending.action==='unban') await rpc('admin_unban_player',{p_player_id:pending.playerId,p_reason:reason});
    if(pending.action==='plus10') await rpc('admin_adjust_rating',{p_player_id:pending.playerId,p_delta:10,p_reason:reason});
    if(pending.action==='minus10') await rpc('admin_adjust_rating',{p_player_id:pending.playerId,p_delta:-10,p_reason:reason});
    if(pending.action==='closeReport') await rpc('admin_close_report',{p_report_id:pending.reportId,p_reason:reason});
    $('adminActionMessage').textContent='تم تنفيذ الإجراء.';$('adminActionMessage').className='modal-msg ok';
    setTimeout(async()=>{hideModal('adminActionModal');hideModal('playerModal');hideModal('reportDetailModal');await refreshCurrent();},550);
  }catch(err){console.error(err);$('adminActionMessage').textContent='تعذر تنفيذ الإجراء: '+(err.message||'خطأ غير معروف')}
  finally{$('confirmAdminAction').disabled=false}
}

async function refreshCurrent(){
  try{
    if(state.view==='dashboardView')await loadDashboard();
    if(state.view==='playersView')await loadPlayers();
    if(state.view==='gamesView')await loadGames();
    if(state.view==='reportsView')await loadReports();
    if(state.view==='actionsView')await loadActions();
  }catch(err){console.error(err);alert('تعذر تحميل بيانات لوحة الإدارة.')}
}

async function init(){
  if(!supabase){$('accessMessage').textContent='تعذر الاتصال بخدمة الموقع.';return}
  const {data:{session}}=await supabase.auth.getSession();state.session=session;
  if(!session){location.href='index.html#register';return}
  const allowed=first(await rpc('is_admin'));
  if(!allowed){$('accessMessage').textContent='ليس لديك صلاحية الدخول إلى لوحة الإدارة.';setTimeout(()=>location.href='index.html',1400);return}
  $('adminIdentity').textContent=session.user.email||'مدير الموقع';$('accessGate').hidden=true;$('adminApp').hidden=false;await loadDashboard();
}

document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>setView(btn.dataset.view)));
document.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',()=>hideModal(btn.dataset.close)));
$('mobileMenuBtn').addEventListener('click',()=>$('adminSidebar').classList.toggle('open'));
$('refreshBtn').addEventListener('click',refreshCurrent);
$('playerSearch').addEventListener('input',()=>{clearTimeout(loadPlayers.t);loadPlayers.t=setTimeout(loadPlayers,250)});
$('playerStatusFilter').addEventListener('change',loadPlayers);$('playerCityFilter').addEventListener('change',loadPlayers);$('gameStatusFilter').addEventListener('change',loadGames);$('reportStatusFilter').addEventListener('change',loadReports);$('confirmAdminAction').addEventListener('click',confirmAction);

document.addEventListener('click',e=>{
  const p=e.target.closest('[data-player]');if(p&&!p.dataset.action){openPlayer(p.dataset.player);return}
  const g=e.target.closest('[data-game]');if(g){openGame(g.dataset.game);return}
  const r=e.target.closest('[data-report]');if(r&&!r.dataset.action){openReport(r.dataset.report);return}
  const a=e.target.closest('[data-action]');if(a){requestAction(a.dataset.action,a.dataset.player||null,a.dataset.report||null)}
});

document.querySelectorAll('.modal').forEach(modal=>modal.addEventListener('click',e=>{if(e.target===modal)hideModal(modal.id)}));
init();
