// Canonical personal desktop statistics. All totals come from the authenticated user's
// database records; anonymous visitors never see another player's statistics.
const KEYS=['bullet','blitz','rapid','games','points','puzzles','lessons','wins','achievements'];
const formatter=new Intl.NumberFormat('en-US',{maximumFractionDigits:0});
export function mountPersonalStatistics(supabase){
  const panel=document.getElementById('desktopHomeStatistics');
  if(!panel||panel.dataset.statisticsMounted)return;
  panel.dataset.statisticsMounted='1';
  const status=panel.querySelector('#desktopStatisticsStatus');
  const login=panel.querySelector('[data-stats-login]');
  const values=new Map(KEYS.map(key=>[key,panel.querySelector('[data-stat-value="'+key+'"]')]));
  let request=0;
  let lastLoadedAt=0;
  let lastUserId=null;
  const blank=()=>{
    for(const node of values.values())if(node)node.textContent='—';
  };
  const setStatus=(message)=>{if(status)status.textContent=message;};
  const update=(stats)=>{
    for(const key of KEYS){
      const element=values.get(key);
      if(!element)continue;
      const number=Number(stats?.[key]);
      element.textContent=stats?.[key]!=null&&Number.isSafeInteger(number)&&number>=0
        ?formatter.format(number):'—';
    }
  };
  const guest=()=>{
    blank();
    if(login)login.hidden=false;
    setStatus('سجّل الدخول لعرض إنجازاتك');
    lastUserId=null;
  };
  const refresh=async(force=false)=>{
    if(!supabase){
      blank();
      if(login)login.hidden=true;
      setStatus('الإحصاءات غير متاحة حاليًا');
      return;
    }
    if(!force&&lastLoadedAt&&Date.now()-lastLoadedAt<20000)return;
    const current=++request;
    try{
      const {data:sessionData,error:sessionError}=await supabase.auth.getSession();
      if(current!==request)return;
      if(sessionError)throw sessionError;
      const session=sessionData?.session;
      if(!session?.user){
        guest();
        return;
      }
      if(login)login.hidden=true;
      if(lastUserId!==session.user.id){
        blank();
        lastUserId=session.user.id;
      }
      setStatus('جارٍ تحديث إحصاءاتك…');
      const {data,error}=await supabase.rpc('get_my_home_statistics');
      if(current!==request)return;
      if(error)throw error;
      if(!data||typeof data!=='object'){
        blank();
        setStatus('لم يتم العثور على ملف اللاعب');
        return;
      }
      update(data);
      lastLoadedAt=Date.now();
      setStatus('إنجازاتك المسجلة في الموقع');
    }catch(error){
      if(current!==request)return;
      console.warn('تعذر جلب إحصاءات اللاعب',error);
      blank();
      setStatus('تعذر تحميل الإحصاءات مؤقتًا');
    }
  };
  login?.addEventListener('click',()=>document.getElementById('desktopGuestLogin')?.click());
  window.addEventListener('shatranj:home-statistics-refresh',()=>void refresh());
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)void refresh();
  });
  if(supabase){
    supabase.auth.onAuthStateChange((event)=>{
      if(['INITIAL_SESSION','SIGNED_IN','SIGNED_OUT','TOKEN_REFRESHED','USER_UPDATED'].includes(event)){
        lastLoadedAt=0;
        // Defer auth requests until Supabase has released its auth-state lock.
        setTimeout(()=>void refresh(true),0);
      }
    });
    setInterval(()=>{if(!document.hidden)void refresh();},60000);
  }
  void refresh(true);
}
