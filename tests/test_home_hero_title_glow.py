from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')
page = Path('index.html').read_text(encoding='utf-8')

required = [
    '/* Reliable orange-cyan hero title pulse 20260908 */',
    '@keyframes heroTitleOrangeCyanPulse',
    '#ffad4d',
    '#72e3f1',
    'animation:heroTitleOrangeCyanPulse 3s ease-in-out infinite!important;',
    '-webkit-text-fill-color:#ffad4d!important;',
    '-webkit-text-fill-color:#72e3f1!important;',
]

for token in required:
    assert token in css, f'missing reliable hero title pulse token: {token}'

effect = css.split('/* Reliable orange-cyan hero title pulse 20260908 */', 1)[-1]
assert 'background-clip:text' not in effect, 'title pulse must not depend on background-clip text'
assert '@media(prefers-reduced-motion:reduce)' not in effect, 'title pulse must not be disabled by reduced-motion settings'
assert 'home-theme.css?v=2026090804' in page, 'home theme cache key must advance for the 3-second title pulse'

print('hero title uses a reliable 3-second orange-cyan pulse and refreshed CSS cache')
