from pathlib import Path

page = Path('index.html').read_text(encoding='utf-8')
css = Path('home-theme.css').read_text(encoding='utf-8')

assert 'المنصة العربية للشطرنج' in page
assert 'تشغيل تجريبي' in page
assert 'trial-badge' in page
assert '.trial-badge' in css
assert '#ff4d4f' in css or '#ef4444' in css or '#e53935' in css
assert 'home-theme.css?v=2026090806' in page

print('trial badge is present beside platform kicker, styled red, and cache-refreshed')
