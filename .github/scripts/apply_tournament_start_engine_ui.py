from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing patch marker: {label}')
    return text.replace(old, new, 1)

# --- Admin UI ---
admin_path = ROOT / 'admin.js'
admin = admin_path.read_text(encoding='utf-8')
admin = replace_once(
    admin,
    "tournament_create:'إنشاء بطولة',tournament_update:'تعديل بطولة',tournament_cancel:'إلغاء بطولة'",
    "tournament_create:'إنشاء بطولة',tournament_update:'تعديل بطولة',tournament_cancel:'إلغاء بطولة',tournament_start:'بدء بطولة'",
    'admin action label',
)
old_load = """async function loadTournaments(){
  state.tournaments=await rpc('admin_list_tournaments')||[];
  $('tournamentsTableBody').innerHTML=state.tournaments.map(t=>`<tr><td>${esc(t.name)}</td><td>${esc(scopeLabel(t))}</td><td>${esc(t.time_control)} د</td><td>${fmtDate(t.starts_at)}</td><td>${pill(t.status)}</td><td>${esc(t.registration_count||0)}${t.max_players?' / '+esc(t.max_players):''}</td><td><div class=\"table-actions\"><button class=\"link-btn\" data-action=\"editTournament\" data-tournament=\"${esc(t.id)}\">تعديل</button>${!['cancelled','finished'].includes(t.status)?`<button class=\"link-btn\" data-action=\"cancelTournament\" data-tournament=\"${esc(t.id)}\">إلغاء</button>`:''}</div></td></tr>`).join('')||emptyRow(7);
}
"""
new_load = """async function loadTournaments(){
  state.tournaments=await rpc('admin_list_tournaments')||[];
  $('tournamentsTableBody').innerHTML=state.tournaments.map(t=>`<tr><td>${esc(t.name)}</td><td>${esc(scopeLabel(t))}</td><td>${esc(t.time_control)} د</td><td>${fmtDate(t.starts_at)}</td><td>${pill(t.status)}</td><td>${esc(t.registration_count||0)}${t.max_players?' / '+esc(t.max_players):''}</td><td><div class=\"table-actions\"><button class=\"link-btn\" data-action=\"editTournament\" data-tournament=\"${esc(t.id)}\">تعديل</button>${t.status==='open'?`<button class=\"admin-primary\" data-action=\"startTournament\" data-tournament=\"${esc(t.id)}\">ابدأ البطولة الآن</button>`:''}${!['cancelled','finished'].includes(t.status)?`<button class=\"link-btn\" data-action=\"cancelTournament\" data-tournament=\"${esc(t.id)}\">إلغاء</button>`:''}</div></td></tr>`).join('')||emptyRow(7);
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
"""
admin = replace_once(admin, old_load, new_load, 'admin tournament table/start function')
admin = replace_once(
    admin,
    "if(type==='editTournament'){openTournamentModal(state.tournaments.find(t=>t.id===action.dataset.tournament)||null);return}\n      if(type==='cancelTournament'){requestAction('cancelTournament',{tournamentId:action.dataset.tournament});return}",
    "if(type==='editTournament'){openTournamentModal(state.tournaments.find(t=>t.id===action.dataset.tournament)||null);return}\n      if(type==='startTournament'){startTournamentNow(action.dataset.tournament);return}\n      if(type==='cancelTournament'){requestAction('cancelTournament',{tournamentId:action.dataset.tournament});return}",
    'admin start click handler',
)
admin_path.write_text(admin, encoding='utf-8')

# --- Public tournament UI ---
page_path = ROOT / 'tournaments.html'
page = page_path.read_text(encoding='utf-8')
page = replace_once(
    page,
    ".register-btn.registered{background:#b9c7c2;color:#163537;opacity:1}\n@media(max-width:700px)",
    ".register-btn.registered{background:#b9c7c2;color:#163537;opacity:1}\n.bracket-shell{margin-top:18px;padding-top:18px;border-top:1px solid rgba(216,182,101,.18)}.bracket-title{margin:0 0 12px;color:var(--hero-gold);font-size:18px}.bracket-round{margin-top:13px}.bracket-round-title{margin:0 0 7px;color:#d9c58f;font-size:12px;font-weight:900}.bracket-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.bracket-match{padding:11px 12px;border:1px solid rgba(216,182,101,.18);border-radius:12px;background:rgba(3,38,40,.33)}.bracket-match.mine{border-color:rgba(239,207,124,.68);box-shadow:inset 0 0 0 1px rgba(239,207,124,.12)}.bracket-player{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:25px;font-size:13px;font-weight:800}.bracket-player+.bracket-player{border-top:1px solid rgba(216,182,101,.12)}.bracket-player.winner{color:#a7e7bd}.bracket-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;color:var(--hero-muted);font-size:10px}.tournament-enter-btn{min-height:36px;min-width:112px;font-size:12px}.bracket-empty{padding:14px;border:1px dashed rgba(216,182,101,.25);border-radius:11px;color:var(--hero-muted);font-size:12px;text-align:center}\n@media(max-width:700px)",
    'bracket styles',
)
page = replace_once(
    page,
    ".detail-grid{grid-template-columns:1fr}.detail-register{justify-content:stretch}.register-btn{width:100%}}",
    ".detail-grid{grid-template-columns:1fr}.detail-register{justify-content:stretch}.register-btn{width:100%}.bracket-grid{grid-template-columns:1fr}.tournament-enter-btn{width:auto}}",
    'mobile bracket styles',
)
page = replace_once(
    page,
    "let selectedTournamentId=null;",
    "let selectedTournamentId=null;\nlet tournamentMatchPollTimer=null;",
    'public poll state',
)
old_detail = """    </div>
    <div class=\"detail-register\">${registrationControl(row)}</div>`;
}

function openTournamentDetail(tournamentId){const row=tournaments.find(item=>String(item.id)===String(tournamentId));if(!row)return;selectedTournamentId=String(row.id);setRegistrationMessage('');renderTournamentDetail(row);listView.hidden=true;detailView.hidden=false}
"""
new_detail = """    </div>
    <div class=\"detail-register\">${registrationControl(row)}</div>
    <section class=\"bracket-shell\" aria-label=\"مواجهات البطولة\"><h3 class=\"bracket-title\">مواجهات البطولة</h3><div id=\"tournamentBracket\" class=\"bracket-empty\">${['running','finished'].includes(row.status)?'جاري تحميل المواجهات...':'تظهر المواجهات بعد بدء البطولة.'}</div></section>`;
}

function firstRow(data){return Array.isArray(data)?(data[0]||null):data}
function bracketStatusLabel(value){return ({pending:'بانتظار اللاعبين',active:'جارية',finished:'انتهت',bye:'تأهل مباشر'})[value]||value||'—'}
function roundLabel(round,maxRound){if(round===maxRound)return 'النهائي';if(round===maxRound-1)return 'نصف النهائي';if(round===maxRound-2)return 'ربع النهائي';return `الدور ${round}`}

async function loadTournamentBracket(tournamentId){
  const host=document.getElementById('tournamentBracket');
  if(!host)return;
  const tournament=tournaments.find(item=>String(item.id)===String(tournamentId));
  if(!tournament||!['running','finished'].includes(tournament.status)){host.className='bracket-empty';host.textContent='تظهر المواجهات بعد بدء البطولة.';return}
  try{
    const {data,error}=await supabase.rpc('get_tournament_bracket',{p_tournament_id:tournamentId});
    if(error)throw error;
    const rows=Array.isArray(data)?data:[];
    if(!rows.length){host.className='bracket-empty';host.textContent='لم تُنشأ المواجهات بعد.';return}
    const maxRound=Math.max(...rows.map(row=>Number(row.round_no)||1));
    const groups=new Map();
    rows.forEach(row=>{const round=Number(row.round_no)||1;if(!groups.has(round))groups.set(round,[]);groups.get(round).push(row)});
    host.className='';
    host.innerHTML=[...groups.entries()].map(([round,matches])=>`<section class=\"bracket-round\"><h4 class=\"bracket-round-title\">${esc(roundLabel(round,maxRound))}</h4><div class=\"bracket-grid\">${matches.map(match=>{const canEnter=Boolean(match.is_my_match&&match.player_one_id&&match.player_two_id&&['pending','active'].includes(match.match_status));const retry=Number(match.attempt_no||1)>1?` · إعادة ${Number(match.attempt_no)}`:'';return `<article class=\"bracket-match${match.is_my_match?' mine':''}\"><div class=\"bracket-player${match.winner_player_id===match.player_one_id?' winner':''}\"><span>${esc(match.player_one_name||'بانتظار المتأهل')}</span></div><div class=\"bracket-player${match.winner_player_id===match.player_two_id?' winner':''}\"><span>${esc(match.player_two_name||'بانتظار المتأهل')}</span></div><div class=\"bracket-meta\"><span>${esc(bracketStatusLabel(match.match_status))}${retry}</span>${canEnter?`<button class=\"register-btn tournament-enter-btn\" type=\"button\" data-tournament-match=\"${esc(match.match_id)}\">دخول المباراة</button>`:''}</div></article>`}).join('')}</div></section>`).join('');
  }catch(error){console.error(error);host.className='bracket-empty';host.textContent='تعذر تحميل مواجهات البطولة الآن.'}
}

async function enterTournamentMatch(button,matchId){
  clearTimeout(tournamentMatchPollTimer);
  button.disabled=true;
  const poll=async()=>{
    try{
      const {data,error}=await supabase.rpc('get_my_tournament_match_access',{p_match_id:matchId});
      if(error)throw error;
      const row=firstRow(data);
      if(row?.state==='active'&&row.game_id&&row.seat_key&&['w','b'].includes(row.color)){
        sessionStorage.setItem('shatranj_live_game_id',row.game_id);
        sessionStorage.setItem('shatranj_live_game_code',row.game_code||'');
        sessionStorage.setItem('shatranj_live_seat_key',row.seat_key);
        sessionStorage.setItem('shatranj_live_color',row.color);
        location.href=`play-v10.html?game=${encodeURIComponent(row.game_id)}`;
        return;
      }
      if(row?.state==='waiting'){
        button.textContent='بانتظار الخصم...';
        button.disabled=true;
        tournamentMatchPollTimer=setTimeout(poll,1500);
        return;
      }
      button.textContent='انتهت المباراة';
      button.disabled=true;
      if(selectedTournamentId)loadTournamentBracket(selectedTournamentId);
    }catch(error){
      console.error(error);
      button.disabled=false;
      button.textContent='دخول المباراة';
      setRegistrationMessage('تعذر دخول مباراة البطولة الآن.','error');
    }
  };
  await poll();
}

function openTournamentDetail(tournamentId){const row=tournaments.find(item=>String(item.id)===String(tournamentId));if(!row)return;selectedTournamentId=String(row.id);setRegistrationMessage('');renderTournamentDetail(row);listView.hidden=true;detailView.hidden=false;loadTournamentBracket(row.id)}
"""
page = replace_once(page, old_detail, new_detail, 'public bracket detail/functions')
page = replace_once(
    page,
    "detailCard.addEventListener('click',event=>{const button=event.target.closest('.register-btn[data-tournament-id]');if(!button||button.disabled)return;registerForTournament(button,button.dataset.tournamentId)});",
    "detailCard.addEventListener('click',event=>{const matchButton=event.target.closest('[data-tournament-match]');if(matchButton&&!matchButton.disabled){enterTournamentMatch(matchButton,matchButton.dataset.tournamentMatch);return}const button=event.target.closest('.register-btn[data-tournament-id]');if(!button||button.disabled)return;registerForTournament(button,button.dataset.tournamentId)});",
    'public match-entry click handler',
)
page = replace_once(
    page,
    "function showTournamentList(){selectedTournamentId=null;setRegistrationMessage('');detailView.hidden=true;listView.hidden=false}",
    "function showTournamentList(){clearTimeout(tournamentMatchPollTimer);selectedTournamentId=null;setRegistrationMessage('');detailView.hidden=true;listView.hidden=false}",
    'clear tournament poll',
)
page_path.write_text(page, encoding='utf-8')

print('tournament start engine UI patch applied')
