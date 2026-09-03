from pathlib import Path
import re

html = Path('index.html').read_text(encoding='utf-8')
css = Path('home-theme.css').read_text(encoding='utf-8')

panel_start = html.find('id="accountPanel"')
welcome_pos = html.find('id="accountWelcome"', panel_start)
assert panel_start >= 0 and welcome_pos > panel_start, 'member account panel not found'

avatar_pos = html.find('id="accountAvatarImage"', panel_start, welcome_pos)
fallback_pos = html.find('id="accountAvatarFallback"', panel_start, welcome_pos)
assert avatar_pos >= 0, 'member photo image must exist in account box'
assert fallback_pos >= 0, 'member photo fallback must exist in account box'
assert avatar_pos < welcome_pos, 'member photo must appear before member name in RTL row'
assert 'class="account-identity-row"' in html, 'member photo and name must share one identity row'
assert 'showAccountAvatar' in html, 'homepage must load the member avatar from profile storage'
assert "currentProfile.id" in html and "currentSession.user.id" in html, 'avatar loading must support current and legacy storage paths'

assert '.account-avatar{' in css, 'square member avatar style is missing'
avatar_css = re.search(r'\.account-avatar\{(.*?)\}', css, re.S)
assert avatar_css, 'member avatar CSS block not found'
block = avatar_css.group(1)
assert 'width:76px' in block and 'height:76px' in block, 'member avatar must be a fixed square'
assert 'border-radius:12px' in block, 'member avatar must have only lightly rounded square corners'
assert 'border-radius:50%' not in block, 'member avatar must not be circular'

identity_css = re.search(r'\.account-identity-row\{(.*?)\}', css, re.S)
assert identity_css, 'member identity row style is missing'
identity_block = identity_css.group(1)
assert 'display:flex' in identity_block, 'member photo and name must be aligned in one row'
assert 'align-items:center' in identity_block, 'member photo and name must be vertically aligned'
assert 'justify-content:center' in identity_block, 'member identity row must stay centered in the account box'

print('home member avatar beside name: PASS')
