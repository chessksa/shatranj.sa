(async () => {
  'use strict';

  const cfg = window.SHATRANJ_CONFIG?.supabase || {
    enabled: true,
    url: 'https://zjxkxhsvltihucdacjrv.supabase.co',
    anonKey: 'sb_publishable_bwFGOiJzT_Xv656pLPR8ww_oJxFzSGJ'
  };
  if (!cfg.enabled || !cfg.url || !cfg.anonKey) return;

  let createClient = window.supabase?.createClient;
  if (!createClient) {
    try {
      const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      createClient = mod.createClient;
    } catch (error) {
      console.warn('invite client unavailable', error);
      return;
    }
  }

  const client = createClient(cfg.url, cfg.anonKey);
  let session = null;
  let myPlayerId = null;
  let players = [];
  let open = false;
  let loaded = false;
  let busyPlayerId = null;

  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  function ensureStyles() {
    if (document.getElementById('homeInviteStyles')) return;
    const style = document.createElement('style');
    style.id = 'homeInviteStyles';
    style.textContent = `
      .home-invite-wrap{position:relative;display:inline-flex}
      .home-invite-panel{position:fixed;top:50%;left:50%;right:auto;transform:translate(-50%,-50%);z-index:120;width:min(520px,calc(100vw - 32px));max-height:min(70vh,520px);overflow:auto;padding:14px;background:#fff;border:1px solid #d9d2c6;border-radius:14px;box-shadow:0 18px 46px rgba(0,0,0,.28)}
      .home-invite-panel[hidden]{display:none!important}
      .home-invite-title{font-size:12px;font-weight:900;color:#0d3b2e;margin-bottom:7px}
      .home-invite-search{height:39px!important;margin:0!important}
      .home-invite-results{margin-top:7px;max-height:270px;overflow:auto;border-radius:9px}
      .home-invite-result{width:100%;border:0;border-bottom:1px solid #eee8dd;background:#fff;padding:9px 10px;text-align:right;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;font:inherit;color:#14221c}
      .home-invite-result:last-child{border-bottom:0}
      .home-invite-result:hover{background:#f8f5ee}
      .home-invite-result:disabled{opacity:.58;cursor:wait}
      .home-invite-name{font-size:13px;font-weight:900}.home-invite-name-link{color:inherit;text-decoration:none}.home-invite-name-link:hover{text-decoration:underline}
      .home-invite-meta{margin-top:2px;color:#78807b;font-size:10px}
      .home-invite-send{flex:0 0 auto;border:0;background:transparent;color:#176148;font-size:11px;font-weight:900;cursor:pointer;padding:6px 8px;border-radius:8px}.home-invite-send:hover{background:#eef6f1}
      .home-invite-empty{padding:14px 8px;text-align:center;color:#7d837f;font-size:11px}
      .home-invite-msg{min-height:17px;margin-top:6px;font-size:10px;font-weight:800;color:#176148}
      .home-invite-msg.error{color:#a53a3a}
      @media(max-width:800px){
        .home-invite-wrap{width:100%}
        .home-invite-wrap>.btn{width:100%}
        .home-invite-panel{top:50%;right:auto;left:50%;bottom:auto;width:min(520px,calc(100vw - 18px));max-height:min(70vh,520px);transform:translate(-50%,-50%)}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureUI() {
    const actions = document.querySelector('#homeBoardActions') || document.querySelector('#accountPanel .account-actions');
    if (!actions || document.getElementById('homeInviteToggle')) return false;
    ensureStyles();

    const wrap = document.createElement('div');
    wrap.className = 'home-invite-wrap';
    wrap.innerHTML = `
      <button id="homeInviteToggle" class="btn light" type="button"><span class="hero-action-icon" aria-hidden="true">＋</span><span>دعوة لاعب</span></button>
      <div id="homeInvitePanel" class="home-invite-panel" hidden>
        <div class="home-invite-title">ابحث عن لاعب وأرسل له دعوة مباشرة</div>
        <input id="invitePlayerSearch" class="home-invite-search" type="search" autocomplete="off" placeholder="اكتب اسم اللاعب أو اسم المستخدم">
        <div id="homeInviteResults" class="home-invite-results"><div class="home-invite-empty">اكتب حرفين على الأقل.</div></div>
        <div id="homeInviteMsg" class="home-invite-msg"></div>
      </div>`;

    const playButton = actions.querySelector('.btn.gold');
    if (playButton?.nextSibling) actions.insertBefore(wrap, playButton.nextSibling);
    else actions.appendChild(wrap);

    document.getElementById('homeInviteToggle').addEventListener('click', async (event) => {
      event.stopPropagation();
      if (!session) return;
      open = !open;
      document.getElementById('homeInvitePanel').hidden = !open;
      if (open) {
        if (!loaded) await loadPlayers();
        setTimeout(() => document.getElementById('invitePlayerSearch')?.focus(), 0);
      }
    });

    document.getElementById('invitePlayerSearch').addEventListener('input', renderSearch);
    document.getElementById('homeInviteResults').addEventListener('click', async (event) => {
      const button = event.target.closest('[data-invite-player]');
      if (!button || busyPlayerId) return;
      await sendInvite(button.dataset.invitePlayer, button.dataset.inviteName || 'اللاعب');
    });

    document.addEventListener('click', (event) => {
      if (!open || event.target.closest('.home-invite-wrap')) return;
      open = false;
      document.getElementById('homeInvitePanel').hidden = true;
    });

    return true;
  }

  function setMessage(text, error = false) {
    const el = document.getElementById('homeInviteMsg');
    if (!el) return;
    el.textContent = text || '';
    el.className = `home-invite-msg${error ? ' error' : ''}`;
  }

  async function loadPlayers() {
    setMessage('جاري تحميل اللاعبين...');
    const [{ data, error }, { data: usernames, error: usernamesError }] = await Promise.all([
      client.from('public_players').select('id,name,city,rating').order('rating', { ascending: false }).limit(500),
      client.rpc('get_public_usernames')
    ]);
    if (error) {
      setMessage('تعذر تحميل اللاعبين.', true);
      return;
    }
    const usernameMap = new Map((usernamesError ? [] : (usernames || [])).map(row => [String(row.player_id), row.username || '']));
    players = (data || []).filter(player => String(player.id) !== String(myPlayerId)).map(player => ({
      ...player,
      username: usernameMap.get(String(player.id)) || ''
    }));
    loaded = true;
    setMessage('');
    renderSearch();
  }

  function renderSearch() {
    const input = document.getElementById('invitePlayerSearch');
    const results = document.getElementById('homeInviteResults');
    if (!input || !results) return;
    const query = input.value.trim().toLocaleLowerCase('ar');
    if (query.length < 2) {
      results.innerHTML = '<div class="home-invite-empty">اكتب حرفين على الأقل.</div>';
      return;
    }

    const matches = players.filter(player => {
      const name = String(player.name || '').toLocaleLowerCase('ar');
      const username = String(player.username || '').toLowerCase();
      return name.includes(query) || username.includes(query.replace(/^@/, ''));
    }).slice(0, 8);

    if (!matches.length) {
      results.innerHTML = '<div class="home-invite-empty">لم نجد لاعبًا بهذا الاسم.</div>';
      return;
    }

    results.innerHTML = matches.map(player => `
      <div class="home-invite-result">
        <span>
          <a class="home-invite-name home-invite-name-link" href="player.html?id=${encodeURIComponent(player.id)}">${esc(player.name)}${player.username ? ` <small>@${esc(player.username)}</small>` : ''}</a>
          <span class="home-invite-meta">${esc(player.city || '—')} • ${Number(player.rating || 1500)} نقطة</span>
        </span>
        <button class="home-invite-send" type="button" data-invite-player="${esc(player.id)}" data-invite-name="${esc(player.name)}">دعوة</button>
      </div>`).join('');
  }

  async function sendInvite(playerId, playerName) {
    busyPlayerId = playerId;
    setMessage(`جاري إرسال الدعوة إلى ${playerName}...`);
    document.querySelectorAll('[data-invite-player]').forEach(btn => { btn.disabled = true; });
    try {
      const { error } = await client.rpc('send_player_challenge', { p_player_id: playerId, p_minutes: 10 });
      if (error) throw error;
      setMessage(`تم إرسال الدعوة إلى ${playerName} — مباراة 10 دقائق.`);
      const input = document.getElementById('invitePlayerSearch');
      if (input) input.value = '';
      const results = document.getElementById('homeInviteResults');
      if (results) results.innerHTML = '<div class="home-invite-empty">تم الإرسال. يمكنك البحث عن لاعب آخر.</div>';
    } catch (error) {
      const raw = String(error?.message || '').toLowerCase();
      if (raw.includes('already pending')) setMessage('هناك دعوة معلقة بالفعل بينكما.', true);
      else if (raw.includes('active game exists')) setMessage('أحدكما داخل مباراة الآن.', true);
      else if (raw.includes('unavailable')) setMessage('اللاعب غير متاح حاليًا.', true);
      else setMessage('تعذر إرسال الدعوة الآن.', true);
    } finally {
      busyPlayerId = null;
      document.querySelectorAll('[data-invite-player]').forEach(btn => { btn.disabled = false; });
    }
  }

  async function refreshSession(nextSession) {
    session = nextSession || null;
    myPlayerId = null;
    loaded = false;
    players = [];
    if (!session) return;
    const { data, error } = await client.rpc('get_my_player_profile');
    if (!error) {
      const row = Array.isArray(data) ? data[0] : data;
      myPlayerId = row?.id || null;
    }
    ensureUI();
  }

  const { data } = await client.auth.getSession();
  await refreshSession(data.session);
  client.auth.onAuthStateChange((_event, nextSession) => {
    setTimeout(() => refreshSession(nextSession), 0);
  });

  const observer = new MutationObserver(() => {
    if (session) ensureUI();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
