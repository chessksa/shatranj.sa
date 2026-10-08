from pathlib import Path

sw=Path('sw.js').read_text(encoding='utf-8')
html=Path('play.html').read_text(encoding='utf-8')
app=Path('app.js').read_text(encoding='utf-8')

assert 'PLAY_CACHE_RESET_VERSION' in html
assert 'getRegistrations' in html and 'caches.keys' in html
assert "self.addEventListener('activate'" in sw and 'caches.delete' in sw
assert 'self.registration.unregister()' in sw
assert "self.addEventListener('fetch'" not in sw
assert "navigator.serviceWorker.register" not in app
print('retired SW cannot restore stale cached interface: PASS')
