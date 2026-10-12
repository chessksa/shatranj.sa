import { supabase } from '../platform/api.mjs';

// Preview data is read-only: do not create puzzle sessions until the player opens the puzzle.
function drawMiniPuzzle(board,fen){
  const text=String(fen||'').trim().split(/\s+/);
  const ranks=(text[0]||'').split('/');
  if(ranks.length!==8)throw new Error('invalid_daily_puzzle_fen');
  const pieces=new Map();
  for(let rankIndex=0;rankIndex<8;rankIndex++){
    let col=0;
    for(const symbol of ranks[rankIndex]){
      if(/[1-8]/.test(symbol))col+=Number(symbol);
      else if(/[prnbqk]/i.test(symbol)){
        if(col>7)throw new Error('invalid_daily_puzzle_fen');
        pieces.set(String.fromCharCode(97+col)+(8-rankIndex),symbol);
        col++;
      }else throw new Error('invalid_daily_puzzle_fen');
    }
    if(col!==8)throw new Error('invalid_daily_puzzle_fen');
  }
  const blackToMove=text[1]==='b';
  const files=blackToMove?['h','g','f','e','d','c','b','a']:['a','b','c','d','e','f','g','h'];
  const rows=blackToMove?[1,2,3,4,5,6,7,8]:[8,7,6,5,4,3,2,1];
  const fragment=document.createDocumentFragment();
  for(const rank of rows)for(const file of files){
    const sq=document.createElement('span');
    const fileIndex=file.charCodeAt(0)-97;
    sq.className='desktop-mini-puzzle-square '+((fileIndex+rank)%2===0?'light':'dark');
    const symbol=pieces.get(file+rank);
    if(symbol){
      const image=document.createElement('img');
      image.className='desktop-mini-puzzle-piece';
      image.src='assets/pieces/'+(symbol===symbol.toUpperCase()?'w':'b')+symbol.toLowerCase()+'.png';
      image.alt='';
      image.decoding='async';
      image.draggable=false;
      sq.append(image);
    }
    fragment.append(sq);
  }
  board.replaceChildren(fragment);
  board.dataset.puzzleReady='true';
  board.setAttribute('aria-label','وضعية لغز اليوم، '+(blackToMove?'الدور على الأسود':'الدور على الأبيض')+'، اضغط للحل');
}

export function populateHomeSideRail(rail){
  if(!rail||!supabase)return;
  const mini=rail.querySelector('.desktop-mini-puzzle-board');
  const dailyInfo=rail.querySelector('[data-daily-puzzle-info]');
  const friendName=rail.querySelector('[data-suggested-friend-name]');
  const friendMeta=rail.querySelector('[data-suggested-friend-meta]');
  const friendState=rail.querySelector('[data-suggested-friend-state]');
  const friendAvatar=rail.querySelector('[data-suggested-friend-avatar]');
  const challenge=rail.querySelector('[data-home-side-action="friend"]');
  if(!mini||!dailyInfo||!friendName||!friendMeta||!friendState||!friendAvatar||!challenge)return;
  let suggestedFriend=null;
  let friendsRequest=0;
  let challengeBusy=false;
  let loadedDate='';

  async function loadDailyPuzzle(force=false){
    const date=new Date().toISOString().slice(0,10);
    if(!force&&loadedDate===date)return;
    loadedDate=date;
    dailyInfo.textContent='جارٍ تحميل لغز اليوم…';
    try{
      const {data,error}=await supabase.rpc('home_get_daily_puzzle_preview');
      if(error)throw error;
      const record=Array.isArray(data)?data[0]:data;
      if(!record?.fen)throw new Error('daily_puzzle_not_found');
      drawMiniPuzzle(mini,record.fen);
      const rating=Number(record.rating);
      dailyInfo.textContent=record.title
        ?String(record.title).slice(0,80)+(Number.isFinite(rating)?' · '+rating+' نقطة':'')
        :'ابحث عن أفضل نقلة';
    }catch(error){
      console.warn('تعذر جلب معاينة لغز اليوم',error);
      loadedDate='';
      mini.replaceChildren();
      mini.removeAttribute('data-puzzle-ready');
      dailyInfo.textContent='اللغز متاح عند الضغط على زر الحل';
    }
  }

  function presentFriend(friend){
    suggestedFriend=friend||null;
    challengeBusy=false;
    challenge.disabled=false;
    if(!friend){
      friendAvatar.textContent='♟';
      friendName.textContent='لا يوجد صديق مقترح';
      friendMeta.textContent='أضف صديقًا لتحدّيه هنا';
      friendState.textContent='';
      friendState.hidden=true;
      challenge.dataset.homeSideAction='friend';
      challenge.textContent='ابحث عن صديق';
      return;
    }
    const name=String(friend.name||'صديق').trim();
    friendAvatar.textContent=name.charAt(0)||'♟';
    friendName.textContent=name;
    const points=Number(friend.rating);
    friendMeta.textContent=[
      String(friend.city||'').trim(),
      Number.isFinite(points)?points+' نقطة':''
    ].filter(Boolean).join(' · ')||'مباراة 10 دقائق';
    friendState.hidden=false;
    friendState.textContent=friend.is_online?'متصل الآن':'غير متصل حاليًا';
    friendState.classList.toggle('is-online',friend.is_online===true);
    challenge.dataset.homeSideAction='challenge';
    challenge.textContent='تحدّه الآن · 10 دقائق';
  }

  async function loadFriend(){
    const request=++friendsRequest;
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(request!==friendsRequest)return;
      if(!session){
        presentFriend(null);
        friendName.textContent='مباراة مع صديق';
        friendMeta.textContent='سجّل الدخول لعرض صديق من قائمتك';
        challenge.textContent='تسجيل الدخول';
        return;
      }
      friendName.textContent='جارٍ اختيار صديق…';
      friendMeta.textContent='';
      friendState.hidden=true;
      challenge.disabled=true;
      const {data,error}=await supabase.rpc('get_my_friends');
      if(request!==friendsRequest)return;
      if(error)throw error;
      const friends=(Array.isArray(data)?data:[])
        .filter(row=>row?.friend_id&&row?.name)
        .sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
      const online=friends.filter(row=>row.is_online===true);
      const eligible=online.length?online:friends;
      // Stable for the day; prefer online friends without inventing a friendship.
      const index=eligible.length?Number(new Date().toISOString().slice(0,10).replace(/-/g,''))%eligible.length:0;
      presentFriend(eligible[index]||null);
    }catch(error){
      if(request!==friendsRequest)return;
      console.warn('تعذر تحميل الصديق المقترح',error);
      presentFriend(null);
      friendName.textContent='تعذر تحميل الأصدقاء';
      friendMeta.textContent='يمكنك اختيار صديق يدويًا';
    }
  }

  challenge.addEventListener('click',async event=>{
    if(challenge.dataset.homeSideAction!=='challenge'||!suggestedFriend)return;
    event.stopPropagation();
    if(challengeBusy)return;
    challengeBusy=true;
    challenge.disabled=true;
    challenge.textContent='جارٍ إرسال التحدي…';
    try{
      const {error}=await supabase.rpc('send_player_challenge',{
        p_player_id:suggestedFriend.friend_id,p_minutes:10
      });
      if(error)throw error;
      challenge.textContent='تم إرسال التحدي';
      friendState.hidden=false;
      friendState.textContent='بانتظار قبول الصديق';
      friendState.classList.remove('is-online');
    }catch(error){
      console.warn('تعذر إرسال المباراة المقترحة',error);
      const detail=String(error?.message||'').toLowerCase();
      friendState.hidden=false;
      friendState.textContent=detail.includes('already pending')?'يوجد تحدٍّ معلّق بالفعل':
        detail.includes('active game')?'أحدكما في مباراة حاليًا':'تعذر إرسال التحدي، حاول مرة أخرى';
      friendState.classList.remove('is-online');
      challengeBusy=false;
      challenge.disabled=false;
      challenge.textContent='تحدّه الآن · 10 دقائق';
    }
  });
  mini.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){
      event.preventDefault();
      mini.click();
    }
  });
  // Refresh friend suggestions after login/logout, not on every presence heartbeat.
  supabase.auth.onAuthStateChange(event=>{
    if(['SIGNED_IN','SIGNED_OUT'].includes(event)){
      ++friendsRequest;
      setTimeout(()=>void loadFriend(),0);
    }
  });
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden){
      void loadDailyPuzzle();
      void loadFriend();
    }
  });
  void loadDailyPuzzle();
  void loadFriend();
}
