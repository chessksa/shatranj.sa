from pathlib import Path

page_path = Path('tournaments.html')
page = page_path.read_text(encoding='utf-8')

old_css = ".table-wrap{overflow:auto}\ntable{width:100%;border-collapse:collapse;min-width:1180px}\nth,td{padding:14px 12px;border-bottom:1px solid rgba(216,182,101,.18);text-align:right;vertical-align:middle;white-space:nowrap}"
new_css = """/* TOURNAMENT TABLE NO SCROLL 20260906 */
.table-wrap{overflow:visible}
table{width:100%;border-collapse:collapse;min-width:0;table-layout:fixed}
th,td{padding:10px 7px;border-bottom:1px solid rgba(216,182,101,.18);text-align:right;vertical-align:middle;white-space:normal;overflow-wrap:anywhere}
th:nth-child(1),td:nth-child(1){width:4%}
th:nth-child(2),td:nth-child(2){width:18%}
th:nth-child(3),td:nth-child(3){width:7%}
th:nth-child(4),td:nth-child(4){width:9%}
th:nth-child(5),td:nth-child(5){width:9%}
th:nth-child(6),td:nth-child(6){width:9%}
th:nth-child(7),td:nth-child(7){width:15%}
th:nth-child(8),td:nth-child(8){width:8%;text-align:center}
th:nth-child(9),td:nth-child(9){width:7%;text-align:center}
th:nth-child(10),td:nth-child(10){width:7%;text-align:center}
th:nth-child(11),td:nth-child(11){width:7%;text-align:center}"""
assert old_css in page, 'tournament table CSS anchor not found'
page = page.replace(old_css, new_css, 1)

old_mobile = "@media(max-width:700px){.wrap{width:min(100% - 18px,1180px)}.nav{min-height:62px}.brand{font-size:18px}.back{min-height:39px;padding:0 11px}.page-head{align-items:flex-start;flex-direction:column;padding:15px}.page-head h1{font-size:24px}main{padding-top:18px}th,td{padding:12px 10px}th{font-size:14px}td{font-size:15px}.register-btn{min-height:40px;font-size:13px}}"
new_mobile = """@media(max-width:900px){th,td{padding:8px 5px}th{font-size:12px}td{font-size:13px}.register-btn{min-width:0;width:100%;padding:0 6px;font-size:12px}}
@media(max-width:700px){
  .wrap{width:min(100% - 18px,1180px)}.nav{min-height:62px}.brand{font-size:18px}.back{min-height:39px;padding:0 11px}.page-head{align-items:flex-start;flex-direction:column;padding:15px}.page-head h1{font-size:24px}main{padding-top:18px}
  .table-card{overflow:visible;background:transparent;border:0;box-shadow:none}
  .table-wrap{overflow:visible}
  table,thead,tbody,tr,th,td{display:block;width:100%}
  thead{display:none}
  tbody{display:grid;gap:10px}
  tbody tr{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--hero-cyan-line);border-radius:14px;overflow:hidden;background:linear-gradient(145deg,rgba(8,62,64,.86),rgba(7,49,51,.8))}
  tbody td{width:auto!important;min-height:42px;padding:9px 11px;border-bottom:1px solid rgba(216,182,101,.14);display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:13px;text-align:left!important}
  tbody td::before{color:#d9c58f;font-size:11px;font-weight:900;text-align:right}
  tbody td:nth-child(1)::before{content:'#'}
  tbody td:nth-child(2)::before{content:'اسم البطولة'}
  tbody td:nth-child(3)::before{content:'النطاق'}
  tbody td:nth-child(4)::before{content:'الدولة'}
  tbody td:nth-child(5)::before{content:'المدينة'}
  tbody td:nth-child(6)::before{content:'نظام الوقت'}
  tbody td:nth-child(7)::before{content:'الموعد'}
  tbody td:nth-child(8)::before{content:'المسجلون'}
  tbody td:nth-child(9)::before{content:'السعة'}
  tbody td:nth-child(10)::before{content:'الحالة'}
  tbody td:nth-child(11)::before{content:'التسجيل'}
  tbody td:nth-child(2),tbody td:nth-child(11){grid-column:1/-1}
  .registration-cell{justify-content:space-between!important}
  .register-btn{width:auto;min-width:120px;min-height:40px;font-size:13px}
}"""
assert old_mobile in page, 'tournament mobile CSS anchor not found'
page = page.replace(old_mobile, new_mobile, 1)

old_head = "              <th>الموعد</th>\n              <th>السعة</th>"
new_head = "              <th>الموعد</th>\n              <th>المسجلون</th>\n              <th>السعة</th>"
assert old_head in page, 'tournament header anchor not found'
page = page.replace(old_head, new_head, 1)

old_render_start = "    const canRegister=registrationOpen(row);\n    const registerControl=canRegister"
new_render_start = "    const canRegister=registrationOpen(row);\n    const registeredCount=Number(row.registered_count||0);\n    const registerControl=canRegister"
assert old_render_start in page, 'render start anchor not found'
page = page.replace(old_render_start, new_render_start, 1)

old_render_cells = "      <td>${esc(formatDate(row.starts_at))}</td>\n      <td>${row.max_players?esc(row.max_players)+' لاعب':'مفتوحة'}</td>"
new_render_cells = "      <td>${esc(formatDate(row.starts_at))}</td>\n      <td class=\"registered-count\" data-registration-count data-count=\"${registeredCount}\">${registeredCount} لاعب</td>\n      <td>${row.max_players?esc(row.max_players)+' لاعب':'مفتوحة'}</td>"
assert old_render_cells in page, 'render cell anchor not found'
page = page.replace(old_render_cells, new_render_cells, 1)

old_success = """      setRegistrationMessage(
        result.code==='already_registered'?'أنت مسجل بالفعل في هذه البطولة.':'تم تسجيلك في البطولة بنجاح.',
        'ok'
      );
      return;"""
new_success = """      setRegistrationMessage(
        result.code==='already_registered'?'أنت مسجل بالفعل في هذه البطولة.':'تم تسجيلك في البطولة بنجاح.',
        'ok'
      );
      if(result.ok){
        const countCell=button.closest('tr')?.querySelector('[data-registration-count]');
        if(countCell){
          const nextCount=Number(countCell.dataset.count||0)+1;
          countCell.dataset.count=String(nextCount);
          countCell.textContent=`${nextCount} لاعب`;
        }
      }
      return;"""
assert old_success in page, 'registration success anchor not found'
page = page.replace(old_success, new_success, 1)

old_load = """    const {data,error}=await supabase
      .from('tournaments')
      .select('id,name,scope_type,country,city,time_control,starts_at,max_players,status,registration_opens_at,registration_closes_at')
      .in('status',['open','running','finished'])
      .order('starts_at',{ascending:true,nullsFirst:false});
    if(error)throw error;
    renderTournaments(data||[]);"""
new_load = """    const [{data,error},{data:countRows,error:countError}]=await Promise.all([
      supabase
        .from('tournaments')
        .select('id,name,scope_type,country,city,time_control,starts_at,max_players,status,registration_opens_at,registration_closes_at')
        .in('status',['open','running','finished'])
        .order('starts_at',{ascending:true,nullsFirst:false}),
      supabase.rpc('get_tournament_registration_counts')
    ]);
    if(error)throw error;
    if(countError)console.warn('تعذر تحميل عدد المسجلين',countError);
    const countMap=new Map((countRows||[]).map(row=>[String(row.tournament_id),Number(row.registered_count||0)]));
    renderTournaments((data||[]).map(row=>({
      ...row,
      registered_count:countMap.get(String(row.id))||0
    })));"""
assert old_load in page, 'load tournaments anchor not found'
page = page.replace(old_load, new_load, 1)
page_path.write_text(page, encoding='utf-8')

theme_path = Path('home-theme.css')
theme = theme_path.read_text(encoding='utf-8')
marker = '/* HOME PLAY ACTION STACK 20260906 */'
if marker not in theme:
    theme += """

/* HOME PLAY ACTION STACK 20260906 */
.home-hero .home-board-actions{
  width:100%!important;
  max-width:100%!important;
  grid-template-columns:minmax(0,1.55fr) minmax(250px,.45fr)!important;
  grid-template-rows:repeat(3,56px)!important;
  gap:10px 14px!important;
  align-items:stretch!important;
}
.home-hero .hero-play-btn{
  grid-column:1!important;
  grid-row:1/4!important;
  height:auto!important;
  min-height:188px!important;
  font-size:26px!important;
}
.home-hero .home-invite-wrap{grid-column:2!important;grid-row:1!important}
.home-hero .hero-computer-btn{grid-column:2!important;grid-row:2!important}
.home-hero .hero-tournaments-btn{grid-column:2!important;grid-row:3!important}
.home-hero .home-invite-wrap,.home-hero .home-invite-wrap>.btn,.home-hero .hero-computer-btn,.home-hero .hero-tournaments-btn{
  height:56px!important;
  min-height:56px!important;
}
@media(max-width:700px){
  .home-hero .home-board-actions{
    grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr)!important;
    grid-template-rows:repeat(3,50px)!important;
    gap:8px!important;
  }
  .home-hero .hero-play-btn{min-height:166px!important;font-size:21px!important}
  .home-hero .home-invite-wrap,.home-hero .home-invite-wrap>.btn,.home-hero .hero-computer-btn,.home-hero .hero-tournaments-btn{height:50px!important;min-height:50px!important;font-size:12px!important;padding-inline:6px!important}
}
"""
theme_path.write_text(theme, encoding='utf-8')
