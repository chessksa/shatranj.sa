import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = window.SHATRANJ_CONFIG?.supabase || {};
export const supabase = cfg.enabled && cfg.url && cfg.anonKey ? createClient(cfg.url,cfg.anonKey) : null;

export function table(name){
  if(!supabase) throw new Error('Supabase غير مفعّل');
  return supabase.from(name);
}

export async function rpc(name,args={}){
  if(!supabase) throw new Error('Supabase غير مفعّل');
  const {data,error}=await supabase.rpc(name,args);
  if(error) throw error;
  return data;
}

export async function getSessionPlayer(){
  if(!supabase) return {session:null,player:null};
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) return {session:null,player:null};
  const {data,error}=await supabase.from('players')
    .select('id,name,country,region,city,rating,games_count,wins,draws,losses,status,auth_user_id')
    .eq('auth_user_id',session.user.id).order('created_at',{ascending:true}).limit(1).maybeSingle();
  if(error) throw error;
  return {session,player:data||null};
}

export async function requirePlayer(){
  const state=await getSessionPlayer();
  if(!state.session) {
    const next=encodeURIComponent(location.pathname.split('/').pop()+location.search);
    location.href=`index.html?login=1&next=${next}`;
    throw new Error('login_required');
  }
  if(!state.player) throw new Error('player_profile_required');
  return state;
}

export function escapeHtml(value){
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export function relativeTime(value){
  const ms=Date.now()-new Date(value).getTime();
  if(!Number.isFinite(ms)) return '';
  const min=Math.max(0,Math.floor(ms/60000));
  if(min<1) return 'الآن';
  if(min<60) return `منذ ${min} د`;
  const h=Math.floor(min/60); if(h<24) return `منذ ${h} س`;
  const d=Math.floor(h/24); return `منذ ${d} ي`;
}
