import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = window.SHATRANJ_CONFIG?.supabase || {};
const supabase = cfg.enabled && cfg.url && cfg.anonKey ? createClient(cfg.url, cfg.anonKey) : null;
const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>\'\"]/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const SETTINGS = {
  auto: 'adminAutoRefresh',
  compact: 'adminCompactTables'
};
let autoRefreshTimer = null;
let loadingMetrics = false;

function mountStylesheet() {
  if (document.querySelector('link[data-admin-pro]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'admin-pro.css?v=20260910-2';
  link.dataset.adminPro = '1';
  document.head.appendChild(link);
}

function getBool(key, fallback = false) {
  const value = localStorage.getItem(key);
  return value == null ? fallback : value === '1';
}

function setBool(key, value) {
  localStorage.setItem(key, value ? '1' : '0');
}

async function rpc(name, args = {}) {
  if (!supabase) throw new Error('Supabase unavailable');
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data || [];
}

function first(value) {
  return Array.isArray(value) ? (value[0] || {}) : (value || {});
}

function dayKey(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(value));
}

function startOfRiyadhDayOffset(daysAgo) {
  const target = new Date(Date.now() - (daysAgo * 86400000));
  return dayKey(target);
}

function fmtTime(value = new Date()) {
  return new Intl.DateTimeFormat('ar-SA', {
    timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit'
  }).format(new Date(value));
}

function fmtDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ar-SA', {
    timeZone: 'Asia/Riyadh', dateStyle: 'medium', timeStyle: 'short'
  }).format(new Date(value));
}

function actionLabel(type) {
  const labels = {
    ban:'حظر لاعب', unban:'فك الحظر', player_create:'إضافة لاعب', player_update:'تعديل لاعب',
    player_delete:'حذف لاعب', player_ban:'حظر لاعب', player_unban:'فك حظر لاعب',
    rating_change:'تعديل النقاط', moderator_create:'إضافة مشرف', moderator_remove:'إلغاء مشرف',
    moderator_update:'تعديل مشرف', tournament_create:'إنشاء بطولة', tournament_update:'تعديل بطولة',
    tournament_cancel:'إلغاء بطولة', tournament_start:'بدء بطولة', close_report:'إغلاق بلاغ'
  };
  return labels[type] || type || 'إجراء إداري';
}

function decorateSidebar() {
  const nav = document.querySelector('.nav-list');
  const brand = document.querySelector('.brand');
  if (!nav || nav.dataset.proReady) return;
  nav.dataset.proReady = '1';

  if (brand && !brand.querySelector('.pro-role-badge')) {
    const identity = $('adminIdentity')?.textContent || '';
    brand.insertAdjacentHTML('beforeend', `<span class="pro-role-badge">${identity.includes('المالك') ? 'المالك' : 'إدارة المنصة'}</span>`);
  }

  const label = document.createElement('div');
  label.className = 'pro-nav-caption';
  label.textContent = 'مركز الإدارة';
  nav.prepend(label);

  const order = ['dashboardView','playersView','gamesView','tournamentsView','reportsView','moderatorsView','actionsView'];
  order.forEach((view) => {
    const button = nav.querySelector(`.nav-btn[data-view="${view}"]`);
    if (button) nav.appendChild(button);
  });

  const names = {
    dashboardView:'⌂  الرئيسية', playersView:'♟  اللاعبون', gamesView:'▦  المباريات',
    tournamentsView:'♛  البطولات', reportsView:'⚑  البلاغات', moderatorsView:'♜  المشرفون',
    actionsView:'≡  السجل الإداري'
  };
  Object.entries(names).forEach(([view, labelText]) => {
    const button = nav.querySelector(`.nav-btn[data-view="${view}"]`);
    if (button) button.textContent = labelText;
  });
}

function enhanceDashboard() {
  const dashboard = $('dashboardView');
  if (!dashboard || dashboard.dataset.proReady) return;
  dashboard.dataset.proReady = '1';
  dashboard.innerHTML = `
    <div class="pro-statusbar">
      <span id="proServiceState" class="pro-live">الاتصال بالمنصة سليم</span>
      <span>آخر تحديث: <strong id="proLastUpdate">—</strong></span>
    </div>
    <div class="stats-grid pro-stats-grid">
      <article class="stat-card pro-stat"><small>إجمالي اللاعبين</small><strong id="totalPlayers">—</strong><span class="pro-stat-note">كل الحسابات</span></article>
      <article class="stat-card pro-stat"><small>مسجلون اليوم</small><strong id="proNewToday">—</strong><span class="pro-stat-note">بتوقيت الرياض</span></article>
      <article class="stat-card pro-stat"><small>المباريات النشطة</small><strong id="activeGames">—</strong><span class="pro-stat-note">الآن</span></article>
      <article class="stat-card pro-stat"><small>المباريات المنتهية</small><strong id="finishedGames">—</strong><span class="pro-stat-note">الإجمالي</span></article>
      <article class="stat-card pro-stat"><small>البلاغات المفتوحة</small><strong id="openReports">—</strong><span class="pro-stat-note">تحتاج مراجعة</span></article>
      <article class="stat-card pro-stat"><small>الحسابات المحظورة</small><strong id="proBannedPlayers">—</strong><span class="pro-stat-note">حظر نشط</span></article>
    </div>

    <div class="pro-dashboard-grid">
      <section class="panel">
        <div class="panel-head"><h2>نمو التسجيل خلال 7 أيام</h2><span class="pro-panel-meta">عدد الحسابات الجديدة يوميًا</span></div>
        <div class="panel-body"><div id="proGrowthChart" class="pro-chart"><div class="empty">جارٍ التحميل...</div></div></div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>إجراءات سريعة</h2><span class="pro-panel-meta">الأكثر استخدامًا</span></div>
        <div class="panel-body">
          <div class="pro-quick-actions">
            <button class="pro-quick-btn" type="button" data-pro-action="add-player"><strong>إضافة لاعب</strong><span>حساب جديد يدويًا</span></button>
            <button class="pro-quick-btn" type="button" data-pro-action="active-games"><strong>المباريات الجارية</strong><span>فتح المباريات النشطة</span></button>
            <button class="pro-quick-btn" type="button" data-pro-action="reports"><strong>مراجعة البلاغات</strong><span>البلاغات المفتوحة</span></button>
            <button class="pro-quick-btn" type="button" data-pro-action="tournaments"><strong>البطولات</strong><span>إنشاء أو إدارة بطولة</span></button>
          </div>
        </div>
      </section>
    </div>

    <div class="pro-three">
      <section class="panel"><div class="panel-head"><h2>أحدث اللاعبين</h2></div><div class="panel-body"><div id="recentPlayers" class="recent-list"><div class="empty">جارٍ التحميل...</div></div></div></section>
      <section class="panel"><div class="panel-head"><h2>أحدث المباريات</h2></div><div class="panel-body"><div id="recentGames" class="recent-list"><div class="empty">جارٍ التحميل...</div></div></div></section>
      <section class="panel"><div class="panel-head"><h2>آخر النشاط الإداري</h2></div><div class="panel-body"><div id="proRecentActions" class="recent-list"><div class="empty">جارٍ التحميل...</div></div></div></section>
    </div>

    <section class="panel" style="margin-top:12px">
      <div class="panel-head"><h2>البلاغات المفتوحة</h2><span class="pro-panel-meta">الأولوية لما لم تتم مراجعته</span></div>
      <div class="panel-body"><div id="recentReports" class="recent-list"><div class="empty">جارٍ التحميل...</div></div></div>
    </section>`;
}

function renderGrowth(players) {
  const chart = $('proGrowthChart');
  if (!chart) return;
  const counts = new Map();
  (players || []).forEach((player) => {
    if (!player.created_at) return;
    const key = dayKey(player.created_at);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const key = startOfRiyadhDayOffset(offset);
    const date = new Date(Date.now() - offset * 86400000);
    days.push({
      key,
      count: counts.get(key) || 0,
      label: new Intl.DateTimeFormat('ar-SA', {timeZone:'Asia/Riyadh', weekday:'short'}).format(date)
    });
  }
  const max = Math.max(1, ...days.map((day) => day.count));
  chart.innerHTML = days.map((day) => {
    const height = Math.max(3, Math.round((day.count / max) * 100));
    return `<div class="pro-chart-day"><span class="pro-chart-value">${day.count}</span><div class="pro-chart-bar-wrap"><div class="pro-chart-bar" style="height:${height}%"></div></div><span class="pro-chart-label">${esc(day.label)}</span></div>`;
  }).join('');
}

function renderActions(actions) {
  const target = $('proRecentActions');
  if (!target) return;
  const rows = (actions || []).slice(0, 6);
  target.innerHTML = rows.map((action) => `
    <div class="recent-row">
      <div><div class="pro-action-type">${esc(actionLabel(action.action_type))}</div><strong>${esc(action.player_name || action.details?.email || 'إجراء عام')}</strong></div>
      <span>${esc(action.admin_email || 'الإدارة')}</span>
    </div>`).join('') || '<div class="empty">لا يوجد نشاط إداري حديث</div>';
}

function renderRecentPlayers(players) {
  const target = $('recentPlayers');
  if (!target) return;
  target.innerHTML = (players || []).slice(0, 5).map((player) => `
    <div class="recent-row"><strong>${esc(player.name || 'لاعب')}</strong><span>${esc(player.country || '—')} · ${esc(player.city || '—')} · ${esc(player.rating ?? '—')}</span></div>`
  ).join('') || '<div class="empty">لا يوجد لاعبون</div>';
}

function renderRecentGames(games) {
  const target = $('recentGames');
  if (!target) return;
  target.innerHTML = (games || []).slice(0, 5).map((game) => `
    <div class="recent-row"><strong>${esc(game.white_name || '—')} × ${esc(game.black_name || '—')}</strong><span>${esc(game.time_control_minutes ?? '—')} د · ${esc(game.status || '—')}</span></div>`
  ).join('') || '<div class="empty">لا توجد مباريات</div>';
}

function renderRecentReports(reports) {
  const target = $('recentReports');
  if (!target) return;
  target.innerHTML = (reports || []).slice(0, 5).map((report) => `
    <div class="recent-row"><strong>${esc(report.reporter_name || '—')} ← ${esc(report.reported_name || '—')}</strong><span>${esc(report.game_code || '—')} · ${esc(fmtDate(report.created_at))}</span></div>`
  ).join('') || '<div class="empty">لا توجد بلاغات مفتوحة</div>';
}

async function loadProMetrics() {
  if (loadingMetrics || !supabase) return;
  loadingMetrics = true;
  try {
    const [statsData, players, games, reports, actions] = await Promise.all([
      rpc('admin_dashboard_stats_v2'),
      rpc('admin_list_players_v3', {p_search:null,p_status:null,p_country:null,p_city:null}),
      rpc('admin_list_games_v2', {p_status:null}),
      rpc('admin_list_reports_v2', {p_status:'open'}),
      rpc('admin_list_actions_v2')
    ]);
    const stats = first(statsData);
    const today = dayKey();
    const newToday = (players || []).filter((player) => player.created_at && dayKey(player.created_at) === today).length;
    const banned = (players || []).filter((player) => player.status === 'banned').length;

    if ($('totalPlayers')) $('totalPlayers').textContent = String(stats.total_players ?? (players || []).length);
    if ($('activeGames')) $('activeGames').textContent = String(stats.active_games ?? 0);
    if ($('finishedGames')) $('finishedGames').textContent = String(stats.finished_games ?? 0);
    if ($('openReports')) $('openReports').textContent = String(stats.open_reports ?? (reports || []).length);
    if ($('proNewToday')) $('proNewToday').textContent = String(newToday);
    if ($('proBannedPlayers')) $('proBannedPlayers').textContent = String(banned);
    if ($('proLastUpdate')) $('proLastUpdate').textContent = fmtTime();

    const service = $('proServiceState');
    if (service) {
      service.classList.remove('offline');
      service.textContent = 'الاتصال بالمنصة سليم';
    }

    renderGrowth(players);
    renderActions(actions);
    renderRecentPlayers(players);
    renderRecentGames(games);
    renderRecentReports(reports);
  } catch (error) {
    console.error('تعذر تحميل مؤشرات الإدارة المحسنة', error);
    const service = $('proServiceState');
    if (service) {
      service.classList.add('offline');
      service.textContent = 'تعذر تحديث مؤشرات لوحة الإدارة';
    }
  } finally {
    loadingMetrics = false;
  }
}

function mountQuickSearch() {
  const top = document.querySelector('.topline');
  const refresh = $('refreshBtn');
  if (!top || !refresh || top.querySelector('.pro-top-actions')) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'pro-top-actions';
  wrapper.innerHTML = `
    <form id="proPlayerSearchForm" class="pro-search" role="search">
      <input id="proPlayerSearch" type="search" autocomplete="off" placeholder="بحث سريع عن لاعب..." aria-label="بحث سريع عن لاعب">
      <button type="submit" aria-label="بحث">⌕</button>
    </form>`;
  refresh.before(wrapper);
  wrapper.appendChild(refresh);

  $('proPlayerSearchForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = $('proPlayerSearch')?.value.trim() || '';
    document.querySelector('.nav-btn[data-view="playersView"]')?.click();
    const search = $('playerSearch');
    if (search) {
      search.value = value;
      search.dispatchEvent(new Event('input', {bubbles:true}));
      setTimeout(() => search.focus(), 0);
    }
  });
}

function showSettings() {
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === 'proSettingsView'));
  document.querySelectorAll('.nav-btn').forEach((button) => button.classList.remove('active'));
  $('proSettingsNav')?.classList.add('active');
  if ($('viewTitle')) $('viewTitle').textContent = 'الإعدادات';
  if ($('viewSubtitle')) $('viewSubtitle').textContent = 'إعدادات لوحة الإدارة وسلوكها على هذا الجهاز.';
  $('adminSidebar')?.classList.remove('open');
}

function applyLocalSettings() {
  document.body.classList.toggle('admin-compact', getBool(SETTINGS.compact, false));
  const compactToggle = $('proCompactTables');
  const autoToggle = $('proAutoRefresh');
  if (compactToggle) compactToggle.checked = getBool(SETTINGS.compact, false);
  if (autoToggle) autoToggle.checked = getBool(SETTINGS.auto, false);

  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = null;
  if (getBool(SETTINGS.auto, false)) {
    autoRefreshTimer = setInterval(() => {
      if (document.querySelector('.modal:not([hidden])')) return;
      $('refreshBtn')?.click();
    }, 60000);
  }
}

function mountSettings() {
  const main = document.querySelector('main.content');
  const nav = document.querySelector('.nav-list');
  if (!main || !nav || $('proSettingsView')) return;

  const settings = document.createElement('section');
  settings.id = 'proSettingsView';
  settings.className = 'view';
  settings.innerHTML = `
    <div class="pro-settings-grid">
      <article class="pro-setting-card">
        <h3>التحديث التلقائي</h3>
        <p>تحديث مؤشرات لوحة الإدارة كل دقيقة عندما لا توجد نافذة إجراء مفتوحة.</p>
        <div class="pro-setting-row"><strong>تفعيل التحديث</strong><label class="pro-switch"><input id="proAutoRefresh" type="checkbox"><span></span></label></div>
      </article>
      <article class="pro-setting-card">
        <h3>كثافة الجداول</h3>
        <p>تقليل المسافات الرأسية لإظهار عدد أكبر من الصفوف في شاشة الكمبيوتر.</p>
        <div class="pro-setting-row"><strong>الوضع المضغوط</strong><label class="pro-switch"><input id="proCompactTables" type="checkbox"><span></span></label></div>
      </article>
      <article class="pro-setting-card pro-scope-card">
        <h3>حالة لوحة الإدارة</h3>
        <p>هذه الخيارات تخص واجهة الإدارة على هذا الجهاز فقط ولا تغيّر صلاحيات المستخدمين أو قواعد اللعب في الخادم.</p>
        <div class="pro-scope-line"><span class="pro-chip">Supabase: ${supabase ? 'متصل' : 'غير متصل'}</span><span class="pro-chip">المنطقة الزمنية: الرياض</span><span class="pro-chip">نسخة الواجهة: 2026.09.10.2</span></div>
        <div class="pro-settings-actions"><button id="proRefreshNow" type="button">تحديث البيانات الآن</button><a href="index.html">فتح الموقع</a><button id="proResetSettings" type="button">إعادة إعدادات اللوحة</button></div>
      </article>
    </div>`;
  main.appendChild(settings);

  const settingsNav = document.createElement('button');
  settingsNav.id = 'proSettingsNav';
  settingsNav.className = 'nav-btn';
  settingsNav.type = 'button';
  settingsNav.textContent = '⚙  الإعدادات';
  nav.appendChild(settingsNav);
  settingsNav.addEventListener('click', showSettings);

  $('proAutoRefresh')?.addEventListener('change', (event) => {
    setBool(SETTINGS.auto, event.target.checked);
    applyLocalSettings();
  });
  $('proCompactTables')?.addEventListener('change', (event) => {
    setBool(SETTINGS.compact, event.target.checked);
    applyLocalSettings();
  });
  $('proRefreshNow')?.addEventListener('click', () => $('refreshBtn')?.click());
  $('proResetSettings')?.addEventListener('click', () => {
    localStorage.removeItem(SETTINGS.auto);
    localStorage.removeItem(SETTINGS.compact);
    applyLocalSettings();
  });
  applyLocalSettings();
}

function wireQuickActions() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-pro-action]');
    if (!button) return;
    const action = button.dataset.proAction;
    if (action === 'add-player') {
      const add = $('addPlayerBtn');
      if (add && !add.hidden) add.click();
      else document.querySelector('.nav-btn[data-view="playersView"]')?.click();
    }
    if (action === 'active-games') {
      document.querySelector('.nav-btn[data-view="gamesView"]')?.click();
      const filter = $('gameStatusFilter');
      if (filter) {
        filter.value = 'active';
        filter.dispatchEvent(new Event('change', {bubbles:true}));
      }
    }
    if (action === 'reports') {
      document.querySelector('.nav-btn[data-view="reportsView"]')?.click();
      const filter = $('reportStatusFilter');
      if (filter) {
        filter.value = 'open';
        filter.dispatchEvent(new Event('change', {bubbles:true}));
      }
    }
    if (action === 'tournaments') document.querySelector('.nav-btn[data-view="tournamentsView"]')?.click();
  });
}

function mountAdminPro() {
  if (document.body.classList.contains('admin-pro-ready')) return;
  const app = $('adminApp');
  if (!app || app.hidden) {
    setTimeout(mountAdminPro, 160);
    return;
  }

  document.body.classList.add('admin-pro-ready');
  decorateSidebar();
  enhanceDashboard();
  mountQuickSearch();
  mountSettings();
  wireQuickActions();
  loadProMetrics();
  $('refreshBtn')?.addEventListener('click', loadProMetrics);
}

mountStylesheet();
mountAdminPro();