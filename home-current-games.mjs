import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg=window.SHATRANJ_CONFIG?.supabase||{};
const supabase=cfg.enabled&&cfg.url&&cfg.anonKey?createClient(cfg.url,cfg.anonKey):null;
let busy=false;
async function refreshCurrentGamesCount(){
  if(!supabase||busy)return;
  busy=true;
  try{
    const {data,error}=await supabase.rpc('list_public_current_games');
    if(error)throw error;
    const total=Array.isArray(data)?data.length:0;
    window.SHATRANJ_LIVE_MATCHES?.setPersisted(total);
  }catch(error){
    console.warn('تعذر تحديث عدد المباريات الحالية',error);
  }finally{
    busy=false;
  }
}

refreshCurrentGamesCount();
setInterval(refreshCurrentGamesCount,3000);
