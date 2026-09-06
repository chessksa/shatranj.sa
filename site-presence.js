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

function initTournamentLayoutPolish() {
  if (!location.pathname.endsWith('/tournaments.html')) return;

  if (!document.getElementById('tournament-centered-grid-v1')) {
    const style = document.createElement('style');
    style.id = 'tournament-centered-grid-v1';
    style.textContent = `
      .tournament-table th,.tournament-table td{
        text-align:center!important;
        vertical-align:middle!important;
      }
      .tournament-detail-table{
        width:100%;
        border-collapse:collapse;
        table-layout:fixed;
        background:rgba(3,38,40,.24);
      }
      .tournament-detail-table th,
      .tournament-detail-table td{
        padding:13px 14px;
        border:1px solid rgba(216,182,101,.28);
        vertical-align:middle;
      }
      .tournament-detail-table th{
        width:32%;
        text-align:center;
        color:#d9c58f;
        background:rgba(4,38,40,.5);
        font-size:13px;
        font-weight:900;
      }
      .tournament-detail-table td{
        text-align:center;
        color:var(--hero-cream,#f4eddc);
        font-size:15px;
        font-weight:800;
        overflow-wrap:anywhere;
      }
      .tournament-detail-table .detail-value{
        display:inline-block;
        margin:0;
        font:inherit;
        color:inherit;
      }
      @media(max-width:700px){
        .tournament-detail-table th,
        .tournament-detail-table td{padding:10px 8px}
        .tournament-detail-table th{width:35%;font-size:11px}
        .tournament-detail-table td{font-size:13px}
      }
    `;
    document.head.appendChild(style);
  }

  const detailCard = document.getElementById('tournamentDetailCard');
  if (!detailCard) return;

  function transformTournamentDetail() {
    if (detailCard.querySelector('.tournament-detail-table')) return;
    const grid = detailCard.querySelector('.detail-grid');
    if (!grid) return;

    const items = [...grid.querySelectorAll('.detail-item')];
    const table = document.createElement('table');
    table.className = 'tournament-detail-table';
    table.setAttribute('aria-label', 'تفاصيل البطولة');
    const tbody = document.createElement('tbody');

    items.forEach((item) => {
      const label = item.querySelector('.detail-label');
      const value = item.querySelector('.detail-value');
      if (!label || !value) return;

      const tr = document.createElement('tr');
      const th = document.createElement('th');
      const td = document.createElement('td');
      th.scope = 'row';
      th.textContent = label.textContent || '';
      td.appendChild(value);
      tr.append(th, td);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    grid.replaceWith(table);
    detailCard.querySelector('.detail-title-row')?.remove();
  }

  const observer = new MutationObserver(transformTournamentDetail);
  observer.observe(detailCard, { childList: true });
  transformTournamentDetail();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTournamentLayoutPolish, { once: true });
} else {
  initTournamentLayoutPolish();
}
