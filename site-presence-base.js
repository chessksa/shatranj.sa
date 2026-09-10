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

  if (!document.getElementById('tournament-centered-grid-v2')) {
    document.getElementById('tournament-centered-grid-v1')?.remove();
    const style = document.createElement('style');
    style.id = 'tournament-centered-grid-v2';
    style.textContent = `
      .tournament-table th,.tournament-table td{
        text-align:center!important;
        vertical-align:middle!important;
      }
      #registrationMsg.ok{display:none!important}
      #tournamentDetailCard{
        padding:4px!important;
        overflow:hidden!important;
      }
      .tournament-detail-layout{
        height:100%;
        min-height:0;
        display:grid;
        grid-template-columns:minmax(0,0.9fr) minmax(0,1.1fr);
        gap:14px;
      }
      .tournament-info-panel,
      .tournament-matches-panel{
        min-width:0;
        min-height:0;
        border:1px solid rgba(216,182,101,.22);
        border-radius:14px;
        overflow:hidden;
        background:rgba(3,38,40,.24);
        display:flex;
        flex-direction:column;
      }
      .tournament-panel-title{
        flex:0 0 42px;
        min-height:42px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-bottom:1px solid rgba(216,182,101,.22);
        background:rgba(4,38,40,.58);
        color:var(--hero-gold-2,#efcf7c);
        font-size:14px;
        font-weight:900;
      }
      .tournament-info-body{
        flex:1 1 auto;
        min-height:0;
        display:flex;
        flex-direction:column;
      }
      .tournament-detail-table{
        width:100%;
        border-collapse:collapse;
        table-layout:fixed;
        background:rgba(3,38,40,.24);
      }
      .tournament-detail-table th,
      .tournament-detail-table td{
        height:34px;
        padding:5px 9px;
        border-bottom:1px solid rgba(216,182,101,.2);
        vertical-align:middle;
      }
      .tournament-detail-table th{
        width:39%;
        text-align:center;
        color:#d9c58f;
        background:rgba(4,38,40,.42);
        font-size:14px;
        font-weight:900;
      }
      .tournament-detail-table td{
        text-align:center;
        color:var(--hero-cream,#f4eddc);
        font-size:14px;
        font-weight:800;
        overflow-wrap:anywhere;
      }
      .tournament-detail-table th+td{
        border-inline-start:1px solid rgba(216,182,101,.2);
      }
      .tournament-detail-table .detail-value{
        display:inline-block;
        margin:0;
        font:inherit;
        color:inherit;
      }
      .tournament-info-panel .detail-register{
        flex:0 0 auto;
        margin:0!important;
        padding:10px!important;
        border-top:1px solid rgba(216,182,101,.2)!important;
        justify-content:center!important;
      }
      .tournament-info-panel .register-btn{
        min-height:36px;
      }
      .tournament-matches-panel .bracket-shell{
        flex:1 1 auto;
        min-height:0;
        margin:0!important;
        padding:0!important;
        border:0!important;
        display:flex;
        flex-direction:column;
      }
      .tournament-matches-panel .bracket-title{
        display:none!important;
      }
      .tournament-matches-panel #tournamentBracket.bracket-empty{
        margin:auto 12px;
      }
      .tournament-matches-scroll{
        flex:1 1 auto;
        min-height:0;
        overflow-y:auto;
        overflow-x:hidden;
        overscroll-behavior:contain;
        scrollbar-width:thin;
        scrollbar-color:rgba(216,182,101,.55) rgba(4,39,41,.45);
      }
      .tournament-matches-table{
        width:100%;
        border-collapse:collapse;
        table-layout:fixed;
      }
      .tournament-matches-table th,
      .tournament-matches-table td{
        height:42px;
        padding:5px 7px;
        border-bottom:1px solid rgba(216,182,101,.18);
        text-align:center;
        vertical-align:middle;
        font-size:11px;
      }
      .tournament-matches-table th{
        position:sticky;
        top:0;
        z-index:2;
        background:#07383a;
        color:#d9c58f;
        font-weight:900;
      }
      .tournament-matches-table th:not(:last-child),
      .tournament-matches-table td:not(:last-child){
        border-inline-end:1px solid rgba(216,182,101,.16);
      }
      .tournament-matches-table th:nth-child(1){width:92px}
      .tournament-matches-table th:nth-child(3){width:104px}
      .tournament-matches-table th:nth-child(4){width:126px}
      .tournament-match-players{
        display:flex;
        align-items:center;
        justify-content:center;
        gap:7px;
        min-width:0;
      }
      .tournament-match-players span{
        min-width:0;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      .tournament-match-players .winner{
        color:#a7e7bd;
        font-weight:900;
      }
      .tournament-match-action{
        display:flex;
        align-items:center;
        justify-content:center;
        gap:5px;
        flex-wrap:wrap;
      }
      .tournament-match-action .register-btn{
        min-width:0!important;
        min-height:30px!important;
        padding:0 8px!important;
        font-size:10px!important;
      }
      .tournament-matches-table tr.mine td{
        background:rgba(239,207,124,.05);
      }
      @media(max-width:700px){
        #tournamentDetailCard{padding:8px!important}
        .tournament-detail-layout{
          grid-template-columns:1fr;
          grid-template-rows:auto minmax(0,1fr);
          gap:6px;
        }
        .tournament-panel-title{flex-basis:34px;min-height:34px;font-size:11px}
        .tournament-detail-table th,
        .tournament-detail-table td{height:27px;padding:3px 5px}
        .tournament-detail-table th{width:36%;font-size:9px}
        .tournament-detail-table td{font-size:10px}
        .tournament-info-panel .detail-register{padding:6px!important}
        .tournament-info-panel .register-btn{min-height:31px}
        .tournament-matches-table th,
        .tournament-matches-table td{height:36px;padding:3px 4px;font-size:9px}
        .tournament-matches-table th:nth-child(1){width:66px}
        .tournament-matches-table th:nth-child(3){width:72px}
        .tournament-matches-table th:nth-child(4){width:82px}
        .tournament-match-action .register-btn{min-height:27px!important;font-size:8px!important;padding:0 5px!important}
      }
    `;
    document.head.appendChild(style);
  }

  const detailCard = document.getElementById('tournamentDetailCard');
  if (!detailCard) return;
  const registrationMsg = document.getElementById('registrationMsg');
  let bracketObserver = null;
  let registrationObserver = null;

  function syncRegistrationFeedback() {
    if (!registrationMsg?.classList.contains('ok')) return;
    const button = detailCard.querySelector('.detail-register .register-btn.registered');
    if (button?.textContent?.trim() === 'مسجل') button.textContent = 'أنت مسجل بالفعل';
  }

  if (registrationMsg && typeof MutationObserver !== 'undefined') {
    registrationObserver = new MutationObserver(syncRegistrationFeedback);
    registrationObserver.observe(registrationMsg, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
    syncRegistrationFeedback();
  }

  function transformTournamentMatches(bracketHost) {
    if (!bracketHost || bracketHost.classList.contains('bracket-empty')) return;
    if (bracketHost.querySelector('.tournament-matches-table')) return;

    const rounds = [...bracketHost.querySelectorAll(':scope > .bracket-round')];
    if (!rounds.length) return;

    const matchesTable = document.createElement('table');
    matchesTable.className = 'tournament-matches-table';
    matchesTable.setAttribute('aria-label', 'مباريات البطولة');
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>الدور</th><th>اللاعبان</th><th>الحالة</th><th>الإجراء</th></tr>';
    const tbody = document.createElement('tbody');

    rounds.forEach((round) => {
      const roundName = round.querySelector('.bracket-round-title')?.textContent?.trim() || '—';
      round.querySelectorAll('.bracket-match').forEach((match) => {
        const players = [...match.querySelectorAll('.bracket-player')];
        const meta = match.querySelector('.bracket-meta');
        const statusNode = meta?.querySelector(':scope > span');
        const tr = document.createElement('tr');
        if (match.classList.contains('mine')) tr.classList.add('mine');

        const roundCell = document.createElement('td');
        roundCell.textContent = roundName;

        const playersCell = document.createElement('td');
        const playersWrap = document.createElement('div');
        playersWrap.className = 'tournament-match-players';
        players.forEach((player, index) => {
          if (index) {
            const separator = document.createElement('b');
            separator.textContent = '×';
            playersWrap.appendChild(separator);
          }
          const name = document.createElement('span');
          name.textContent = player.textContent?.trim() || 'بانتظار المتأهل';
          if (player.classList.contains('winner')) name.classList.add('winner');
          playersWrap.appendChild(name);
        });
        playersCell.appendChild(playersWrap);

        const statusCell = document.createElement('td');
        statusCell.textContent = statusNode?.textContent?.trim() || '—';

        const actionCell = document.createElement('td');
        actionCell.className = 'tournament-match-action';
        const actions = meta ? [...meta.querySelectorAll('button,a')] : [];
        if (actions.length) actions.forEach((action) => actionCell.appendChild(action));
        else actionCell.textContent = '—';

        tr.append(roundCell, playersCell, statusCell, actionCell);
        tbody.appendChild(tr);
      });
    });

    matchesTable.append(thead, tbody);
    const scroll = document.createElement('div');
    scroll.className = 'tournament-matches-scroll';
    scroll.appendChild(matchesTable);
    bracketHost.replaceChildren(scroll);
  }

  function watchTournamentBracket(bracketHost) {
    bracketObserver?.disconnect();
    if (!bracketHost) return;
    bracketObserver = new MutationObserver(() => transformTournamentMatches(bracketHost));
    bracketObserver.observe(bracketHost, { childList: true, subtree: true });
    transformTournamentMatches(bracketHost);
  }

  function transformTournamentDetail() {
    if (detailCard.querySelector('.tournament-detail-layout')) return;
    const grid = detailCard.querySelector('.detail-grid');
    const bracketShell = detailCard.querySelector('.bracket-shell');
    if (!grid || !bracketShell) return;

    const items = [...grid.querySelectorAll('.detail-item')];
    const table = document.createElement('table');
    table.className = 'tournament-detail-table';
    table.setAttribute('aria-label', 'بيانات البطولة');
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

    const infoPanel = document.createElement('section');
    infoPanel.className = 'tournament-info-panel';
    const infoTitle = document.createElement('div');
    infoTitle.className = 'tournament-panel-title';
    infoTitle.textContent = 'بيانات البطولة';
    const infoBody = document.createElement('div');
    infoBody.className = 'tournament-info-body';
    infoBody.appendChild(table);
    const registration = detailCard.querySelector('.detail-register');
    if (registration) infoBody.appendChild(registration);
    infoPanel.append(infoTitle, infoBody);

    const matchesPanel = document.createElement('section');
    matchesPanel.className = 'tournament-matches-panel';
    const matchesTitle = document.createElement('div');
    matchesTitle.className = 'tournament-panel-title';
    matchesTitle.textContent = 'المباريات';
    matchesPanel.append(matchesTitle, bracketShell);

    const layout = document.createElement('div');
    layout.className = 'tournament-detail-layout';
    layout.append(infoPanel, matchesPanel);

    detailCard.replaceChildren(layout);
    watchTournamentBracket(bracketShell.querySelector('#tournamentBracket'));
    syncRegistrationFeedback();
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
