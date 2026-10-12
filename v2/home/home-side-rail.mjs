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
  const solvers=rail.querySelector('[data-daily-solver-count]');
  const friendName=rail.querySelector('[data-suggested-friend-name]');
  const timeLabel=rail.querySelector('[data-suggested-time-label]');
  const minutesSelect=rail.querySelector('[data-suggested-time]');
  const message=rail.querySelector('[data-suggested-message]');
  const challenge=rail.querySelector('[data-home-side-action="friend"]');
  if(!mini||!dailyInfo||!solvers||!friendName||!timeLabel||!minutesSelect||!message||!challenge)return;
  let suggestedFriend=null;
  let friendsRequest=0;
  let challengeBusy=false;
  let loadedDate='';

  function setMessage(value){
    message.textContent=value||'';
    message.hidden=!value;
  }

  async function loadSolverCount(){
    try{
      const {data,error}=await supabase.rpc('home_get_daily_puzzle_solvers');
      if(error)throw error;
      const count=Number(Array.isArray(data)?data[0]:data);
      solvers.textContent=Number.isFinite(count)?String(Math.max(0,count)):'—';
    }catch(error){
      console.warn('تعذر تحديث عدد من حلوا لغز اليوم',error);
      solvers.textContent='—';
    }
  }

  async function loadDailyPuzzle(force=false){
    const today=new Date().toISOString().slice(0,10);
    if(!force&&loadedDate===today)return;
    loadedDate=today;
    dailyInfo.textContent='جارٍ تحميل لغز اليوم…';
    try{
      const {data,error}=await supabase.rpc('home_get_daily_puzzle_preview');
      if(error)throw error;
      const record=Array.isArray(data)?data[0]:data;
      if(!record?.fen)throw new Error('daily_puzzle_not_found');
      drawMiniPuzzle(mini,record.fen);
      const rating=Number(record.rating);
      dailyInfo.textContent=(record.title||'لغز تكتيكي صعب')+
        (Number.isFinite(rating)?' · '+rating+' نقطة':'');
    }catch(error){
      console.warn('تعذر جلب معاينة لغز اليوم',error);
      loadedDate='';
      mini.replaceChildren();
      mini.removeAttribute('data-puzzle-ready');
      dailyInfo.textContent='اللغز متاح عند الضغط على زر الحل';
    }
    void loadSolverCount();
  }

  function presentFriend(friend){
    suggestedFriend=friend||null;
    challengeBusy=false;
    setMessage('');
    minutesSelect.value='';
    challenge.disabled=false;
    if(!friend){
      friendName.textContent='لا يوجد صديق مقترح';
      timeLabel.hidden=true;
      challenge.dataset.homeSideAction='friend';
      challenge.textContent='اختر صديقًا';
      return;
    }
    friendName.textContent='العب مع '+String(friend.name).trim();
    timeLabel.hidden=false;
    challenge.dataset.homeSideAction='challenge';
    challenge.textContent='اختر وقت المباراة';
    challenge.disabled=true;
  }

  async function loadFriend(){
    const request=++friendsRequest;
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(request!==friendsRequest)return;
      if(!session){
        presentFriend(null);
        friendName.textContent='سجّل الدخول لاختيار صديق';
        challenge.textContent='تسجيل الدخول';
        return;
      }
      friendName.textContent='جارٍ اختيار صديق…';
      timeLabel.hidden=true;
      challenge.disabled=true;
      const {data,error}=await supabase.rpc('get_my_friends');
      if(request!==friendsRequest)return;
      if(error)throw error;
      const friends=(Array.isArray(data)?data:[])
        .filter(friend=>friend?.friend_id&&friend?.name)
        .sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
      const available=friends.filter(friend=>friend.is_online===true);
      const eligible=available.length?available:friends;
      const day=Math.floor(Date.now()/86400000);
      presentFriend(eligible.length?eligible[day%eligible.length]:null);
    }catch(error){
      if(request!==friendsRequest)return;
      console.warn('تعذر تحميل الأصدقاء',error);
      presentFriend(null);
      friendName.textContent='تعذر اختيار صديق حاليًا';
    }
  }

  minutesSelect.addEventListener('change',()=>{
    if(!suggestedFriend||challengeBusy)return;
    const valid=['5','10','15'].includes(minutesSelect.value);
    challenge.disabled=!valid;
    challenge.textContent=valid?'أرسل التحدي':'اختر وقت المباراة';
    setMessage('');
  });

  challenge.addEventListener('click',async event=>{
    if(challenge.dataset.homeSideAction!=='challenge'||!suggestedFriend)return;
    event.stopPropagation();
    const minutes=Number(minutesSelect.value);
    if(![5,10,15].includes(minutes)||challengeBusy)return;
    challengeBusy=true;
    minutesSelect.disabled=true;
    challenge.disabled=true;
    challenge.textContent='جارٍ إرسال التحدي…';
    try{
      const {error}=await supabase.rpc('send_player_challenge',{
        p_player_id:suggestedFriend.friend_id,p_minutes:minutes
      });
      if(error)throw error;
      challenge.textContent='تم إرسال التحدي';
      setMessage('بانتظار قبول الصديق');
    }catch(error){
      console.warn('تعذر إرسال المباراة المقترحة',error);
      const detail=String(error?.message||'').toLowerCase();
      setMessage(detail.includes('already pending')?'يوجد تحدٍّ معلّق بالفعل':
        detail.includes('active game')?'أحدكما في مباراة حاليًا':'تعذر إرسال التحدي، حاول مرة أخرى');
      challengeBusy=false;
      minutesSelect.disabled=false;
      challenge.disabled=false;
      challenge.textContent='أرسل التحدي';
    }
  });
  mini.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){
      event.preventDefault();
      mini.click();
    }
  });
  supabase.auth.onAuthStateChange(event=>{
    if(['SIGNED_IN','SIGNED_OUT'].includes(event)){
      ++friendsRequest;
      setTimeout(()=>void loadFriend(),0);
    }
  });
  window.addEventListener('shatranj:daily-puzzle-solved',()=>void loadSolverCount());
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden){
      void loadDailyPuzzle();
      void loadSolverCount();
      void loadFriend();
    }
  });
  void loadDailyPuzzle();
  void loadFriend();
}
