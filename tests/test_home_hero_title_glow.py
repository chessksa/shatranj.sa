from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')
page = Path('index.html').read_text(encoding='utf-8')

required = [
    '/* Reliable orange-cyan hero title pulse 20260908 */',
    '@keyframes heroTitleOrangeCyanPulse',
    '#ffad4d',
    'animation:heroTitleOrangeCyanPulse 3s ease-in-out infinite!important;',
    'filter:hue-rotate(0deg);',
    'filter:hue-rotate(151deg);',
    '-webkit-filter:hue-rotate(0deg);',
    '-webkit-filter:hue-rotate(151deg);',
]

for token in required:
    assert token in css, f'missing reliable hero title pulse token: {token}'

effect = css.split('/* Reliable orange-cyan hero title pulse 20260908 */', 1)[-1]
assert 'background-clip:text' not in effect, 'title pulse must not depend on background-clip text'
assert '@media(prefers-reduced-motion:reduce)' not in effect, 'title pulse must not be disabled by reduced-motion settings'

selector_block, keyframes = effect.split('@keyframes heroTitleOrangeCyanPulse', 1)
assert '.home-hero h1 span{' in selector_block, 'title and its span must share the same fixed orange source color'
assert 'animation:heroTitleOrangeCyanPulse' in selector_block, 'the title must carry the 3-second color-cycle animation'
assert '!important' not in keyframes, 'keyframes must not contain !important because browsers ignore it there'
assert 'home-theme.css?v=2026090805' in page, 'home theme cache key must advance after fixing the blocked color cycle'

print('hero title visibly cycles from orange toward cyan every 3 seconds and refreshed CSS cache')
