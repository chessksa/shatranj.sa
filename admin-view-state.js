const VIEW_HASH_PREFIX = '#';
const RESTORE_RETRY_MS = 120;
const RESTORE_MAX_ATTEMPTS = 50;

function currentViewFromHash() {
  const raw = location.hash.startsWith(VIEW_HASH_PREFIX) ? location.hash.slice(1) : '';
  return raw ? decodeURIComponent(raw) : '';
}

function navButtonFor(viewId) {
  if (!viewId) return null;
  return [...document.querySelectorAll('.nav-btn[data-view]')].find((button) => button.dataset.view === viewId) || null;
}

function writeViewHash(viewId) {
  if (!viewId) return;
  const nextHash = `#${encodeURIComponent(viewId)}`;
  if (location.hash === nextHash) return;
  history.replaceState(history.state, '', `${location.pathname}${location.search}${nextHash}`);
}

function restoreAdminView(attempt = 0) {
  const viewId = currentViewFromHash();
  if (!viewId) return;

  const app = document.getElementById('adminApp');
  const button = navButtonFor(viewId);
  if (!app || app.hidden || !button) {
    if (attempt < RESTORE_MAX_ATTEMPTS) setTimeout(() => restoreAdminView(attempt + 1), RESTORE_RETRY_MS);
    return;
  }

  if (!button.classList.contains('active')) button.click();
}

function startAdminViewState() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('.nav-btn[data-view]');
    if (!button) return;
    writeViewHash(button.dataset.view);
  });

  window.addEventListener('hashchange', () => restoreAdminView());
  restoreAdminView();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startAdminViewState, { once:true });
} else {
  startAdminViewState();
}

export { restoreAdminView };
