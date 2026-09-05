(() => {
  'use strict';
  const cfg = window.SHATRANJ_CONFIG?.supabase;
  const message = document.getElementById('pageMessage');
  const content = document.getElementById('publicContent');
  const toastEl = document.getElementById('toast');
  let toastTimer;
  if (!cfg?.enabled || !cfg.url || !cfg.anonKey || !window.supabase) {
    message.textContent = 'تعذر تهيئة الاتصال بالموقع.';
    return;
  }
  const client = window.supabase.createClient(cfg.url, cfg.anonKey);
  const $ = (id) => document.getElementById(id);
  const SAUDI_REGIONS = new Set(['الرياض','مكة المكرمة','المدينة المنورة','القصيم','المنطقة الشرقية','عسير','تبوك','حائل','الحدود الشمالية','جازان','نجران','الباحة','الجوف']);
  const countryForRegion = (value) => {
    const region = String(value || '').trim();
    return SAUDI_REGIONS.has(region) ? 'السعودية' : region;
  };
  const playerId = new URLSearchParams(location.search).get('id');
  let session = null;
  let profile = null;
  let relationship = { state: 'none', request_id: null };
  const ACHIEVEMENTS = {
    first_win:['♟','أول فوز','تحقيق أول انتصار'],
    wins_10:['♜','10 انتصارات','الوصول إلى 10 انتصارات'],
    games_50:['♞','50 مباراة','إكمال 50 مباراة'],
    streak_5:['♛','سلسلة 5 انتصارات','خمسة انتصارات متتالية'],
    rating_1600:['★','1600','الوصول إلى تصنيف 1600'],
    rating_1800:['★★','1800','الوصول إلى تصنيف 1800'],
    rating_2000:['♚','2000','الوصول إلى تصنيف 2000']
  };


  const esc = (value) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const initial = (name) => (String(name || 'ل').trim().charAt(0) || 'ل').toUpperCase();

  function rankForRating(rating) {
    const points = Number(rating) || 0;
    if (points >= 3000) return { key: 'champion', label: 'بطل', icon: 'rank-trophy' };
    if (points >= 2700) return { key: 'elite', label: 'نخبة', icon: 'rank-crown' };
    if (points >= 2400) return { key: 'professional', label: 'محترف', icon: 'rank-queen' };
    if (points >= 2100) return { key: 'advanced', label: 'متقدم', icon: 'rank-rook' };
    if (points >= 1800) return { key: 'competitor', label: 'منافس', icon: 'rank-knight' };
    return { key: 'beginner', label: 'مبتدئ', icon: 'rank-pawn' };
  }

  function renderPublicRank(rating) {
    const rank = rankForRating(rating);
    const badge = $('publicRankBadge');
    if (!badge) return;
    badge.dataset.rank = rank.key;
    $('publicRankLabel').textContent = rank.label;
    $('publicRankUse').setAttribute('href', `#${rank.icon}`);
  }

  function toast(text, error=false) {
    clearTimeout(toastTimer);
    toastEl.textContent = text;
    toastEl.className = `toast show${error ? ' error' : ''}`;
    toastTimer = setTimeout(() => toastEl.className='toast', 3000);
  }

  function showAvatar(path, name) {
    const img = $('publicAvatar');
    const fallback = $('publicAvatarFallback');
    fallback.textContent = initial(name);
    const url = client.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    img.onload = () => { img.hidden=false; fallback.hidden=true; };
    img.onerror = () => { img.hidden=true; fallback.hidden=false; };
    img.src = url;
  }

  function renderChart(history) {
    const box = $('publicRatingChart');
    if (!history?.length) {
      box.innerHTML = `<div class="empty">لا توجد تغيّرات في التصنيف بعد.<br>التصنيف الحالي: <strong>${esc(profile.rating)}</strong></div>`;
      return;
    }
    const values = [Number(history[0].old_rating), ...history.map(x => Number(x.new_rating))];
    const min = Math.min(...values), max = Math.max(...values), pad = Math.max(10,Math.ceil((max-min)*.15));
    const lo=min-pad, hi=max+pad, w=600,h=180,px=38,py=22;
    const x=i => values.length===1 ? w/2 : px+i*((w-px*2)/(values.length-1));
    const y=v => h-py-((v-lo)/Math.max(1,hi-lo))*(h-py*2);
    const points=values.map((v,i)=>`${x(i)},${y(v)}`).join(' ');
    const grid=[0,.5,1].map(t=>{const yy=py+t*(h-py*2),val=Math.round(hi-t*(hi-lo));return `<line class="chart-grid" x1="${px}" y1="${yy}" x2="${w-px}" y2="${yy}"/><text class="chart-label" x="${px-8}" y="${yy+4}" text-anchor="end">${val}</text>`}).join('');
    const dots=values.map((v,i)=>`<circle class="chart-dot" cx="${x(i)}" cy="${y(v)}" r="3.8"/>`).join('');
    box.innerHTML=`<svg viewBox="0 0 ${w} ${h}" aria-label="منحنى التصنيف">${grid}<polyline class="chart-line" points="${points}"/>${dots}</svg>`;
  }

  function renderGames(games) {
    if (!games?.length) { $('publicRecentGames').innerHTML='<div class="empty">لا توجد مباريات منتهية حتى الآن.</div>'; return; }
    $('publicRecentGames').innerHTML=games.map(g=>{
      const label=g.outcome==='win'?'فوز':g.outcome==='loss'?'خسارة':'تعادل';
      const cls=g.outcome==='win'?'win':g.outcome==='loss'?'loss':'draw';
      const kind=Number(g.rating_step)===1?'تحدي صديق':'بحث عشوائي';
      return `<div class="row"><div><div class="row-title">${esc(g.opponent_name || 'خصم')}</div><div class="row-meta">${esc(g.time_control_minutes)} دقائق • ${new Date(g.played_at).toLocaleDateString('ar-SA')}</div></div><div class="chips"><span class="kind">${kind}</span><span class="result ${cls}">${label}</span></div></div>`;
    }).join('');
  }

  function renderAchievements(rows) {
    const host = $('publicAchievementsList');
    if (!rows?.length) {
      host.innerHTML = '<div class="empty">لا توجد شارات مكتسبة حتى الآن.</div>';
      return;
    }
    host.innerHTML = rows.map(row => {
      const meta = ACHIEVEMENTS[row.achievement_code] || ['◆',row.achievement_code,'إنجاز'];
      return `<div class="achievement"><div class="ico">${meta[0]}</div><div><div class="name">${esc(meta[1])}</div><div class="hint">${esc(meta[2])} • ${new Date(row.earned_at).toLocaleDateString('ar-SA')}</div></div></div>`;
    }).join('');
  }

  async function getFriendPresence() {
    if (!session || relationship.state!=='friends') return null;
    const { data, error } = await client.rpc('get_my_friends_presence');
    if (error) return null;
    return (data || []).find(x => x.player_id===playerId)?.is_online ?? false;
  }

  async function renderFriendAction() {
    const host=$('friendAction');
    if (profile?.is_synthetic) { host.innerHTML=''; return; }
    if (!session) {
      host.innerHTML='<a class="btn gold" href="index.html#register">سجل الدخول لإضافة صديق</a>';
      return;
    }
    const { data, error } = await client.rpc('get_friend_relationship_status',{p_player_id:playerId});
    if (error) { host.innerHTML=''; return; }
    relationship=(Array.isArray(data)?data[0]:data) || {state:'none',request_id:null};
    if (relationship.state==='self') {
      host.innerHTML='<a class="btn gold" href="profile.html">لوحة التحكم</a>';
    } else if (relationship.state==='none') {
      host.innerHTML='<button class="btn gold" type="button" data-rel-action="send">إضافة صديق</button>';
    } else if (relationship.state==='outgoing') {
      host.innerHTML='<button class="btn" type="button" data-rel-action="cancel">طلب صداقة مُرسل — إلغاء</button>';
    } else if (relationship.state==='incoming') {
      host.innerHTML='<button class="btn gold" type="button" data-rel-action="accept">قبول طلب الصداقة</button><button class="btn" type="button" data-rel-action="reject">رفض</button>';
    } else if (relationship.state==='friends') {
      const online=await getFriendPresence();
      host.innerHTML=`<button class="btn" type="button" disabled>صديق</button><div class="friend-state"><span class="presence"><span class="dot ${online?'online':''}"></span>${online?'متصل الآن':'غير متصل'}</span></div>`;
    }
  }

  async function handleRelation(action, button) {
    button.disabled=true;
    try {
      let error;
      if (action==='send') ({error}=await client.rpc('send_friend_request',{p_player_id:playerId}));
      else if (action==='cancel') ({error}=await client.rpc('cancel_friend_request',{p_request_id:relationship.request_id}));
      else if (action==='accept') ({error}=await client.rpc('respond_friend_request',{p_request_id:relationship.request_id,p_accept:true}));
      else if (action==='reject') ({error}=await client.rpc('respond_friend_request',{p_request_id:relationship.request_id,p_accept:false}));
      if (error) throw error;
      toast(action==='send'?'تم إرسال طلب الصداقة.':action==='accept'?'تم قبول طلب الصداقة.':'تم تحديث الطلب.');
      await renderFriendAction();
      const {data: fresh}=await client.rpc('get_public_player_profile',{p_player_id:playerId});
      const row=Array.isArray(fresh)?fresh[0]:fresh;
      if (row) $('sFriends').textContent=row.friend_count;
    } catch (err) { toast(err.message || 'تعذر تنفيذ العملية.',true); }
    finally { button.disabled=false; }
  }

  document.addEventListener('click',e=>{
    const button=e.target.closest('[data-rel-action]');
    if (button) handleRelation(button.dataset.relAction,button);
  });

  (async()=>{
    if (!playerId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(playerId)) {
      message.textContent='اللاعب غير موجود.'; return;
    }
    try {
      const {data:authData}=await client.auth.getSession();
      session=authData.session;
      const [{data:pData,error:pErr},{data:hData,error:hErr},{data:gData,error:gErr},{data:aData,error:aErr}]=await Promise.all([
        client.rpc('get_public_player_profile',{p_player_id:playerId}),
        client.rpc('get_public_player_rating_history',{p_player_id:playerId}),
        client.rpc('get_public_player_recent_games',{p_player_id:playerId,p_limit:10}),
        client.rpc('get_public_player_achievements',{p_player_id:playerId})
      ]);
      if (pErr) throw pErr;if(hErr) throw hErr;if(gErr) throw gErr;if(aErr) throw aErr;
      profile=Array.isArray(pData)?pData[0]:pData;
      if (!profile) { message.textContent='الملف غير متاح حاليًا.'; return; }
      $('publicName').textContent=profile.name;
      renderPublicRank(profile.rating);
      $('publicMeta').textContent=[profile.username?`@${profile.username}`:'',profile.city,countryForRegion(profile.region),profile.is_synthetic?'تجريبي':''].filter(Boolean).join(' • ');
      $('publicRating').textContent=profile.rating;$('sRating').textContent=profile.rating;$('sGames').textContent=profile.games_count;$('sWins').textContent=profile.wins;$('sDraws').textContent=profile.draws;$('sLosses').textContent=profile.losses;$('sFriends').textContent=profile.friend_count;
      showAvatar(profile.avatar_path || `${profile.id}/avatar.webp`,profile.name);
      renderChart(hData || []);renderGames(gData || []);renderAchievements(aData || []);
      await renderFriendAction();
      message.hidden=true;content.hidden=false;
    } catch(err) { console.error(err);message.textContent='تعذر تحميل ملف اللاعب.'; }
  })();
})();
