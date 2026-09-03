(() => {
  'use strict';

  const cfg = window.SHATRANJ_CONFIG?.supabase;
  const loading = document.getElementById('loadingState');
  const list = document.getElementById('sectionList');
  const title = document.getElementById('sectionTitle');
  const count = document.getElementById('sectionCount');
  const toastEl = document.getElementById('toast');
  const $ = (id) => document.getElementById(id);
  let toastTimer;
  let challengeTargetId = null;
  let session;

  const SECTION_CONFIG = {
    friends: { title: 'الأصدقاء', kind: 'friends' },
    'friend-requests': { title: 'طلبات الصداقة', kind: 'requests', direction: 'incoming' },
    'sent-requests': { title: 'الطلبات المرسلة', kind: 'requests', direction: 'outgoing' },
    challenges: { title: 'التحديات', kind: 'challenges', direction: 'incoming' },
    'sent-challenges': { title: 'التحديات المرسلة', kind: 'challenges', direction: 'outgoing' }
  };

  const sectionKey = new URLSearchParams(location.search).get('section');
  const currentSection = SECTION_CONFIG[sectionKey] || SECTION_CONFIG.friends;

  if (!cfg?.enabled || !cfg.url || !cfg.anonKey || !window.supabase) {
    loading.textContent = 'تعذر تهيئة الاتصال بالموقع.';
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.anonKey);
  title.textContent = currentSection.title;
  document.title = `${currentSection.title} | شطرنج السعودية`;

  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  function toast(message, isError = false) {
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.className = `toast show${isError ? ' error' : ''}`;
    toastTimer = setTimeout(() => { toastEl.className = 'toast'; }, 3000);
  }

  function friendRow(friend) {
    const online = !!friend.is_online;
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

  function challengeRow(ch) {
    const incoming = ch.direction === 'incoming';
    const seconds = Math.max(0, Number(ch.seconds_remaining || 0));
    const mins = Math.floor(seconds / 60);
    const secs = String(seconds % 60).padStart(2, '0');
    return `<div class="row" data-challenge="${esc(ch.challenge_id)}">
      <div><div class="row-title">${esc(ch.other_name)}</div><div class="row-meta">${esc(ch.minutes)} دقائق • ينتهي خلال ${mins}:${secs}</div></div>
      <div class="row-actions">
        <a class="mini" href="player.html?id=${encodeURIComponent(ch.other_player_id)}">الملف</a>
        ${incoming ? `<button class="mini ok" data-action="accept-challenge" data-id="${esc(ch.challenge_id)}" type="button">قبول</button><button class="mini no" data-action="reject-challenge" data-id="${esc(ch.challenge_id)}" type="button">رفض</button>` : `<button class="mini no" data-action="cancel-challenge" data-id="${esc(ch.challenge_id)}" type="button">إلغاء</button>`}
        ${ch.game_id ? `<button class="mini ok" data-action="open-challenge" data-id="${esc(ch.challenge_id)}" type="button">فتح المباراة</button>` : ''}
      </div>
    </div>`;
  }

  async function loadSection() {
    let rows = [];
    if (currentSection.kind === 'friends') {
      const { data, error } = await client.rpc('get_my_friends');
      if (error) throw error;
      rows = data || [];
      list.innerHTML = rows.length ? rows.map(friendRow).join('') : '<div class="empty">لا يوجد أصدقاء حتى الآن.</div>';
    } else if (currentSection.kind === 'requests') {
      const { data, error } = await client.rpc('get_my_friend_requests');
      if (error) throw error;
      rows = (data || []).filter(row => row.direction === currentSection.direction);
      list.innerHTML = rows.length ? rows.map(requestRow).join('') : `<div class="empty">${currentSection.direction === 'incoming' ? 'لا توجد طلبات صداقة.' : 'لا توجد طلبات مرسلة.'}</div>`;
    } else {
      const { data, error } = await client.rpc('get_my_friend_challenges');
      if (error) throw error;
      rows = (data || []).filter(row => row.direction === currentSection.direction && row.status === 'pending');
      list.innerHTML = rows.length ? rows.map(challengeRow).join('') : `<div class="empty">${currentSection.direction === 'incoming' ? 'لا توجد تحديات.' : 'لا توجد تحديات مرسلة.'}</div>`;
    }
    count.textContent = rows.length;
    loading.hidden = true;
    list.hidden = false;
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

  async function watchAcceptedChallenge() {
    const { data, error } = await client.rpc('get_my_friend_challenges');
    if (error) throw error;
    const accepted = (data || []).find(row => row.direction === 'outgoing' && row.status === 'accepted' && row.game_id);
    if (!accepted) return;
    if (sessionStorage.getItem('shatranj_last_opened_friend_challenge') === accepted.challenge_id) return;
    sessionStorage.setItem('shatranj_last_opened_friend_challenge', accepted.challenge_id);
    await enterChallenge(accepted.challenge_id);
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

  async function handleAction(button) {
    const action = button.dataset.action;
    const id = button.dataset.id;
    button.disabled = true;
    try {
      if (action === 'challenge-friend') {
        openChallengeModal(id, button.dataset.name);
        return;
      }
      if (action === 'accept-challenge') {
        const { data, error } = await client.rpc('respond_friend_challenge', { p_challenge_id: id, p_accept: true });
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        toast('تم قبول التحدي.');
        storeChallengeAccess(row, id);
        return;
      }
      if (action === 'reject-challenge') {
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
      await loadSection();
    } catch (err) {
      toast(err.message || 'تعذر تنفيذ العملية.', true);
    } finally {
      button.disabled = false;
    }
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (button) handleAction(button);
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
      await loadSection();
    } catch (err) {
      toast(err.message || 'تعذر إرسال التحدي.', true);
    } finally {
      button.disabled = false;
    }
  });

  $('cancelChallengeModalBtn').addEventListener('click', closeChallengeModal);
  $('challengeModal').addEventListener('click', event => { if (event.target === $('challengeModal')) closeChallengeModal(); });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    client.rpc('heartbeat_player_presence').catch(() => {});
    loadSection().catch(err => toast(err.message || 'تعذر تحديث القسم.', true));
  });

  (async () => {
    try {
      const { data: authData } = await client.auth.getSession();
      session = authData.session;
      if (!session) {
        location.href = 'index.html#register';
        return;
      }
      await client.rpc('heartbeat_player_presence');
      await loadSection();
      setInterval(() => {
        if (document.hidden) return;
        watchAcceptedChallenge().catch(err => console.warn('challenge watch failed', err));
        if (currentSection.kind === 'challenges') loadSection().catch(err => console.warn('section refresh failed', err));
      }, 3000);
      if (currentSection.kind === 'friends') {
        setInterval(() => { if (!document.hidden) loadSection().catch(() => {}); }, 30000);
      }
    } catch (err) {
      console.error(err);
      loading.textContent = err.message || 'تعذر تحميل القسم.';
    }
  })();
})();
