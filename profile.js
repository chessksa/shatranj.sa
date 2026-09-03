(() => {
  'use strict';

  const cfg = window.SHATRANJ_CONFIG?.supabase;
  const loading = document.getElementById('loadingState');
  const dashboard = document.getElementById('dashboard');
  const toastEl = document.getElementById('toast');
  let toastTimer;

  if (!cfg?.enabled || !cfg.url || !cfg.anonKey || !window.supabase) {
    loading.textContent = 'تعذر تهيئة الاتصال بالموقع.';
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.anonKey);
  let session;
  let myProfile;
  let publicProfile;
  let challengeTargetId = null;
  let challengePolling = false;

  const $ = (id) => document.getElementById(id);
  function rankForRating(rating) {
    const points = Number(rating) || 0;
    if (points >= 3000) return { key: 'champion', label: 'بطل', icon: 'rank-trophy' };
    if (points >= 2700) return { key: 'elite', label: 'نخبة', icon: 'rank-crown' };
    if (points >= 2400) return { key: 'professional', label: 'محترف', icon: 'rank-queen' };
    if (points >= 2100) return { key: 'advanced', label: 'متقدم', icon: 'rank-rook' };
    if (points >= 1800) return { key: 'competitor', label: 'منافس', icon: 'rank-knight' };
    return { key: 'beginner', label: 'مبتدئ', icon: 'rank-pawn' };
  }

  function renderPlayerRank(rating) {
    const rank = rankForRating(rating);
    const badge = $('playerRankBadge');
    badge.dataset.rank = rank.key;
    $('playerRankLabel').textContent = rank.label;
    $('playerRankUse').setAttribute('href', `#${rank.icon}`);
  }

  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  function toast(message, isError = false) {
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.className = `toast show${isError ? ' error' : ''}`;
    toastTimer = setTimeout(() => { toastEl.className = 'toast'; }, 3200);
  }

  function initial(name) {
    return (String(name || 'ل').trim().charAt(0) || 'ل').toUpperCase();
  }

  function showAvatar(url, fallbackName, legacyUrl) {
    const img = $('avatarImage');
    const fallback = $('avatarFallback');
    fallback.textContent = initial(fallbackName);
    let triedLegacy = false;
    img.onerror = () => {
      if (!triedLegacy && legacyUrl) {
        triedLegacy = true;
        img.src = legacyUrl;
        return;
      }
      img.hidden = true;
      fallback.hidden = false;
    };
    img.onload = () => {
      fallback.hidden = true;
      img.hidden = false;
    };
    img.src = url;
  }

  function publicAvatarUrl(path) {
    return client.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  }

  async function loadBaseProfile() {
    const { data, error } = await client.rpc('get_my_player_profile');
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.id) throw new Error('لم يتم العثور على ملف اللاعب.');
    myProfile = row;

    const { data: pub, error: pubError } = await client.rpc('get_public_player_profile', { p_player_id: row.id });
    if (pubError) throw pubError;
    publicProfile = Array.isArray(pub) ? pub[0] : pub;

    $('playerName').textContent = row.name;
    const username = publicProfile?.username ? `@${publicProfile.username}` : '';
    $('playerMeta').textContent = [username, row.city, row.region].filter(Boolean).join(' • ');
    $('heroRating').textContent = row.rating;
    renderPlayerRank(row.rating);
    $('statRating').textContent = row.rating;
    $('statGames').textContent = row.games_count;
    $('statWins').textContent = row.wins;
    $('statDraws').textContent = row.draws;
    $('statLosses').textContent = row.losses;
    $('friendsCount').textContent = publicProfile?.friend_count ?? 0;
    $('publicProfileLink').href = `player.html?id=${encodeURIComponent(row.id)}`;

    const newPath = publicProfile?.avatar_path || `${row.id}/avatar.webp`;
    const legacyPath = `${session.user.id}/avatar.webp`;
    showAvatar(publicAvatarUrl(newPath), row.name, publicAvatarUrl(legacyPath));
  }

  async function loadProfileNavigationCounts() {
    if (challengePolling) return;
    challengePolling = true;
    try {
      const [{ data: friends, error: fErr }, { data: requests, error: rErr }, { data: challenges, error: cErr }] = await Promise.all([
        client.rpc('get_my_friends'),
        client.rpc('get_my_friend_requests'),
        client.rpc('get_my_friend_challenges')
      ]);
      if (fErr) throw fErr;
      if (rErr) throw rErr;
      if (cErr) throw cErr;
      const friendRequests = requests || [];
      const challengeRows = challenges || [];
      $('friendsCount').textContent = (friends || []).length;
      $('incomingCount').textContent = friendRequests.filter(r => r.direction === 'incoming').length;
      $('outgoingCount').textContent = friendRequests.filter(r => r.direction === 'outgoing').length;
      $('incomingChallengesCount').textContent = challengeRows.filter(r => r.direction === 'incoming' && r.status === 'pending').length;
      $('outgoingChallengesCount').textContent = challengeRows.filter(r => r.direction === 'outgoing' && r.status === 'pending').length;
      const acceptedOutgoing = challengeRows.find(r => r.direction === 'outgoing' && r.status === 'accepted' && r.game_id);
      if (acceptedOutgoing && sessionStorage.getItem('shatranj_last_opened_friend_challenge') !== acceptedOutgoing.challenge_id) {
        sessionStorage.setItem('shatranj_last_opened_friend_challenge', acceptedOutgoing.challenge_id);
        await enterChallenge(acceptedOutgoing.challenge_id);
      }
    } finally {
      challengePolling = false;
    }
  }
  function friendRow(friend) {
    const online = friend.is_online;
    return `<div class="row" data-friend="${esc(friend.friend_id)}">
      <div><div class="row-title">${esc(friend.name)}</div>
        <div class="row-meta"><span class="presence"><span class="dot ${online ? 'online' : ''}"></span>${online ? 'متصل الآن' : 'غير متصل'}</span> • ${esc(friend.city)} • ${esc(friend.rating)} نقطة</div>
      </div>
      <div class="row-actions">
        <a class="mini" href="player.html?id=${encodeURIComponent(friend.friend_id)}">الملف العام</a>
        <button class="mini ok" data-action="challenge-friend" data-id="${esc(friend.friend_id)}" data-name="${esc(friend.name)}" type="button">تحدي</button>
        <button class="mini no" data-action="remove-friend" data-id="${esc(friend.friend_id)}" type="button">إزالة</button>
      </div>
    </div>`;
  }

  function requestRow(req) {
    const incoming = req.direction === 'incoming';
    return `<div class="row">
      <div><div class="row-title">${esc(req.other_name)}</div><div class="row-meta">${esc(req.other_city)} • ${esc(req.other_rating)} نقطة</div></div>
      <div class="row-actions">
        <a class="mini" href="player.html?id=${encodeURIComponent(req.other_player_id)}">الملف</a>
        ${incoming
          ? `<button class="mini ok" data-action="accept-request" data-id="${esc(req.request_id)}" type="button">قبول</button><button class="mini no" data-action="reject-request" data-id="${esc(req.request_id)}" type="button">رفض</button>`
          : `<button class="mini no" data-action="cancel-request" data-id="${esc(req.request_id)}" type="button">إلغاء الطلب</button>`}
      </div>
    </div>`;
  }

  async function loadFriendsAndRequests() {
    const [{ data: friends, error: fErr }, { data: requests, error: rErr }] = await Promise.all([
      client.rpc('get_my_friends'), client.rpc('get_my_friend_requests')
    ]);
    if (fErr) throw fErr;
    if (rErr) throw rErr;

    $('friendsList').innerHTML = friends?.length ? friends.map(friendRow).join('') : '<div class="empty">لا يوجد أصدقاء حتى الآن.</div>';
    $('friendsCount').textContent = friends?.length || 0;
    const incoming = (requests || []).filter(r => r.direction === 'incoming');
    const outgoing = (requests || []).filter(r => r.direction === 'outgoing');
    $('incomingRequests').innerHTML = incoming.length ? incoming.map(requestRow).join('') : '<div class="empty">لا توجد طلبات واردة.</div>';
    $('outgoingRequests').innerHTML = outgoing.length ? outgoing.map(requestRow).join('') : '<div class="empty">لا توجد طلبات مرسلة.</div>';
    $('incomingCount').textContent = incoming.length;
    $('outgoingCount').textContent = outgoing.length;
  }

  function storeChallengeAccess(row, challengeId) {
    if (!row?.game_id || !row?.seat_key || !row?.color) throw new Error('تعذر فتح مباراة التحدي.');
    sessionStorage.setItem('shatranj_live_game_id', row.game_id);
    sessionStorage.setItem('shatranj_live_game_code', row.game_code || '');
    sessionStorage.setItem('shatranj_live_seat_key', row.seat_key);
    sessionStorage.setItem('shatranj_live_color', row.color);
    sessionStorage.setItem('shatranj_friend_challenge_id', challengeId);
    location.href = `play-v8.html?game=${encodeURIComponent(row.game_id)}&challenge=${encodeURIComponent(challengeId)}`;
  }

  async function enterChallenge(challengeId) {
    const { data, error } = await client.rpc('get_my_challenge_game_access', { p_challenge_id: challengeId });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.state !== 'accepted') return false;
    storeChallengeAccess(row, challengeId);
    return true;
  }

  function challengeRow(ch) {
    const incoming = ch.direction === 'incoming';
    const pending = ch.status === 'pending';
    const seconds = Math.max(0, Number(ch.seconds_remaining || 0));
    const mins = Math.floor(seconds / 60);
    const secs = String(seconds % 60).padStart(2, '0');
    return `<div class="row" data-challenge="${esc(ch.challenge_id)}">
      <div><div class="row-title">${esc(ch.other_name)}</div>
        <div class="row-meta">${esc(ch.minutes)} دقائق • ${pending ? `ينتهي خلال ${mins}:${secs}` : esc(ch.status)}</div>
      </div>
      <div class="row-actions">
        <a class="mini" href="player.html?id=${encodeURIComponent(ch.other_player_id)}">الملف</a>
        ${pending && incoming ? `<button class="mini ok" data-action="accept-challenge" data-id="${esc(ch.challenge_id)}" type="button">قبول</button><button class="mini no" data-action="reject-challenge" data-id="${esc(ch.challenge_id)}" type="button">رفض</button>` : ''}
        ${pending && !incoming ? `<button class="mini no" data-action="cancel-challenge" data-id="${esc(ch.challenge_id)}" type="button">إلغاء</button>` : ''}
        ${ch.status === 'accepted' && ch.game_id ? `<button class="mini ok" data-action="open-challenge" data-id="${esc(ch.challenge_id)}" type="button">فتح المباراة</button>` : ''}
      </div>
    </div>`;
  }

  async function loadChallenges({ autoEnter = true } = {}) {
    if (challengePolling) return;
    challengePolling = true;
    try {
      const { data, error } = await client.rpc('get_my_friend_challenges');
      if (error) throw error;
      const rows = data || [];
      const incoming = rows.filter(r => r.direction === 'incoming' && r.status === 'pending');
      const outgoing = rows.filter(r => r.direction === 'outgoing' && r.status === 'pending');
      $('incomingChallenges').innerHTML = incoming.length ? incoming.map(challengeRow).join('') : '<div class="empty">لا توجد تحديات واردة.</div>';
      $('outgoingChallenges').innerHTML = outgoing.length ? outgoing.map(challengeRow).join('') : '<div class="empty">لا توجد تحديات مرسلة.</div>';
      $('incomingChallengesCount').textContent = incoming.length;
      $('outgoingChallengesCount').textContent = outgoing.length;

      if (autoEnter) {
        const acceptedOutgoing = rows.find(r => r.direction === 'outgoing' && r.status === 'accepted' && r.game_id);
        if (acceptedOutgoing && sessionStorage.getItem('shatranj_last_opened_friend_challenge') !== acceptedOutgoing.challenge_id) {
          sessionStorage.setItem('shatranj_last_opened_friend_challenge', acceptedOutgoing.challenge_id);
          await enterChallenge(acceptedOutgoing.challenge_id);
        }
      }
    } finally {
      challengePolling = false;
    }
  }

  function openChallengeModal(id, name) {
    challengeTargetId = id;
    $('challengeTargetName').textContent = `تحدي ${name || 'الصديق'} — اختر زمن المباراة.`;
    $('challengeMinutes').value = '3';
    $('challengeModal').hidden = false;
  }

  function closeChallengeModal() {
    challengeTargetId = null;
    $('challengeModal').hidden = true;
  }

  function outcomeArabic(outcome) {
    return outcome === 'win' ? ['فوز','win'] : outcome === 'loss' ? ['خسارة','loss'] : ['تعادل','draw'];
  }

  async function loadRecentGames() {
    const { data, error } = await client.rpc('get_public_player_recent_games', { p_player_id: myProfile.id, p_limit: 10 });
    if (error) throw error;
    if (!data?.length) {
      $('recentGames').innerHTML = '<div class="empty">لا توجد مباريات منتهية حتى الآن.</div>';
      return;
    }
    $('recentGames').innerHTML = data.map(game => {
      const [label, cls] = outcomeArabic(game.outcome);
      const kind = Number(game.rating_step) === 1 ? 'تحدي صديق' : 'بحث عشوائي';
      return `<div class="row"><div><div class="row-title">${esc(game.opponent_name || 'خصم')}</div><div class="row-meta">${esc(game.time_control_minutes)} دقائق • ${new Date(game.played_at).toLocaleDateString('ar-SA')}</div></div><div class="row-actions"><span class="game-kind">${kind}</span><span class="game-result ${cls}">${label}</span></div></div>`;
    }).join('');
  }

  async function heartbeatAndRefreshFriends() {
    if (document.hidden || !myProfile) return;
    try {
      await client.rpc('heartbeat_player_presence');
      await loadProfileNavigationCounts();
    } catch (err) {
      console.warn('presence refresh failed', err);
    }
  }

  async function handleAction(button) {
    const action = button.dataset.action;
    const id = button.dataset.id;
    button.disabled = true;
    try {
      if (action === 'challenge-friend') {
        openChallengeModal(id, button.dataset.name);
        return;
      } else if (action === 'accept-challenge') {
        const { data, error } = await client.rpc('respond_friend_challenge', { p_challenge_id: id, p_accept: true });
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        toast('تم قبول التحدي.');
        storeChallengeAccess(row, id);
        return;
      } else if (action === 'reject-challenge') {
        const { error } = await client.rpc('respond_friend_challenge', { p_challenge_id: id, p_accept: false });
        if (error) throw error;
        toast('تم رفض التحدي.');
      } else if (action === 'cancel-challenge') {
        const { error } = await client.rpc('cancel_friend_challenge', { p_challenge_id: id });
        if (error) throw error;
        toast('تم إلغاء التحدي.');
      } else if (action === 'open-challenge') {
        await enterChallenge(id);
        return;
      } else if (action === 'accept-request') {
        const { error } = await client.rpc('respond_friend_request', { p_request_id: id, p_accept: true });
        if (error) throw error;
        toast('تم قبول طلب الصداقة.');
      } else if (action === 'reject-request') {
        const { error } = await client.rpc('respond_friend_request', { p_request_id: id, p_accept: false });
        if (error) throw error;
        toast('تم رفض الطلب.');
      } else if (action === 'cancel-request') {
        const { error } = await client.rpc('cancel_friend_request', { p_request_id: id });
        if (error) throw error;
        toast('تم إلغاء الطلب.');
      } else if (action === 'remove-friend') {
        if (!confirm('إزالة هذا اللاعب من قائمة الأصدقاء؟')) return;
        const { error } = await client.rpc('remove_friend', { p_player_id: id });
        if (error) throw error;
        toast('تمت إزالة الصديق.');
      }
      await Promise.all([loadFriendsAndRequests(), loadBaseProfile(), loadChallenges({ autoEnter: false })]);
    } catch (err) {
      toast(err.message || 'تعذر تنفيذ العملية.', true);
    } finally {
      button.disabled = false;
    }
  }

  async function resizeToWebp(file) {
    if (file.size > 8 * 1024 * 1024) throw new Error('حجم الصورة يجب ألا يتجاوز 8 ميجابايت.');
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('اختر صورة JPG أو PNG أو WebP.');
    const bitmap = await createImageBitmap(file);
    const max = 512;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(bitmap,0,0,w,h);
    bitmap.close?.();
    return await new Promise((resolve,reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('تعذر معالجة الصورة.')), 'image/webp', .86));
  }

  async function uploadAvatar(file) {
    const blob = await resizeToWebp(file);
    const path = `${myProfile.id}/avatar.webp`;
    const { error } = await client.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/webp', cacheControl: '3600' });
    if (error) throw error;
    showAvatar(`${publicAvatarUrl(path)}?v=${Date.now()}`, myProfile.name, null);
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (button) handleAction(button);
  });

  $('avatarInput').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { await uploadAvatar(file); toast('تم تحديث الصورة.'); }
    catch (err) { toast(err.message || 'تعذر رفع الصورة.', true); }
    event.target.value = '';
  });

  $('sendChallengeBtn').addEventListener('click', async () => {
    if (!challengeTargetId) return;
    const button = $('sendChallengeBtn');
    button.disabled = true;
    try {
      const minutes = Number($('challengeMinutes').value);
      const { error } = await client.rpc('send_friend_challenge', { p_player_id: challengeTargetId, p_minutes: minutes });
      if (error) throw error;
      closeChallengeModal();
      toast('تم إرسال التحدي. صلاحيته 5 دقائق.');
      await loadChallenges({ autoEnter: false });
    } catch (err) {
      toast(err.message || 'تعذر إرسال التحدي.', true);
    } finally {
      button.disabled = false;
    }
  });

  $('cancelChallengeModalBtn').addEventListener('click', closeChallengeModal);
  $('challengeModal').addEventListener('click', (event) => { if (event.target === $('challengeModal')) closeChallengeModal(); });

  $('logoutBtn').addEventListener('click', async () => {
    await client.auth.signOut();
    location.href = 'index.html';
  });

  document.addEventListener('visibilitychange', () => { if (!document.hidden) heartbeatAndRefreshFriends(); });

  (async () => {
    try {
      const { data: authData } = await client.auth.getSession();
      session = authData.session;
      if (!session) {
        location.href = 'index.html#register';
        return;
      }
      await loadBaseProfile();
      await client.rpc('heartbeat_player_presence');
      await Promise.all([loadProfileNavigationCounts(), loadRecentGames()]);
      loading.hidden = true;
      dashboard.hidden = false;
      setInterval(heartbeatAndRefreshFriends, 30000);
      setInterval(() => { if (!document.hidden) loadProfileNavigationCounts().catch(err => console.warn('profile counters refresh failed', err)); }, 3000);
    } catch (err) {
      console.error(err);
      loading.textContent = err.message || 'تعذر تحميل لوحة اللاعب.';
    }
  })();
})();
