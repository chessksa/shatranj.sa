const ADMIN_SECTION_SHORTCUTS = Object.freeze({
  dashboardView: { icon: '⌂', label: 'الرئيسية' },
  playersView: { icon: '♟', label: 'اللاعبون' },
  gamesView: { icon: '▦', label: 'المباريات' },
  tournamentsView: { icon: '♛', label: 'البطولات' },
  reportsView: { icon: '⚑', label: 'البلاغات' },
  moderatorsView: { icon: '♜', label: 'المشرفون' },
  actionsView: { icon: '≡', label: 'السجل' },
  proSettingsNav: { icon: '⚙', label: 'الإعدادات' },
});

const ADMIN_STAT_ICONS = Object.freeze({
  totalPlayers: '♟',
  proNewToday: '＋',
  activeGames: '●',
  finishedGames: '✓',
  openReports: '⚑',
  proBannedPlayers: '⊘',
});

function mountCompactStylesheet() {
  if (document.querySelector('link[data-admin-home-compact]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'admin-home-compact.css?v=20260911-4';
  link.dataset.adminHomeCompact = '1';
  document.head.appendChild(link);
}

function compactSectionRail() {
  const buttons = [...document.querySelectorAll('.nav-btn[data-view]')];
  const settings = document.getElementById('proSettingsNav');
  if (settings) buttons.push(settings);

  buttons.forEach((button) => {
    const key = button.id === 'proSettingsNav' ? 'proSettingsNav' : button.dataset.view;
    const shortcut = ADMIN_SECTION_SHORTCUTS[key];
    if (!shortcut) return;
    button.title = shortcut.label;
    button.setAttribute('aria-label', shortcut.label);
    if (!button.querySelector('.admin-section-icon')) {
      button.innerHTML = `<span class="admin-section-icon" aria-hidden="true">${shortcut.icon}</span><span class="admin-section-label">${shortcut.label}</span>`;
    }
    button.dataset.compactSectionReady = '1';
  });
}

function compactDashboardStats() {
  Object.entries(ADMIN_STAT_ICONS).forEach(([id, icon]) => {
    const value = document.getElementById(id);
    const card = value?.closest('.pro-stat');
    if (!card || card.dataset.compactStatReady) return;
    card.dataset.compactStatReady = '1';
    card.classList.add('pro-stat-compact');
    card.insertAdjacentHTML('afterbegin', `<span class="pro-stat-icon" aria-hidden="true">${icon}</span>`);
  });
}

function isMobileAdmin() {
  return window.matchMedia('(max-width:760px)').matches;
}

function mountMobileDrawerBackdrop() {
  let backdrop = document.querySelector('.admin-mobile-backdrop');
  if (backdrop) return backdrop;
  backdrop = document.createElement('button');
  backdrop.type = 'button';
  backdrop.className = 'admin-mobile-backdrop';
  backdrop.setAttribute('aria-label', 'إغلاق قائمة الإدارة');
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.appendChild(backdrop);
  return backdrop;
}

function syncMobileDrawerState() {
  const sidebar = document.getElementById('adminSidebar');
  const menuButton = document.getElementById('mobileMenuBtn');
  const backdrop = document.querySelector('.admin-mobile-backdrop');
  const open = Boolean(sidebar?.classList.contains('open') && isMobileAdmin());
  document.body.classList.toggle('admin-mobile-drawer-open', open);
  menuButton?.setAttribute('aria-expanded', open ? 'true' : 'false');
  backdrop?.setAttribute('aria-hidden', open ? 'false' : 'true');
}

function closeMobileDrawer() {
  document.getElementById('adminSidebar')?.classList.remove('open');
  syncMobileDrawerState();
}

function wireMobileDrawer() {
  const sidebar = document.getElementById('adminSidebar');
  const menuButton = document.getElementById('mobileMenuBtn');
  const backdrop = mountMobileDrawerBackdrop();
  if (!sidebar || !menuButton) return;

  menuButton.setAttribute('aria-controls', 'adminSidebar');
  menuButton.setAttribute('aria-expanded', 'false');

  const sidebarObserver = new MutationObserver(syncMobileDrawerState);
  sidebarObserver.observe(sidebar, { attributes: true, attributeFilter: ['class'] });

  backdrop.addEventListener('click', closeMobileDrawer);
  sidebar.addEventListener('click', (event) => {
    if (!isMobileAdmin()) return;
    if (event.target.closest('.nav-btn,[data-view],#proSettingsNav,.back-site')) closeMobileDrawer();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('admin-mobile-drawer-open')) closeMobileDrawer();
  });

  const mobileQuery = window.matchMedia('(max-width:760px)');
  mobileQuery.addEventListener?.('change', () => {
    if (!isMobileAdmin()) closeMobileDrawer();
    else syncMobileDrawerState();
  });

  syncMobileDrawerState();
}

function applyCompactAdminHome() {
  mountCompactStylesheet();
  compactSectionRail();
  compactDashboardStats();
  document.body.classList.add('admin-home-compact-ready');
}

function startCompactAdminHome() {
  applyCompactAdminHome();
  wireMobileDrawer();
  const observer = new MutationObserver(() => {
    compactSectionRail();
    compactDashboardStats();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startCompactAdminHome, { once: true });
} else {
  startCompactAdminHome();
}
