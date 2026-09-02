(async () => {
  'use strict';

  const fallbackCfg = {
    enabled: true,
    url: 'https://zjxkxhsvltihucdacjrv.supabase.co',
    anonKey: 'sb_publishable_bwFGOiJzT_Xv656pLPR8ww_oJxFzSGJ'
  };
  const cfg = window.SHATRANJ_CONFIG?.supabase || fallbackCfg;
  if (!cfg?.enabled || !cfg.url || !cfg.anonKey) return;

  let createClient = window.supabase?.createClient;
  if (!createClient) {
    try {
      const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      createClient = mod.createClient;
    } catch (error) {
      console.warn('notification client unavailable', error);
      return;
    }
  }

  const client = createClient(cfg.url, cfg.anonKey);
  let session = null;
  let open = false;
  let pollingTimer = null;

  const labels = {
    friend_request: (n) => `${n.actor_name || 'لاعب'} أرسل لك طلب صداقة`,
    friend_accepted: (n) => `${n.actor_name || 'لاعب'} قبل طلب الصداقة`,
    challenge_received: (n) => `${n.actor_name || 'صديق'} أرسل لك تحديًا`,
    challenge_accepted: (n) => `${n.actor_name || 'صديق'} قبل التحدي`,
    challenge_rejected: (n) => `${n.actor_name || 'صديق'} رفض التحدي`,
    challenge_expired: (n) => `انتهت مهلة التحدي مع ${n.actor_name || 'الصديق'}`
  };

  function targetFor(n) {
    if (n.type === 'challenge_accepted' && n.game_id && n.challenge_id) {
      return `play.html?game=${encodeURIComponent(n.game_id)}&challenge=${encodeURIComponent(n.challenge_id)}`;
    }
    if (n.type === 'challenge_received') return 'profile.html#challengesSection';
    if (n.type === 'friend_request') return 'profile.html#incomingRequests';
    if (n.type === 'friend_accepted' && n.actor_player_id) return `player.html?id=${encodeURIComponent(n.actor_player_id)}`;
    if (n.type === 'challenge_rejected' || n.type === 'challenge_expired') return 'profile.html#challengesSection';
    return 'profile.html';
  }

  function ensureStyles() {
    if (document.getElementById('siteNotificationStyles')) return;
    const style = document.createElement('style');
    style.id = 'siteNotificationStyles';
    style.textContent = `
      #siteNotificationHost{position:relative;display:inline-flex;align-items:center}
      .site-notification-bell{position:relative;width:42px;height:42px;border-radius:12px;border:1px solid rgba(212,180,103,.28);background:rgba(255,255,255,.04);color:#f4eddc;display:grid;place-items:center;font:inherit;cursor:pointer}
      .site-notification-bell:hover{background:rgba(255,255,255,.08)}
      .site-notification-badge{position:absolute;top:-5px;left:-5px;min-width:20px;height:20px;padding:0 5px;border-radius:12px;background:#d4b467;color:#173536;font-size:11px;font-weight:900;display:grid;place-items:center;border:2px solid #0c3435}
      .site-notification-badge[hidden]{display:none}
      .site-notification-menu{position:absolute;top:50px;left:0;width:min(360px,calc(100vw - 28px));max-height:420px;overflow:auto;background:#103f40;border:1px solid rgba(212,180,103,.28);border-radius:16px;box-shadow:0 18px 45px rgba(0,0,0,.28);z-index:200;padding:8px}
      .site-notification-menu[hidden]{display:none}
      .site-notification-title{padding:8px 9px 10px;color:#d4b467;font-weight:800;border-bottom:1px solid rgba(255,255,255,.08)}
      .site-notification-item{width:100%;text-align:right;border:0;border-bottom:1px solid rgba(255,255,255,.07);background:transparent;color:#f4eddc;padding:11px 9px;cursor:pointer;font:inherit}
      .site-notification-item:hover{background:rgba(255,255,255,.04)}
      .site-notification-item.unread{background:rgba(212,180,103,.08)}
      .site-notification-item small{display:block;color:#adc1bc;margin-top:4px}
      .site-notification-empty{color:#adc1bc;text-align:center;padding:22px 10px}
      @media(max-width:520px){.site-notification-bell{width:38px;height:38px}.site-notification-menu{position:fixed;top:68px;left:9px;right:9px;width:auto;max-height:70vh}}
    `;
    document.head.appendChild(style);
  }

  function ensureHost() {
    let host = document.getElementById('siteNotificationHost');
    if (!host) {
      const fallback = document.querySelector('.top-actions,.header-actions.end,.header-live,.topbar,.links');
      if (!fallback) return null;
      host = document.createElement('div');
      host.id = 'siteNotificationHost';
      fallback.prepend(host);
    }
    return host;
  }

  function buildUI(host) {
    host.innerHTML = `
      <button class="site-notification-bell" id="siteNotificationBell" type="button" aria-label="الإشعارات">🔔
        <span class="site-notification-badge" id="siteNotificationBadge" hidden>0</span>
      </button>
      <div class="site-notification-menu" id="siteNotificationMenu" hidden>
        <div class="site-notification-title">الإشعارات</div>
        <div id="siteNotificationList"><div class="site-notification-empty">جاري التحميل...</div></div>
      </div>`;
  }

  async function refreshCount() {
    if (!session) return;
    const { data, error } = await client.rpc('get_unread_notification_count');
    if (error) return;
    const count = Number(data || 0);
    const badge = document.getElementById('siteNotificationBadge');
    if (!badge) return;
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.hidden = count <= 0;
  }

  function renderNotifications(rows) {
    const list = document.getElementById('siteNotificationList');
    if (!list) return;
    if (!rows?.length) {
      list.innerHTML = '<div class="site-notification-empty">لا توجد إشعارات.</div>';
      return;
    }
    list.innerHTML = rows.map(n => {
      const label = (labels[n.type] || (() => 'إشعار جديد'))(n);
      const time = new Date(n.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' });
      return `<button class="site-notification-item ${n.is_read ? '' : 'unread'}" type="button" data-notification-id="${n.notification_id}" data-target="${targetFor(n)}">${label}<small>${time}</small></button>`;
    }).join('');
  }

  async function loadNotifications() {
    const { data, error } = await client.rpc('get_my_notifications', { p_limit: 30 });
    if (error) return;
    renderNotifications(data || []);
  }

  async function openNotification(button) {
    const id = button.dataset.notificationId;
    const target = button.dataset.target || 'profile.html';
    if (id) await client.rpc('mark_notification_read', { p_notification_id: id });
    location.href = target;
  }

  function bindUI() {
    const bell = document.getElementById('siteNotificationBell');
    const menu = document.getElementById('siteNotificationMenu');
    if (!bell || !menu) return;

    bell.addEventListener('click', async (event) => {
      event.stopPropagation();
      open = !open;
      menu.hidden = !open;
      if (open) await loadNotifications();
    });

    menu.addEventListener('click', (event) => {
      const item = event.target.closest('[data-notification-id]');
      if (item) openNotification(item);
    });

    document.addEventListener('click', (event) => {
      if (!open) return;
      if (!event.target.closest('#siteNotificationHost')) {
        open = false;
        menu.hidden = true;
      }
    });
  }

  async function init() {
    const { data } = await client.auth.getSession();
    session = data.session;
    if (!session) return;
    ensureStyles();
    const host = ensureHost();
    if (!host) return;
    buildUI(host);
    bindUI();
    await refreshCount();
    pollingTimer = setInterval(refreshCount, 30000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refreshCount();
    });
    window.addEventListener('beforeunload', () => clearInterval(pollingTimer), { once: true });
  }

  init();
})();
