(() => {
  'use strict';

  function node(tag,className,text){
    const element=document.createElement(tag);
    if(className) element.className=className;
    if(text!=null) element.textContent=String(text);
    return element;
  }

  function installMobileFinalStyles(){
    if(document.getElementById('mobileHomeFinalStyles20260914')) return;

    const style=document.createElement('style');
    style.id='mobileHomeFinalStyles20260914';
    style.textContent=`
@media(max-width:900px){
  body .home-header{order:1!important}
  body #welcomeTicker{order:2!important}
  body #tournamentResultsTicker{order:3!important;display:flex!important;width:100%!important;height:30px!important;min-height:30px!important;max-height:30px!important;margin:0!important;visibility:visible!important;opacity:1!important;overflow:hidden!important;background:#082f31!important;border-top:0!important;border-bottom:1px solid rgba(224,181,103,.42)!important}
  body .home-hero{order:4!important}
  body #ranking{order:5!important}
  body .home-features{order:6!important}
  body #register{order:7!important}
  body footer{order:8!important}

  #tournamentResultsTicker .welcome-ticker-label{display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;width:auto!important;min-width:0!important;padding:0 8px!important;background:#0d3b39!important;color:#efcf7c!important;font-size:10px!important;font-weight:900!important;white-space:nowrap!important}
  #tournamentResultsTicker .welcome-ticker-viewport{display:flex!important;flex:1 1 auto!important;min-width:0!important;height:100%!important;overflow:hidden!important}
}

@media(max-width:600px){
  .home-header .compact-member-nav{display:flex!important;align-items:center!important;justify-content:flex-start!important;min-height:58px!important;padding:6px 0!important;overflow:hidden!important}

  body.home-signed-in .compact-member-nav .nav-user,
  .compact-member-nav .nav-user{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:flex-start!important;width:100%!important;min-width:0!important;gap:5px!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none!important;-webkit-overflow-scrolling:touch!important}
  .compact-member-nav .nav-user::-webkit-scrollbar{display:none!important}

  body.home-signed-in .compact-member-nav .header-member,
  .compact-member-nav .header-member{order:1!important;grid-column:auto!important;grid-row:auto!important;flex:0 0 auto!important;width:auto!important;min-width:0!important}

  body.home-signed-in .compact-member-nav .header-member-link.header-tile,
  .compact-member-nav .header-member-link.header-tile{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;width:146px!important;min-width:146px!important;max-width:146px!important;height:46px!important;min-height:46px!important;padding:4px 7px!important;gap:6px!important;overflow:hidden!important;border:1px solid var(--hero-line)!important;border-radius:13px!important;background:rgba(255,255,255,.035)!important}

  body.home-signed-in .compact-member-nav .header-member-avatar-wrap,
  .compact-member-nav .header-member-avatar-wrap,
  body.home-signed-in .compact-member-nav .header-member-avatar,
  .compact-member-nav .header-member-avatar{position:static!important;transform:none!important;width:34px!important;height:34px!important;flex:0 0 34px!important}

  body.home-signed-in .compact-member-nav .header-member-copy,
  .compact-member-nav .header-member-copy{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:5px!important;width:auto!important;min-width:0!important;flex:1 1 auto!important;overflow:hidden!important}

  body.home-signed-in .compact-member-nav .header-member-copy>strong,
  .compact-member-nav .header-member-copy>strong{min-width:0!important;max-width:none!important;margin:0!important;padding:0!important;font-size:12px!important;line-height:1.15!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;text-align:right!important}

  body.home-signed-in .compact-member-nav .header-member-points,
  .compact-member-nav .header-member-points{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;min-width:36px!important;gap:2px!important;line-height:1!important}
  body.home-signed-in .compact-member-nav .header-member-points small,
  .compact-member-nav .header-member-points small{display:block!important;margin:0!important;font-size:8px!important;line-height:1!important}
  body.home-signed-in .compact-member-nav .header-member-points b,
  .compact-member-nav .header-member-points b{margin:0!important;padding:0!important;font-size:14px!important;line-height:1!important}

  body.home-signed-in .compact-member-nav .dashboard-link,
  .compact-member-nav .dashboard-link{order:2!important;grid-column:auto!important;grid-row:auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 92px!important;width:92px!important;min-width:92px!important;max-width:92px!important;height:46px!important;min-height:46px!important;margin:0!important;padding:0 6px!important;gap:4px!important;font-size:10px!important}
  .compact-member-nav .mobile-dashboard-link{display:none!important}

  body.home-signed-in .compact-member-nav .header-notification-host,
  .compact-member-nav .header-notification-host{order:3!important;grid-column:auto!important;grid-row:auto!important;display:flex!important;align-items:center!important;flex:0 0 46px!important;width:46px!important;min-width:46px!important;max-width:46px!important;height:46px!important;min-height:46px!important;margin:0!important}
  .compact-member-nav .site-notification-bell{width:46px!important;min-width:46px!important;height:46px!important;border-radius:13px!important}

  body.home-signed-in .compact-member-nav .nav-logout,
  .compact-member-nav .nav-logout{order:4!important;grid-column:auto!important;grid-row:auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 56px!important;width:56px!important;min-width:56px!important;max-width:56px!important;height:46px!important;min-height:46px!important;margin:0!important;padding:0 5px!important;font-size:10px!important}
  .compact-member-nav .nav-logout[hidden]{display:none!important}
  .compact-member-nav .header-tournaments{display:none!important}
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
