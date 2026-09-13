(() => {
  'use strict';

  function node(tag,className,text){
    const element=document.createElement(tag);
    if(className) element.className=className;
    if(text!=null) element.textContent=String(text);
    return element;
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
    if(!cfg?.enabled||!cfg?.url||!cfg?.anonKey) return;
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
    }
  }

  function boot(){
    if(!ensureTournamentTicker()){
      setTimeout(boot,50);
      return;
    }
    void loadTournamentRows();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
