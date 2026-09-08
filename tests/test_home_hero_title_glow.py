from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')
page = Path('index.html').read_text(encoding='utf-8')

required = [
    '/* Calm orange-cyan hero title glow 20260908 */',
    '@keyframes heroTitleOrangeCyanGlow',
    '#ffb45c',
    '#79e7ef',
    'animation:heroTitleOrangeCyanGlow 6s ease-in-out infinite!important;',
    'background-size:220% 100%!important;',
    '-webkit-background-clip:text!important;',
    '-webkit-text-fill-color:transparent!important;',
    '@media(prefers-reduced-motion:reduce)',
]

for token in required:
    assert token in css, f'missing hero title glow token: {token}'

assert 'home-theme.css?v=2026090803' in page, 'home theme cache key must advance for the new title effect'

print('hero title uses a calm, clear orange-cyan glow and refreshed CSS cache')
