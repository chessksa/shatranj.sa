import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = window.SHATRANJ_CONFIG?.supabase || {
  enabled: true,
  url: 'https://zjxkxhsvltihucdacjrv.supabase.co',
  anonKey: 'sb_publishable_bwFGOiJzT_Xv656pLPR8ww_oJxFzSGJ'
};

if (cfg.enabled !== false && cfg.url && cfg.anonKey) {
  const client = createClient(cfg.url, cfg.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  const storageKey = 'shatranj_presence_visitor_id';
  let visitorId = '';
  try {
    visitorId = localStorage.getItem(storageKey) || '';
    if (!visitorId) {
      visitorId = globalThis.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(storageKey, visitorId);
    }
  } catch (_) {
    visitorId = `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  const channel = client.channel('site-online-v1', {
    config: { presence: { key: visitorId } }
  });

  function renderOnlineCount() {
    const state = channel.presenceState();
    const count = Object.keys(state || {}).length;
    document.querySelectorAll('#headerOnlineCount').forEach((el) => {
      el.textContent = String(count);
    });
  }

  channel
    .on('presence', { event: 'sync' }, renderOnlineCount)
    .on('presence', { event: 'join' }, renderOnlineCount)
    .on('presence', { event: 'leave' }, renderOnlineCount)
    .subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') return;
      await channel.track({ online_at: new Date().toISOString() });
      renderOnlineCount();
    });

  window.addEventListener('pagehide', () => {
    channel.untrack().catch(() => {});
  }, { once: true });
}
