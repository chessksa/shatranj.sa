from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"missing marker: {label}")
    return text.replace(old, new, 1)


# admin.html
p = Path("admin.html")
text = p.read_text(encoding="utf-8")
if "overflow-y:auto" not in text:
    text = replace_once(
        text,
        ".nav-list{display:grid;gap:7px}",
        ".nav-list{display:grid;gap:7px;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding-bottom:4px}",
        "admin nav-list",
    )
if ".sidebar-foot{margin-top:auto;display:grid;gap:8px;position:sticky" not in text:
    text = replace_once(
        text,
        ".sidebar-foot{margin-top:auto;display:grid;gap:8px}",
        ".sidebar-foot{margin-top:auto;display:grid;gap:8px;position:sticky;bottom:0;flex:0 0 auto;background:rgba(3,38,43,.98);padding-top:8px;z-index:3}",
        "admin sidebar-foot",
    )
p.write_text(text, encoding="utf-8")


# admin.js
p = Path("admin.js")
text = p.read_text(encoding="utf-8")
if "async function handleRefresh()" not in text:
    marker = "function applyAccessUi()"
    pos = text.find(marker)
    if pos < 0:
        raise SystemExit("missing marker: applyAccessUi")
    handler = """async function handleRefresh(){
  const button=$('refreshBtn');if(!button||button.disabled)return;
  const original=button.textContent;
  button.disabled=true;button.textContent='↻ جارٍ التحديث...';
  state.allPlayers=[];
  try{await refreshCurrent();button.textContent='✓ تم التحديث';}
  finally{setTimeout(()=>{button.disabled=false;button.textContent=original;},650);}
}

"""
    text = text[:pos] + handler + text[pos:]
text = text.replace("$('refreshBtn')?.addEventListener('click',refreshCurrent);", "$('refreshBtn')?.addEventListener('click',handleRefresh);", 1)
p.write_text(text, encoding="utf-8")


# index.html
p = Path("index.html")
text = p.read_text(encoding="utf-8")
text = text.replace(
    'id="headerTournaments" class="header-tournaments header-tile" href="#register"',
    'id="headerTournaments" class="header-tournaments header-tile" href="#tournaments"',
    1,
)

style = '''<style id="publicTournamentStyles">
.public-tournaments{padding:14px 0;background:#f0ece2;border-top:1px solid #ddd7ca;border-bottom:1px solid #ddd7ca;scroll-margin-top:72px}
.public-tournaments .head{align-items:center}.public-tournaments .head p{margin:2px 0 0}
.tournaments-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.tournament-card{background:#fff;border:1px solid #ded8cd;border-radius:10px;padding:12px;min-width:0}
.tournament-card h3{margin:0 0 8px;font-size:16px;color:#0d3b2e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tournament-meta{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.tournament-meta span{display:block;padding:7px 8px;border-radius:7px;background:#f7f4ed;color:#5e6762;font-size:11px}
.tournament-meta strong{display:block;margin-top:2px;color:#17231e;font-size:12px}
.tournament-status{display:inline-flex;margin-top:9px;padding:4px 8px;border-radius:999px;background:#eef5ef;color:#176148;font-size:10px;font-weight:900}
.tournament-empty{grid-column:1/-1;background:#fff;border:1px solid #ded8cd;border-radius:10px;padding:18px;text-align:center;color:#777;font-size:12px}
@media(min-width:901px){body{grid-template-rows:auto 34px auto auto auto auto auto!important}#tournaments{grid-column:2/4!important;grid-row:5!important}#register{grid-row:6!important}footer{grid-row:7!important}body.home-signed-in{grid-template-rows:64px 34px minmax(0,1fr) 104px auto 38px!important}body.home-signed-in #tournaments{grid-row:5!important}body.home-signed-in footer{grid-row:6!important}}
@media(max-width:900px){#tournaments{order:6!important}#register{order:7!important}footer{order:8!important}}
@media(max-width:700px){.tournaments-grid{grid-template-columns:1fr}.tournament-meta{grid-template-columns:1fr 1fr}}
</style>
'''
if 'id="publicTournamentStyles"' not in text:
    text = replace_once(text, "</head>", style + "</head>", "head end")

section = '''
<!-- PUBLIC TOURNAMENTS -->
<section id="tournaments" class="public-tournaments">
  <div class="wrap">
    <div class="head"><div><h2>البطولات</h2><p>البطولات المعلنة على مستوى العالم العربي أو حسب الدولة والمدينة.</p></div></div>
    <div id="publicTournamentsList" class="tournaments-grid"><div class="tournament-empty">جاري تحميل البطولات...</div></div>
  </div>
</section>

'''
if 'id="publicTournamentsList"' not in text:
    text = replace_once(text, "<!-- ACCOUNT -->", section + "<!-- ACCOUNT -->", "account section")

js = '''function publicTournamentScope(row){
  if(row.scope_type==='global') return 'عامة';
  if(row.scope_type==='country') return row.country||'دولة محددة';
  return [row.country,row.city].filter(Boolean).join(' — ')||'مدينة محددة';
}

function publicTournamentStatus(status){
  return ({open:'التسجيل مفتوح',running:'جارية',finished:'منتهية'})[status]||status||'—';
}

function publicTournamentDate(value){
  if(!value) return 'يحدد لاحقًا';
  return new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
}

function renderPublicTournaments(rows){
  const host=$('#publicTournamentsList');
  if(!host) return;
  const list=Array.isArray(rows)?rows:[];
  if(!list.length){host.innerHTML='<div class="tournament-empty">لا توجد بطولات معلنة حاليًا.</div>';return;}
  host.innerHTML=list.map(row=>`<article class="tournament-card"><h3>${escapeHTML(row.name)}</h3><div class="tournament-meta"><span>النطاق<strong>${escapeHTML(publicTournamentScope(row))}</strong></span><span>نظام الوقت<strong>${escapeHTML(row.time_control||'—')} دقيقة</strong></span><span>موعد البداية<strong>${escapeHTML(publicTournamentDate(row.starts_at))}</strong></span><span>السعة<strong>${row.max_players?escapeHTML(row.max_players)+' لاعب':'مفتوحة'}</strong></span></div><span class="tournament-status">${escapeHTML(publicTournamentStatus(row.status))}</span></article>`).join('');
}

async function loadPublicTournaments(){
  const host=$('#publicTournamentsList');
  try{
    const {data,error}=await supabase.from('tournaments').select('id,name,scope_type,country,city,time_control,starts_at,status,registration_opens_at,registration_closes_at,max_players').in('status',['open','running','finished']).order('starts_at',{ascending:true,nullsFirst:false});
    if(error) throw error;
    renderPublicTournaments(data||[]);
  }catch(error){console.error('Unable to load public tournaments',error);if(host)host.innerHTML='<div class="tournament-empty">تعذر تحميل البطولات الآن.</div>';}
}

'''
if "async function loadPublicTournaments()" not in text:
    marker = "function setAuthMsg(text,type=''){"
    pos = text.find(marker)
    if pos < 0:
        raise SystemExit("missing marker: setAuthMsg")
    text = text[:pos] + js + text[pos:]
if "loadPublicTournaments().catch" not in text:
    text = replace_once(text, "loadPlayers().catch(error=>{", "loadPublicTournaments().catch(error=>console.error(error));\n\nloadPlayers().catch(error=>{", "loadPlayers init")
p.write_text(text, encoding="utf-8")
