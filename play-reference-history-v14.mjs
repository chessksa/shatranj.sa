import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const strip=document.getElementById('liveMoveStrip');
const cfg=window.SHATRANJ_CONFIG?.supabase || {};
const params=new URLSearchParams(location.search);
const gameId=params.get('game') || params.get('spectate');
const spectator=Boolean(params.get('spectate'));

if(strip && gameId && cfg.enabled && cfg.url && cfg.anonKey){
  const supabase=createClient(cfg.url,cfg.anonKey);
  let busy=false;
  let lastKey='';

  function firstRow(data){
    return Array.isArray(data) ? (data[0] || null) : data;
  }

  function normalizeMoves(value){
    if(Array.isArray(value)) return value;
    if(typeof value==='string'){
      try{
        const parsed=JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      }catch(_error){
        return [];
      }
    }
    return [];
  }

  function moveText(move){
    const san=String(move?.san || move?.p_san || '').trim();
    if(san) return san;
    const from=String(move?.from || '').trim();
    const to=String(move?.to || '').trim();
    return /^[a-h][1-8]$/.test(from) && /^[a-h][1-8]$/.test(to) ? `${from}${to}` : '…';
  }

  function render(moves){
    const safe=normalizeMoves(moves);
    const key=JSON.stringify(safe.slice(-16).map((move)=>[move?.san,move?.p_san,move?.from,move?.to]));
    if(key===lastKey) return;
    lastKey=key;
    strip.replaceChildren();

    if(!safe.length){
      const empty=document.createElement('span');
      empty.className='move-empty';
      empty.textContent='…';
      strip.appendChild(empty);
      return;
    }

    const start=Math.max(0,safe.length-14);
    safe.slice(start).forEach((move,offset)=>{
      const absoluteIndex=start+offset;
      const token=document.createElement('span');
      token.className='move-token'+(absoluteIndex===safe.length-1?' is-last':'');
      if(absoluteIndex%2===0){
        const no=document.createElement('span');
        no.className='move-no';
        no.textContent=`${Math.floor(absoluteIndex/2)+1}.`;
        token.appendChild(no);
      }
      const san=document.createElement('span');
      san.className='move-san';
      san.textContent=moveText(move);
      token.appendChild(san);
      strip.appendChild(token);
    });
    strip.scrollLeft=strip.scrollWidth;
  }

  async function refresh(){
    if(busy || document.hidden) return;
    busy=true;
    try{
      const request=spectator
        ? supabase.rpc('get_spectator_live_game_state',{p_game_id:gameId})
        : supabase.rpc('get_live_game_state',{p_game_id:gameId});
      const {data,error}=await request;
      if(error) throw error;
      render(firstRow(data)?.moves || []);
    }catch(error){
      console.warn('تعذر تحديث شريط الحركات',error);
    }finally{
      busy=false;
    }
  }

  render([]);
  refresh();
  const timer=setInterval(refresh,2200);
  window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) refresh(); });
}
