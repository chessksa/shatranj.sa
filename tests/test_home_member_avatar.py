from pathlib import Path
import re

html = Path('index.html').read_text(encoding='utf-8')
css = Path('home-theme.css').read_text(encoding='utf-8')

panel = re.search(r'<div[^>]+id="accountPanel".*?</div>\s*</div>', html, re.S)
assert panel, 'member account panel not found'
panel_html = panel.group(0)

assert 'id="accountAvatarImage"' in panel_html, 'member photo image must exist in account box'
assert 'id="accountAvatarFallback"' in panel_html, 'member photo fallback must exist in account box'
assert panel_html.index('accountAvatarImage') < panel_html.index('accountWelcome'), 'member photo must appear above member data'
assert 'showAccountAvatar' in html, 'homepage must load the member avatar from profile storage'
assert "currentProfile.id" in html and "currentSession.user.id" in html, 'avatar loading must support current and legacy storage paths'

assert '.account-avatar{' in css, 'square member avatar style is missing'
avatar_css = re.search(r'\.account-avatar\{(.*?)\}', css, re.S)
assert avatar_css, 'member avatar CSS block not found'
block = avatar_css.group(1)
assert 'width:76px' in block and 'height:76px' in block, 'member avatar must be a fixed square'
assert 'border-radius:12px' in block, 'member avatar must have only lightly rounded square corners'
assert 'border-radius:50%' not in block, 'member avatar must not be circular'

print('home member square avatar: PASS')
