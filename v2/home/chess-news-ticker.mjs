import { supabase } from '../platform/api.mjs';

const REFRESH_MS=10*60*1000;
let lastLoadedAt=0;

function node(tag,className,text){
  const el=document.createElement(tag);
  if(className) el.className=className;
  if(text!=null) el.textContent=String(text);
  return el;
}

function ensureNewsTicker(){
  let ticker=document.getElementById('chessNewsTicker');
  if(ticker) return ticker;

  const welcome=document.getElementById('welcomeTicker');
  if(!welcome) return null;

  ticker=node('div','welcome-ticker chess-news-ticker');
  ticker.id='chessNewsTicker';
  ticker.setAttribute('role','region');
  ticker.setAttribute('aria-label','أخبار الشطرنج العالمية');

  const label=node('a','welcome-ticker-label chess-news-label','أخبار الشطرنج');
  label.href='https://www.chess.com/ar/news';
  label.target='_blank';
  label.rel='noopener noreferrer';
  label.title='المصدر: Chess.com العربية';

  const viewport=node('div','welcome-ticker-viewport');
  const track=node('div','welcome-ticker-track welcome-ticker-single');
  track.id='chessNewsTickerTrack';
  track.append(node('span','welcome-ticker-loading','جاري تحميل أخبار الشطرنج العالمية'));
  viewport.append(track);
  ticker.append(label,viewport);

  const tournaments=document.getElementById('tournamentResultsTicker');
  (tournaments||welcome).insertAdjacentElement('afterend',ticker);
  return ticker;
}

function makeNewsGroup(items){
  const group=node('span','welcome-ticker-group chess-news-group');
  items.forEach(item=>{
    const link=node('a','welcome-ticker-item chess-news-item',item.title);
    link.href=item.link;
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.title='Chess.com العربية';
    group.append(link,node('span','welcome-ticker-separator',''));
  });
  return group;
}

function renderNews(items){
  ensureNewsTicker();
  const track=document.getElementById('chessNewsTickerTrack');
  if(!track) return;

  const rows=Array.isArray(items)
    ? items.filter(item=>item&&item.title&&item.link).slice(0,12)
    : [];

  if(!rows.length){
    track.className='welcome-ticker-track welcome-ticker-single';
    const fallback=node('a','welcome-ticker-loading chess-news-fallback','أخبار الشطرنج العالمية — Chess.com العربية');
    fallback.href='https://www.chess.com/ar/news';
    fallback.target='_blank';
    fallback.rel='noopener noreferrer';
    track.replaceChildren(fallback);
    return;
  }

  const group=makeNewsGroup(rows);
  track.className='welcome-ticker-track';
  track.replaceChildren(group,group.cloneNode(true));
}

async function loadNews({force=false}={}){
  ensureNewsTicker();
  if(!supabase){
    renderNews([]);
    return;
  }
  if(!force&&Date.now()-lastLoadedAt<REFRESH_MS-5000) return;

  try{
    const {data,error}=await supabase.functions.invoke('chess-news-ar',{body:{}});
    if(error) throw error;
    renderNews(data?.items||[]);
    lastLoadedAt=Date.now();
  }catch(error){
    console.warn('تعذر تحميل أخبار الشطرنج',error);
    if(!lastLoadedAt) renderNews([]);
  }
}

async function boot(){
  for(let i=0;i<30&&!document.getElementById('welcomeTicker');i++){
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  ensureNewsTicker();
  await loadNews({force:true});
  setInterval(()=>void loadNews({force:true}),REFRESH_MS);
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'&&Date.now()-lastLoadedAt>REFRESH_MS){
      void loadNews({force:true});
    }
  });
}

void boot();
