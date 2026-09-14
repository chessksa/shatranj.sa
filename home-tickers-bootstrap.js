(() => {
  'use strict';

  const MOBILE_QUERY = '(max-width:600px)';
  const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;
  const q = (s, root=document) => root.querySelector(s);

  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = String(text);
    return el;
  }

  function imp(el, styles) {
    if (!el) return;
    for (const [name, value] of Object.entries(styles)) {
      el.style.setProperty(name, value, 'important');
    }
  }

  function installFinalStyles() {
    if (document.getElementById('mobileHomeFinalFix20260914c')) return;
    const style = document.createElement('style');
    style.id = 'mobileHomeFinalFix20260914c';
    style.textContent = `
@media(max-width:600px){
  html body.home-signed-in .compact-member-nav #headerMember:not([hidden]){display:block!important}
  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav #headerMember:not([hidden]){display:block!important}

  html body.home-signed-in .compact-member-nav #dashboardNav{display:flex!important}
  html body.home-signed-in .compact-member-nav #mobileDashboardNav{display:none!important}

  html body.home-signed-in .compact-member-nav #dashboardNav .header-tile-icon,
  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav #dashboardNav .header-tile-icon,
  html body.home-signed-in .compact-member-nav #siteNotificationBell .header-tile-icon,
  html body.v2-shell-active.v2-route-home.home-signed-in .compact-member-nav #siteNotificationBell .header-tile-icon{
    display:grid!important;
    width:22px!important;
    height:22px!important;
    min-width:22px!important;
    flex:0 0 22px!important;
    place-items:center!important;
    color:#efcf7c!important;
    font-size:18px!important;
    line-height:1!important;
    margin:0!important;
  }

  html body.home-signed-in .compact-member-nav #siteNotificationBell::before,
  html body.home-signed-in .compact-member-nav #siteNotificationBell::after{
    content:none!important;
    display:none!important;
  }

  html body.home-signed-in .home-board-actions .btn::before,
  html body.home-signed-in .home-board-actions #homeInviteToggle::before{
    content:none!important;
    display:none!important;
  }

  .mobile-play-glyph{
    width:34px!important;
    height:34px!important;
    min-width:34px!important;
    flex:0 0 34px!important;
    display:grid!important;
    place-items:center!important;
    margin:0!important;
    border:1px solid rgba(239,207,124,.46)!important;
    border-radius:10px!important;
    background:rgba(239,207,124,.07)!important;
    color:#efcf7c!important;
    font:900 20px/1 Arial,sans-serif!important;
  }

  .hero-play-btn .mobile-play-glyph{
    color:#07363d!important;
    border-color:rgba(7,54,61,.24)!important;
    background:rgba(7,54,61,.08)!important;
  }

  .mobile-control-exit-icon{
    display:grid!important;
    place-items:center!important;
    width:22px!important;
    height:22px!important;
    min-width:22px!important;
    margin:0!important;
    color:#efcf7c!important;
    font:900 18px/1 Arial,sans-serif!important;
  }
}
`;
    document.head.appendChild(style);
  }

  function ensureTournamentTicker() {
    let ticker = document.getElementById('tournamentResultsTicker');
    if (ticker) return ticker;
    const welcome = document.getElementById('welcomeTicker');
    if (!welcome) return null;

    ticker = node('div', 'welcome-ticker tournament-results-ticker');
    ticker.id = 'tournamentResultsTicker';
    ticker.setAttribute('role', 'region');
    ticker.setAttribute('aria-label', 'نتائج البطولات');

    const label = node('span', 'welcome-ticker-label', 'البطولات');
    const viewport = node('div', 'welcome-ticker-viewport');
    const track = node('div', 'welcome-ticker-track welcome-ticker-single');
    track.id = 'tournamentResultsTickerTrack';
    track.append(node('span', 'welcome-ticker-loading', 'لا توجد بطولات معلنة حاليًا'));
    viewport.append(track);
    ticker.append(label, viewport);
    welcome.insertAdjacentElement('afterend', ticker);
    return ticker;
  }

  function renderTournamentRows(rows) {
    const ticker = ensureTournamentTicker();
    const track = ticker?.querySelector('#tournamentResultsTickerTrack');
    if (!track) return;
    const tournaments = Array.isArray(rows) ? rows : [];
    if (!tournaments.length) {
      track.className = 'welcome-ticker-track welcome-ticker-single';
      track.replaceChildren(node('span', 'welcome-ticker-loading', 'لا توجد بطولات معلنة حاليًا'));
      return;
    }

    const statusLabel = status => status === 'running' ? 'جارية الآن' : status === 'open' ? 'التسجيل مفتوح' : status === 'finished' ? 'انتهت' : 'بطولة';
    const buildGroup = () => {
      const group = node('div', 'welcome-ticker-group');
      for (const item of tournaments) {
        const time = item.time_control ? ` · ${item.time_control}` : '';
        group.append(
          node('span', 'welcome-ticker-item', `${item.name || 'بطولة'} — ${statusLabel(item.status)}${time}`),
          node('span', 'welcome-ticker-separator', '')
        );
      }
      return group;
    };
    track.className = 'welcome-ticker-track';
    track.replaceChildren(buildGroup(), buildGroup());
  }

  async function loadTournamentRows() {
    const cfg = window.SHATRANJ_CONFIG?.supabase;
    if (!cfg?.enabled || !cfg?.url || !cfg?.anonKey) return renderTournamentRows([]);
    try {
      const params = new URLSearchParams({
        select: 'id,name,status,time_control,created_at',
        status: 'in.(running,open,finished)',
        order: 'created_at.desc',
        limit: '10'
      });
      const response = await fetch(`${cfg.url}/rest/v1/tournaments?${params}`, {
        headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}`, Accept: 'application/json' },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(String(response.status));
      renderTournamentRows(await response.json());
    } catch {
      renderTournamentRows([]);
    }
  }

  function ensureExitIcon() {
    const logout = document.getElementById('navLogout');
    if (!logout || logout.hidden) return;
    if (logout.querySelector('.mobile-control-exit-icon')) return;
    const label = node('span', 'mobile-control-label', 'خروج');
    const icon = node('span', 'mobile-control-exit-icon', '↪');
    logout.replaceChildren(icon, label);
  }

  function ensurePlayGlyph(button, glyph) {
    if (!button || button.querySelector('.mobile-play-glyph')) return;
    button.prepend(node('span', 'mobile-play-glyph', glyph));
  }

  function applyMobileLayout() {
    if (!isMobile()) return;
    installFinalStyles();
    const ticker = ensureTournamentTicker();

    const body = document.body;
    if (!body) return;

    const signedIn = body.classList.contains('home-signed-in');
    const header = q('.home-header');
    const nav = q('.home-header .compact-member-nav');
    const navUser = q('.compact-member-nav .nav-user');

    if (signedIn) {
      imp(body, {
        'display': 'grid',
        'grid-template-columns': '1fr',
        'grid-template-rows': '110px 26px 26px minmax(0,1fr)',
        'gap': '0',
        'height': '100dvh',
        'min-height': '100dvh',
        'max-height': '100dvh',
        'overflow': 'hidden'
      });

      imp(header, {
        'display': 'block', 'grid-row': '1', 'order': '1',
        'width': '100%', 'height': '110px', 'min-height': '110px', 'max-height': '110px',
        'margin': '0', 'overflow': 'hidden',
        'background': 'rgba(2,47,51,.98)', 'border-bottom': '1px solid rgba(224,181,103,.22)'
      });
      imp(nav, {
        'display': 'block', 'width': 'calc(100% - 12px)', 'height': '110px',
        'min-height': '110px', 'max-height': '110px', 'margin': '0 auto', 'padding': '5px 0', 'overflow': 'hidden'
      });
      imp(navUser, {
        'display': 'grid', 'width': '100%', 'height': '100px',
        'grid-template-columns': 'repeat(3,minmax(0,1fr))',
        'grid-template-rows': '52px 42px',
        'grid-template-areas': '"member member member" "dashboard notifications logout"',
        'gap': '6px', 'overflow': 'hidden', 'direction': 'rtl', 'align-items': 'stretch'
      });

      const member = document.getElementById('headerMember');
      if (member && !member.hidden) {
        imp(member, {
          'display': 'block', 'grid-area': 'member', 'width': '100%', 'height': '52px',
          'min-width': '0', 'max-width': 'none', 'margin': '0'
        });
        const memberLink = q('.header-member-link', member);
        imp(memberLink, {
          'display': 'flex', 'width': '100%', 'height': '52px', 'min-height': '52px', 'max-height': '52px',
          'padding': '4px 10px', 'flex-direction': 'row', 'align-items': 'center', 'justify-content': 'flex-start',
          'gap': '9px', 'direction': 'rtl', 'overflow': 'hidden',
          'border': '1px solid rgba(224,181,103,.30)', 'border-radius': '14px',
          'background': 'linear-gradient(145deg,rgba(9,68,70,.96),rgba(6,47,49,.96))'
        });
        const avatarWrap = q('.header-member-avatar-wrap', member);
        const avatar = q('.header-member-avatar', member);
        imp(avatarWrap, {
          'position': 'static', 'inset': 'auto', 'transform': 'none',
          'width': '42px', 'height': '42px', 'min-width': '42px', 'flex': '0 0 42px'
        });
        imp(avatar, {
          'position': 'static', 'inset': 'auto', 'transform': 'none',
          'width': '42px', 'height': '42px', 'min-width': '42px', 'flex': '0 0 42px', 'border-radius': '50%'
        });
        const copy = q('.header-member-copy', member);
        imp(copy, {
          'display': 'grid', 'grid-template-columns': 'minmax(0,1fr) auto', 'align-items': 'center',
          'width': 'auto', 'min-width': '0', 'flex': '1 1 auto', 'gap': '10px', 'direction': 'rtl', 'overflow': 'hidden'
        });
        const name = q('.header-member-copy>strong', member);
        imp(name, {
          'display': 'block', 'min-width': '0', 'max-width': 'none', 'margin': '0', 'padding': '0',
          'color': '#f4efe6', 'font-size': '17px', 'font-weight': '900', 'line-height': '1.1',
          'white-space': 'nowrap', 'overflow': 'hidden', 'text-overflow': 'ellipsis', 'text-align': 'right'
        });
        const points = q('.header-member-points', member);
        imp(points, {
          'display': 'flex', 'min-width': '62px', 'margin': '0', 'padding': '0 2px',
          'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center', 'gap': '1px', 'line-height': '1'
        });
        imp(q('small', points), { 'display': 'block', 'font-size': '8px', 'line-height': '1', 'color': '#b9c9c4', 'margin': '0' });
        imp(q('b', points), { 'font-size': '22px', 'font-weight': '900', 'line-height': '1', 'color': '#efcf7c', 'margin': '0', 'padding': '0' });
      }

      const dashboard = document.getElementById('dashboardNav');
      const mobileDashboard = document.getElementById('mobileDashboardNav');
      imp(mobileDashboard, { 'display': 'none' });
      imp(dashboard, {
        'display': 'flex', 'grid-area': 'dashboard', 'width': '100%', 'height': '42px', 'min-height': '42px', 'max-height': '42px',
        'min-width': '0', 'max-width': 'none', 'margin': '0', 'padding': '3px',
        'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center', 'gap': '2px',
        'border': '1px solid rgba(224,181,103,.25)', 'border-radius': '12px', 'background': 'rgba(255,255,255,.035)',
        'color': '#f4efe6', 'font-size': '8px', 'font-weight': '800', 'line-height': '1'
      });
      const dashIcon = q('.header-tile-icon', dashboard);
      imp(dashIcon, { 'display': 'grid', 'width': '22px', 'height': '22px', 'min-width': '22px', 'place-items': 'center', 'font-size': '18px', 'line-height': '1', 'color': '#efcf7c' });

      const host = document.getElementById('siteNotificationHost');
      imp(host, { 'display': 'flex', 'grid-area': 'notifications', 'width': '100%', 'height': '42px', 'min-width': '0', 'max-width': 'none', 'margin': '0' });
      const bell = document.getElementById('siteNotificationBell');
      imp(bell, {
        'display': 'flex', 'width': '100%', 'height': '42px', 'min-height': '42px', 'max-height': '42px',
        'min-width': '0', 'max-width': 'none', 'padding': '3px', 'margin': '0',
        'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center', 'gap': '2px',
        'border': '1px solid rgba(224,181,103,.25)', 'border-radius': '12px', 'background': 'rgba(255,255,255,.035)',
        'color': '#f4efe6', 'font-size': '8px', 'font-weight': '800', 'line-height': '1'
      });
      imp(q('.header-tile-icon', bell), { 'display': 'grid', 'width': '22px', 'height': '22px', 'min-width': '22px', 'place-items': 'center', 'color': '#efcf7c', 'margin': '0' });
      imp(q('.header-tile-label', bell), { 'display': 'block', 'font-size': '8px', 'line-height': '1', 'margin': '0' });

      const logout = document.getElementById('navLogout');
      if (logout && !logout.hidden) {
        ensureExitIcon();
        imp(logout, {
          'display': 'flex', 'grid-area': 'logout', 'width': '100%', 'height': '42px', 'min-height': '42px', 'max-height': '42px',
          'min-width': '0', 'max-width': 'none', 'margin': '0', 'padding': '3px',
          'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center', 'gap': '2px',
          'border': '1px solid rgba(224,181,103,.25)', 'border-radius': '12px', 'background': 'rgba(255,255,255,.035)',
          'color': '#f4efe6', 'font-size': '8px', 'font-weight': '800', 'line-height': '1'
        });
        imp(q('.mobile-control-label', logout), { 'display': 'block', 'font-size': '8px', 'line-height': '1', 'margin': '0' });
      }

      const welcome = document.getElementById('welcomeTicker');
      imp(welcome, { 'display': 'flex', 'grid-row': '2', 'order': '2', 'width': '100%', 'height': '26px', 'min-height': '26px', 'max-height': '26px', 'margin': '0', 'overflow': 'hidden' });
      imp(ticker, { 'display': 'flex', 'grid-row': '3', 'order': '3', 'width': '100%', 'height': '26px', 'min-height': '26px', 'max-height': '26px', 'margin': '0', 'overflow': 'hidden' });

      const hero = q('.home-hero');
      imp(hero, { 'grid-row': '4', 'order': '4', 'min-height': '0', 'overflow': 'hidden', 'padding-top': '7px' });
    }

    const actions = document.getElementById('homeBoardActions');
    if (actions) {
      imp(actions, {
        'display': 'grid', 'grid-template-columns': 'repeat(2,minmax(0,1fr))', 'grid-template-rows': 'repeat(2,74px)',
        'gap': '8px', 'width': '100%', 'max-width': 'none', 'margin': '0', 'direction': 'rtl', 'align-items': 'stretch'
      });
      const play = q('.hero-play-btn', actions);
      const computer = q('.hero-computer-btn', actions);
      const tournaments = q('.hero-tournaments-btn', actions);
      const inviteWrap = q('.home-invite-wrap', actions);
      const invite = document.getElementById('homeInviteToggle');

      imp(play, { 'grid-column': '1', 'grid-row': '1' });
      imp(inviteWrap, { 'grid-column': '2', 'grid-row': '1', 'display': 'block', 'width': '100%', 'height': '74px', 'min-width': '0', 'margin': '0' });
      imp(computer, { 'grid-column': '1', 'grid-row': '2' });
      imp(tournaments, { 'grid-column': '2', 'grid-row': '2' });

      for (const button of [play, computer, tournaments, invite]) {
        imp(button, {
          'display': 'flex', 'width': '100%', 'height': '74px', 'min-height': '74px', 'max-height': '74px',
          'min-width': '0', 'max-width': 'none', 'margin': '0', 'padding': '7px 6px',
          'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center', 'gap': '6px',
          'border-radius': '14px', 'font-size': '13px', 'font-weight': '900', 'line-height': '1.05', 'text-align': 'center'
        });
      }
      ensurePlayGlyph(play, '♟');
      ensurePlayGlyph(invite, '♙+');
      ensurePlayGlyph(computer, '▦');
      ensurePlayGlyph(tournaments, '♛');
    }
  }

  let scheduled = false;
  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyMobileLayout();
    });
  }

  function boot() {
    installFinalStyles();
    ensureTournamentTicker();
    applyMobileLayout();
    void loadTournamentRows();

    const observer = new MutationObserver(scheduleApply);
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'hidden']
    });
    window.addEventListener('resize', scheduleApply, { passive: true });
    setTimeout(scheduleApply, 250);
    setTimeout(scheduleApply, 1000);
    setTimeout(scheduleApply, 2500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
