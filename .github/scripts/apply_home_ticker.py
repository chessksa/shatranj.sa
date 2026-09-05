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
.welcome-ticker{width:100%;height:34px;display:flex;align-items:center;overflow:hidden;background:#0a302f;color:#f7f3e7;border-top:1px solid rgba(197,163,77,.55);border-bottom:1px solid rgba(197,163,77,.55);position:relative;z-index:19}
.welcome-ticker-track{display:flex;align-items:center;width:max-content;min-width:max-content;will-change:transform;animation:welcomeTickerInlineMove 38s linear infinite}
.welcome-ticker-group{display:flex;align-items:center;flex:none}
.welcome-ticker-item{display:inline-flex;align-items:center;white-space:nowrap;direction:rtl;font-size:12px;font-weight:800;line-height:1;padding:0 22px}
.welcome-ticker-separator{width:5px;height:5px;border-radius:50%;background:#c5a34d;flex:none}
.welcome-ticker-loading{display:inline-flex;align-items:center;white-space:nowrap;padding:0 20px;font-size:12px;font-weight:800}
.welcome-ticker-single{animation:none!important;transform:none!important}
@keyframes welcomeTickerInlineMove{from{transform:translateX(0)}to{transform:translateX(50%)}}
@media(max-width:800px){.welcome-ticker{height:30px}.welcome-ticker-item{font-size:11px;padding:0 16px}.welcome-ticker-track{animation-duration:32s}}
@media(prefers-reduced-motion:reduce){.welcome-ticker-track{animation:none;transform:none}.welcome-ticker-group:nth-child(2){display:none}}
</style>'''

if 'id="welcomeTickerInlineStyles"' not in text:
    if style_marker not in text:
        raise SystemExit('style insertion marker not found')
    text = text.replace(style_marker, style_marker + ticker_style, 1)

header_marker = '</header>\n\n\n<!-- APPROVED HOME HERO 20260904 -->'
ticker_html = '''</header>

<div id="welcomeTicker" class="welcome-ticker" role="region" aria-label="آخر الأعضاء المنضمين">
  <div id="welcomeTickerTrack" class="welcome-ticker-track welcome-ticker-single">
    <span class="welcome-ticker-loading">مرحبًا بكم في شطرنج العرب</span>
  </div>
</div>

<!-- APPROVED HOME HERO 20260904 -->'''

if 'id="welcomeTicker"' not in text:
    if header_marker not in text:
        raise SystemExit('header insertion marker not found')
    text = text.replace(header_marker, ticker_html, 1)

function_marker = "function setAuthMsg(text,type=''){"
render_function = '''function renderWelcomeTicker(rows){
  const track=$('#welcomeTickerTrack');
  if(!track) return;

  const members=[...(Array.isArray(rows)?rows:[])]
    .filter(player=>player&&player.created_at)
    .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
    .slice(0,10);

  if(!members.length){
    track.className='welcome-ticker-track welcome-ticker-single';
    const fallback=document.createElement('span');
    fallback.className='welcome-ticker-loading';
    fallback.textContent='مرحبًا بكم في شطرنج العرب';
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
        ? `نرحب بانضمام ${name} — ${country}، ${city}`
        : `نرحب بانضمام ${name} — ${country}`;
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

if 'function renderWelcomeTicker' not in text:
    if function_marker not in text:
        raise SystemExit('function insertion marker not found')
    text = text.replace(function_marker, render_function + function_marker, 1)

players_marker = '  window.__HOME_PLAYERS__=ALL_PLAYERS;'
if 'renderWelcomeTicker(ALL_PLAYERS);' not in text:
    if players_marker not in text:
        raise SystemExit('player render marker not found')
    text = text.replace(players_marker, '  renderWelcomeTicker(ALL_PLAYERS);\n\n' + players_marker, 1)

path.write_text(text, encoding='utf-8')
