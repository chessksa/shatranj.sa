(() => {
  'use strict';

  function node(tag,className,text){
    const element=document.createElement(tag);
    if(className) element.className=className;
    if(text!=null) element.textContent=String(text);
    return element;
  }

  function installMobileFinalStyles(){
    if(document.getElementById('mobileHomeFinalStyles20260914b')) return;

    const style=document.createElement('style');
    style.id='mobileHomeFinalStyles20260914b';
    style.textContent=`
@media(max-width:900px){
  body .home-header{order:1!important}
  body #welcomeTicker{order:2!important}
  body #tournamentResultsTicker{order:3!important;display:flex!important;width:100%!important;height:26px!important;min-height:26px!important;max-height:26px!important;margin:0!important;visibility:visible!important;opacity:1!important;overflow:hidden!important;background:#082f31!important;border-top:0!important;border-bottom:1px solid rgba(224,181,103,.42)!important}
  body .home-hero{order:4!important}
  body #ranking{order:5!important}
  body .home-features{order:6!important}
  body #register{order:7!important}
  body footer{order:8!important}

  #tournamentResultsTicker .welcome-ticker-label{display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;width:auto!important;min-width:0!important;padding:0 8px!important;background:#0d3b39!important;color:#efcf7c!important;font-size:9px!important;font-weight:900!important;white-space:nowrap!important}
  #tournamentResultsTicker .welcome-ticker-viewport{display:flex!important;flex:1 1 auto!important;min-width:0!important;height:100%!important;overflow:hidden!important}
}

@media(max-width:600px){
  html body.v2-shell-active.v2-route-home.home-signed-in{
    grid-template-rows:108px 26px 26px minmax(0,1fr)!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .home-header{
    display:block!important;
    grid-row:1!important;
    width:100%!important;
    height:108px!important;
    min-height:108px!important;
    max-height:108px!important;
    margin:0!important;
    overflow:hidden!important;
    background:rgba(2,47,51,.98)!important;
    border:0!important;
    border-bottom:1px solid rgba(224,181,103,.22)!important;
    box-shadow:none!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .home-header .compact-member-nav{
    width:min(100% - 12px,680px)!important;
    height:108px!important;
    min-height:108px!important;
    max-height:108px!important;
    margin:0 auto!important;
    padding:5px 0!important;
    display:block!important;
    overflow:hidden!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .nav-user{
    width:100%!important;
    min-width:0!important;
    height:98px!important;
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    grid-template-rows:50px 42px!important;
    grid-template-areas:'member member member' 'dashboard notifications logout'!important;
    gap:6px!important;
    align-items:stretch!important;
    justify-items:stretch!important;
    overflow:hidden!important;
    direction:rtl!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .header-member{
    grid-area:member!important;
    display:block!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    height:50px!important;
    margin:0!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .header-member[hidden]{display:none!important}

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .header-member-link.header-tile{
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    height:50px!important;
    min-height:50px!important;
    max-height:50px!important;
    margin:0!important;
    padding:4px 9px!important;
    display:flex!important;
    flex-direction:row!important;
    align-items:center!important;
    justify-content:flex-start!important;
    gap:8px!important;
    overflow:hidden!important;
    direction:rtl!important;
    border:1px solid rgba(224,181,103,.28)!important;
    border-radius:14px!important;
    background:linear-gradient(145deg,rgba(9,68,70,.94),rgba(6,47,49,.95))!important;
    box-shadow:none!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .header-member-avatar-wrap,
  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .header-member-avatar{
    position:static!important;
    inset:auto!important;
    transform:none!important;
    width:40px!important;
    height:40px!important;
    min-width:40px!important;
    flex:0 0 40px!important;
    border-radius:50%!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .header-member-copy{
    width:auto!important;
    min-width:0!important;
    flex:1 1 auto!important;
    display:grid!important;
    grid-template-columns:minmax(0,1fr) auto!important;
    align-items:center!important;
    gap:10px!important;
    overflow:hidden!important;
    direction:rtl!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .header-member-copy>strong{
    min-width:0!important;
    max-width:none!important;
    margin:0!important;
    padding:0!important;
    color:#f4efe6!important;
    font-size:16px!important;
    font-weight:900!important;
    line-height:1.1!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
    text-align:right!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .header-member-points{
    min-width:58px!important;
    margin:0!important;
    padding:0 2px!important;
    display:flex!important;
    flex-direction:column!important;
    align-items:center!important;
    justify-content:center!important;
    gap:1px!important;
    line-height:1!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .header-member-points small{
    display:block!important;
    margin:0!important;
    color:#b9c9c4!important;
    font-size:8px!important;
    line-height:1!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .header-member-points b{
    margin:0!important;
    padding:0!important;
    color:#efcf7c!important;
    font-size:21px!important;
    font-weight:900!important;
    line-height:1!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .dashboard-link{
    grid-area:dashboard!important;
    display:flex!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    height:42px!important;
    min-height:42px!important;
    max-height:42px!important;
    margin:0!important;
    padding:4px 3px!important;
    flex-direction:column!important;
    align-items:center!important;
    justify-content:center!important;
    gap:2px!important;
    border:1px solid rgba(224,181,103,.24)!important;
    border-radius:12px!important;
    background:rgba(255,255,255,.035)!important;
    color:#f4efe6!important;
    font-size:8px!important;
    font-weight:800!important;
    white-space:nowrap!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .dashboard-link .header-tile-icon{
    width:auto!important;
    height:auto!important;
    min-width:0!important;
    flex:0 0 auto!important;
    font-size:18px!important;
    line-height:1!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .header-notification-host{
    grid-area:notifications!important;
    position:relative!important;
    display:grid!important;
    grid-template-rows:22px auto!important;
    place-items:center!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    height:42px!important;
    min-height:42px!important;
    max-height:42px!important;
    margin:0!important;
    padding:3px!important;
    border:1px solid rgba(224,181,103,.24)!important;
    border-radius:12px!important;
    background:rgba(255,255,255,.035)!important;
    overflow:hidden!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .header-notification-host::after{
    content:'التنبيهات'!important;
    color:#f4efe6!important;
    font:800 8px/1 Arial,sans-serif!important;
    white-space:nowrap!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .site-notification-bell{
    width:28px!important;
    min-width:28px!important;
    max-width:28px!important;
    height:22px!important;
    min-height:22px!important;
    max-height:22px!important;
    margin:0!important;
    padding:0!important;
    border:0!important;
    border-radius:8px!important;
    background:transparent!important;
    box-shadow:none!important;
    font-size:18px!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .nav-logout{
    grid-area:logout!important;
    display:flex!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    height:42px!important;
    min-height:42px!important;
    max-height:42px!important;
    margin:0!important;
    padding:3px!important;
    flex-direction:column!important;
    align-items:center!important;
    justify-content:center!important;
    gap:2px!important;
    border:1px solid rgba(224,181,103,.24)!important;
    border-radius:12px!important;
    background:rgba(255,255,255,.035)!important;
    color:#f4efe6!important;
    font-size:8px!important;
    font-weight:800!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .nav-logout::before{
    content:'↪'!important;
    display:block!important;
    color:#efcf7c!important;
    font-size:18px!important;
    line-height:1!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .mobile-dashboard-link,
  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .header-tournaments,
  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .nav-account{
    display:none!important;
  }

  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav .nav-logout[hidden]{display:none!important}

  html body.v2-shell-active.v2-route-home.home-signed-in #welcomeTicker{grid-row:2!important}
  html body.v2-shell-active.v2-route-home.home-signed-in #tournamentResultsTicker{grid-row:3!important}
  html body.v2-shell-active.v2-route-home.home-signed-in .home-hero{grid-row:4!important}
}

@media(max-width:700px){
  body .home-hero .home-board-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-template-rows:repeat(2,76px)!important;grid-auto-rows:76px!important;width:100%!important;max-width:none!important;gap:6px!important;direction:rtl!important;align-items:stretch!important}

  body .home-hero .hero-play-btn{grid-column:1!important;grid-row:1!important}
  body.home-signed-in .home-hero .home-invite-wrap,
  body .home-hero .home-invite-wrap{grid-column:2!important;grid-row:1!important;display:flex!important;position:relative!important;width:100%!important;min-width:0!important;height:76px!important;min-height:76px!important;max-height:76px!important;margin:0!important}
  body .home-hero .hero-computer-btn{grid-column:1!important;grid-row:2!important}
  body .home-hero .hero-tournaments-btn{grid-column:2!important;grid-row:2!important}

  body .home-hero .home-board-actions>.btn,
  body .home-hero .home-invite-wrap>.btn,
  body.home-signed-in .home-hero #homeInviteToggle{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;width:100%!important;min-width:0!important;height:76px!important;min-height:76px!important;max-height:76px!important;margin:0!important;padding:7px 6px!important;gap:5px!important;border-radius:14px!important;font:900 13px/1.05 Arial,sans-serif!important;text-align:center!important;white-space:normal!important}

  body .home-hero .home-board-actions>.btn::before,
  body .home-hero .home-invite-wrap>.btn::before,
  body.home-signed-in .home-hero #homeInviteToggle::before{display:grid!important;place-items:center!important;width:32px!important;height:32px!important;min-width:32px!important;flex:0 0 32px!important;margin:0!important;border:1px solid rgba(239,207,124,.48)!important;border-radius:10px!important;background:rgba(239,207,124,.08)!important;color:#efcf7c!important;font-size:19px!important;line-height:1!important;font-weight:900!important}

  body .home-hero .hero-play-btn::before{content:'♟'!important}
  body .home-hero .home-invite-wrap>.btn::before,
  body.home-signed-in .home-hero #homeInviteToggle::before{content:'♙+'!important}
  body .home-hero .hero-computer-btn::before{content:'▦'!important}
  body .home-hero .hero-tournaments-btn::before{content:'♛'!important}

  body .home-hero .hero-play-btn{background:linear-gradient(135deg,#efcf7c,#d5aa4d)!important;color:#173536!important;border:1px solid #efd589!important}
  body .home-hero .hero-play-btn::before{border-color:rgba(23,53,54,.24)!important;background:rgba(23,53,54,.08)!important;color:#173536!important}

  body .home-hero .home-invite-wrap>.btn,
  body.home-signed-in .home-hero #homeInviteToggle,
  body .home-hero .hero-computer-btn,
  body .home-hero .hero-tournaments-btn{background:linear-gradient(145deg,rgba(9,68,70,.98),rgba(6,47,49,.98))!important;border:1px solid rgba(216,182,101,.58)!important;color:#f4eddc!important;box-shadow:0 7px 17px rgba(0,0,0,.12)!important}
}
`;
    document.head.append(style);
  }

  function ensureTournamentTicker(){
    let ticker=document.getElementById('tournamentResultsTicker');
    if(ticker) return ticker;

    const welcome=document.getElementById('welcomeTicker');
    if(!welcome) return null;

    ticker=node('div','welcome-ticker tournament-results-ticker');
    ticker.id='tournamentResultsTicker';
    ticker.setAttribute('role','region');
    ticker.setAttribute('aria-label','نتائج البطولات');

    const label=node('span','welcome-ticker-label','نتائج البطولات');
    const viewport=node('div','welcome-ticker-viewport');
    const track=node('div','welcome-ticker-track welcome-ticker-single');
    track.id='tournamentResultsTickerTrack';
    track.append(node('span','welcome-ticker-loading','جاري تحميل البطولات'));
    viewport.append(track);
    ticker.append(label,viewport);
    welcome.insertAdjacentElement('afterend',ticker);
    return ticker;
  }

  function renderTournamentRows(rows){
    const ticker=ensureTournamentTicker();
    const track=ticker?.querySelector('#tournamentResultsTickerTrack');
    if(!track) return;

    const tournaments=Array.isArray(rows)?rows:[];
    if(!tournaments.length){
      track.className='welcome-ticker-track welcome-ticker-single';
      track.replaceChildren(node('span','welcome-ticker-loading','لا توجد بطولات معلنة حاليًا'));
      return;
    }

    const statusLabel=(status)=>status==='running'?'جارية الآن':status==='open'?'التسجيل مفتوح':status==='finished'?'انتهت':'بطولة';
    const buildGroup=()=>{
      const group=node('div','welcome-ticker-group');
      tournaments.forEach(item=>{
        const time=item.time_control?` · ${item.time_control}`:'';
        group.append(
          node('span','welcome-ticker-item',`${item.name||'بطولة'} — ${statusLabel(item.status)}${time}`),
          node('span','welcome-ticker-separator','')
        );
      });
      return group;
    };

    track.className='welcome-ticker-track';
    track.replaceChildren(buildGroup(),buildGroup());
  }

  async function loadTournamentRows(){
    const cfg=window.SHATRANJ_CONFIG?.supabase;
    if(!cfg?.enabled||!cfg?.url||!cfg?.anonKey){
      renderTournamentRows([]);
      return;
    }
    try{
      const params=new URLSearchParams({
        select:'id,name,status,time_control,created_at',
        status:'in.(running,open,finished)',
        order:'created_at.desc',
        limit:'10'
      });
      const response=await fetch(`${cfg.url}/rest/v1/tournaments?${params}`,{
        headers:{
          apikey:cfg.anonKey,
          Authorization:`Bearer ${cfg.anonKey}`,
          Accept:'application/json'
        },
        cache:'no-store'
      });
      if(!response.ok) throw new Error(`tournaments ${response.status}`);
      renderTournamentRows(await response.json());
    }catch(error){
      console.warn('تعذر تحميل شريط البطولات الاحتياطي',error);
      renderTournamentRows([]);
    }
  }

  function boot(){
    installMobileFinalStyles();
    if(!ensureTournamentTicker()){
      setTimeout(boot,50);
      return;
    }
    void loadTournamentRows();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
