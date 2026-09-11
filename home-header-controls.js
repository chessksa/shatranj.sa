(() => {
  'use strict';

  function ensureTournamentControl() {
    const navUser = document.querySelector('.compact-member-nav .nav-user');
    if (!navUser || navUser.querySelector('.header-tournaments')) return;

    const link = document.createElement('a');
    link.className = 'header-tournaments header-tile';
    link.href = 'tournaments.html';
    link.setAttribute('aria-label', 'البطولات');
    link.innerHTML = '<span class="header-tile-icon" aria-hidden="true">♛</span><span>البطولات</span>';

    const logout = document.getElementById('navLogout');
    navUser.insertBefore(link, logout || null);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureTournamentControl, { once: true });
  } else {
    ensureTournamentControl();
  }
})();
