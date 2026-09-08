from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')
page = Path('index.html').read_text(encoding='utf-8')

required = [
    '/* Unified hero stat frames 20260908 */',
    'html body .home-hero .hero-stat{',
    'border:1px solid rgba(216,182,101,.42)!important;',
    'border-radius:17px!important;',
    'background:linear-gradient(145deg,rgba(216,182,101,.11),rgba(7,52,54,.92))!important;',
]

for token in required:
    assert token in css, f'missing unified stat frame rule: {token}'

assert 'home-theme.css?v=2026090802' in page, 'home theme cache version must be refreshed to 2026090802'

print('home hero stat cards match tournament frame and use refreshed CSS cache')
