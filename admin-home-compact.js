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
  link.href = 'admin-home-compact.css?v=20260911-3';
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

function applyCompactAdminHome() {
  mountCompactStylesheet();
  compactSectionRail();
  compactDashboardStats();
  document.body.classList.add('admin-home-compact-ready');
}

function startCompactAdminHome() {
  applyCompactAdminHome();
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
