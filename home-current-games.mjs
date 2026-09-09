import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg=window.SHATRANJ_CONFIG?.supabase||{};
const supabase=cfg.enabled&&cfg.url&&cfg.anonKey?createClient(cfg.url,cfg.anonKey):null;
const countEl=document.getElementById('headerMatchesCount');
let lastTotal=null;
let busy=false;

async function refreshCurrentGamesCount(){
  if(!supabase||!countEl||busy)return;
  busy=true;
  try{
    const {data,error}=await supabase.rpc('list_public_current_games');
    if(error)throw error;
    lastTotal=Array.isArray(data)?data.length:0;
    if(countEl.textContent!==String(lastTotal))countEl.textContent=String(lastTotal);
  }catch(error){
    console.warn('تعذر تحديث عدد المباريات الحالية',error);
  }finally{
    busy=false;
  }
}

if(countEl){
  const observer=new MutationObserver(()=>{
    if(lastTotal!==null&&countEl.textContent!==String(lastTotal))countEl.textContent=String(lastTotal);
  });
  observer.observe(countEl,{childList:true,characterData:true,subtree:true});
}

refreshCurrentGamesCount();
setInterval(refreshCurrentGamesCount,3000);
