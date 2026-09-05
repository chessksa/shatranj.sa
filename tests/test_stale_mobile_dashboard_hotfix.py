from pathlib import Path
html = Path('index.html').read_text(encoding='utf-8')
sw = Path('sw.js').read_text(encoding='utf-8')
notifications = Path('site-notifications.js').read_text(encoding='utf-8')
assert '<a id="dashboardNav"' not in html
assert 'const CACHE="shatranj-arab-v3";' in sw
assert 'client.navigate(client.url)' in sw
assert 'function removeStaleMobileDashboard()' in notifications
assert ".home-header #dashboardNav,.home-header .dashboard-link" in notifications
assert "el.textContent.trim() === 'لوحة التحكم'" in notifications
assert 'site-notifications.js?v=20260905-3' in html
print('stale mobile dashboard hotfix: PASS')
