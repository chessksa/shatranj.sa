from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')

# The welcome ticker belongs to the home page only, so remove the previous external loader.
text = text.replace('<script src="home-welcome-ticker.js?v=20260906-1"></script>\n', '')

style_marker = '''<style id="hiddenNavAccountFix">
#navAccount[hidden]{display:none!important}
</style>'''

ticker_style = '''
<style id="welcomeTickerInlineStyles">
.welcome-ticker{width:100%;height:34px;display:flex;align-items:center;overflow:hidden;background:#0a302f;color:#f7f3e7;border-top:1px solid rgba(197,163,77,.55);border-bottom:1px solid rgba(197,163,77,.55);position:relative;z-index:19;flex:none;direction:rtl}
.welcome-ticker-label{flex:0 0 auto;height:100%;display:flex;align-items:center;padding:0 18px;white-space:nowrap;background:#0d3b39;color:#efcf7c;border-left:1px solid rgba(197,163,77,.5);font-size:12px;font-weight:900;line-height:1;position:relative;z-index:2;box-shadow:-8px 0 18px rgba(0,0,0,.12)}
.welcome-ticker-viewport{min-width:0;flex:1;overflow:hidden;height:100%;display:flex;align-items:center;direction:ltr}
.welcome-ticker-track{display:flex;align-items:center;width:max-content;min-width:max-content;will-change:transform;animation:welcomeTickerInlineMove 60s linear infinite;direction:ltr}
.welcome-ticker-group{display:flex;align-items:center;flex:none}
.welcome-ticker-item{display:inline-flex;align-items:center;white-space:nowrap;direction:rtl;font-size:12px;font-weight:800;line-height:1;padding:0 22px}
.welcome-ticker-separator{width:5px;height:5px;border-radius:50%;background:#c5a34d;flex:none}
.welcome-ticker-loading{display:inline-flex;align-items:center;white-space:nowrap;padding:0 20px;font-size:12px;font-weight:800;direction:rtl}
.welcome-ticker-single{animation:none!important;transform:none!important}
@keyframes welcomeTickerInlineMove{from{transform:translateX(-50%)}to{transform:translateX(0)}}
@media(min-width:901px){
  body{grid-template-rows:auto 34px auto auto auto auto!important}
  .home-header{grid-column:1/-1!important;grid-row:1!important}
  .welcome-ticker{grid-column:1/-1;grid-row:2;position:relative!important;top:auto!important;left:auto!important;right:auto!important}
  .home-hero{grid-column:3!important;grid-row:3!important}
  #ranking{grid-column:2!important;grid-row:3/5!important}
  .home-features{grid-column:3!important;grid-row:4!important}
  #register{grid-column:2/4!important;grid-row:5!important}
  footer{grid-column:1/-1!important;grid-row:6!important}

  body.home-signed-in{grid-template-rows:64px 34px minmax(0,1fr) 104px 38px!important}
  body.home-signed-in .home-header{grid-row:1!important}
  body.home-signed-in .welcome-ticker{grid-row:2!important}
  body.home-signed-in .home-hero{grid-row:3!important}
  body.home-signed-in #ranking{grid-row:3/5!important}
  body.home-signed-in .home-features{grid-row:4!important}
  body.home-signed-in footer{grid-row:5!important}
  body.home-signed-in #ranking .table-card{flex:0 0 auto!important}
  body.home-signed-in #ranking .table-wrap{height:auto!important;overflow:visible!important}
  body.home-signed-in #ranking table{height:auto!important}
}
@media(min-width:901px) and (max-height:700px){
  body.home-signed-in{height:auto!important;min-height:100vh!important;overflow-y:auto!important;grid-template-rows:64px 34px auto 104px 38px!important}
  body.home-signed-in #ranking{height:auto!important;overflow:visible!important}
  body.home-signed-in #ranking>.wrap{height:auto!important}
  body.home-signed-in .home-hero{overflow:visible!important}
}
@media(max-width:900px){
  .home-header{order:1!important}
  .welcome-ticker{order:2}
  .home-hero{order:3!important}
  #ranking{order:4!important}
  .home-features{order:5!important}
  #register{order:6!important}
  footer{order:7!important}
}
@media(max-width:800px){.welcome-ticker{height:30px}.welcome-ticker-label{padding:0 10px;font-size:10px}.welcome-ticker-item{font-size:11px;padding:0 16px}.welcome-ticker-track{animation-duration:52s}}
@media(max-width:430px){.welcome-ticker-label{padding:0 8px;font-size:9px}.welcome-ticker-item{padding:0 12px;font-size:10px}}
@media(prefers-reduced-motion:reduce){.welcome-ticker-track{animation:none;transform:none}.welcome-ticker-group:nth-child(2){display:none}}
</style>'''

style_start = text.find('<style id="welcomeTickerInlineStyles">')
if style_start >= 0:
    style_end = text.find('</style>', style_start)
    if style_end < 0:
        raise SystemExit('ticker style closing tag not found')
    style_end += len('</style>')
    text = text[:style_start] + ticker_style.strip() + text[style_end:]
else:
    if style_marker not in text:
        raise SystemExit('style insertion marker not found')
    text = text.replace(style_marker, style_marker + ticker_style, 1)

ticker_html = '''<div id="welcomeTicker" class="welcome-ticker" role="region" aria-label="آخر الأعضاء المنضمين">
  <span class="welcome-ticker-label">آخر المسجلين في شطرنج العرب</span>
  <div class="welcome-ticker-viewport">
    <div id="welcomeTickerTrack" class="welcome-ticker-track welcome-ticker-single">
      <span class="welcome-ticker-loading">جاري تحميل آخر المسجلين</span>
    </div>
  </div>
</div>'''

# Remove any existing ticker copy, whether it was inside or outside the header.
ticker_start = text.find('<div id="welcomeTicker" class="welcome-ticker"')
if ticker_start >= 0:
    ticker_end = text.find('\n\n', ticker_start)
    if ticker_end < 0:
        raise SystemExit('existing ticker block end not found')
    text = text[:ticker_start] + text[ticker_end:]

# Place the ticker as a standalone sibling immediately after the home header.
header_start = text.find('<header class="home-header">')
if header_start < 0:
    raise SystemExit('home header not found')
header_end = text.find('</header>', header_start)
if header_end < 0:
    raise SystemExit('home header closing tag not found')
header_end += len('</header>')
text = text[:header_end] + '\n\n' + ticker_html + text[header_end:]

function_marker = "function setAuthMsg(text,type=''){"
render_function = '''function renderWelcomeTicker(rows){
  const track=$('#welcomeTickerTrack');
  if(!track) return;

  const members=[...(Array.isArray(rows)?rows:[])]
    .filter(player=>player&&player.created_at)
    .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
    .slice(0,20);

  if(!members.length){
    track.className='welcome-ticker-track welcome-ticker-single';
    const fallback=document.createElement('span');
    fallback.className='welcome-ticker-loading';
    fallback.textContent='لا توجد تسجيلات حديثة';
    track.replaceChildren(fallback);
    return;
  }

  const buildGroup=()=>{
    const group=document.createElement('div');
    group.className='welcome-ticker-group';

    members.forEach(member=>{
      const name=String(member.name||'لاعب جديد').trim()||'لاعب جديد';
      const country=countryForRegion(member.region)||'دولة غير محددة';
      const city=String(member.city||'').trim();

      const item=document.createElement('span');
      item.className='welcome-ticker-item';
      item.textContent=city
        ? `${name} — ${country}، ${city}`
        : `${name} — ${country}`;
      group.appendChild(item);

      const separator=document.createElement('span');
      separator.className='welcome-ticker-separator';
      separator.setAttribute('aria-hidden','true');
      group.appendChild(separator);
    });

    return group;
  };

  track.className='welcome-ticker-track';
  track.replaceChildren(buildGroup(),buildGroup());
}

'''

function_start = text.find('function renderWelcomeTicker(rows){')
if function_start >= 0:
    function_end = text.find(function_marker, function_start)
    if function_end < 0:
        raise SystemExit('render function end marker not found')
    text = text[:function_start] + render_function + text[function_end:]
else:
    if function_marker not in text:
        raise SystemExit('function insertion marker not found')
    text = text.replace(function_marker, render_function + function_marker, 1)

players_marker = '  window.__HOME_PLAYERS__=ALL_PLAYERS;'
if 'renderWelcomeTicker(ALL_PLAYERS);' not in text:
    if players_marker not in text:
        raise SystemExit('player render marker not found')
    text = text.replace(players_marker, '  renderWelcomeTicker(ALL_PLAYERS);\n\n' + players_marker, 1)

path.write_text(text, encoding='utf-8')
