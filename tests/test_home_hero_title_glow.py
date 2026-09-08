from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')
page = Path('index.html').read_text(encoding='utf-8')

required = [
    '/* Reliable orange-cyan hero title pulse 20260908 */',
    '@keyframes heroTitleOrangeCyanPulse',
    '#ffad4d',
    '#72e3f1',
    'animation:heroTitleOrangeCyanPulse 3s ease-in-out infinite!important;',
    '-webkit-text-fill-color:#ffad4d;',
    '-webkit-text-fill-color:#72e3f1;',
]

for token in required:
    assert token in css, f'missing reliable hero title pulse token: {token}'

effect = css.split('/* Reliable orange-cyan hero title pulse 20260908 */', 1)[-1]
assert 'background-clip:text' not in effect, 'title pulse must not depend on background-clip text'
assert '@media(prefers-reduced-motion:reduce)' not in effect, 'title pulse must not be disabled by reduced-motion settings'

selector_block, keyframes = effect.split('@keyframes heroTitleOrangeCyanPulse', 1)
assert 'color:#ffad4d!important;' not in selector_block, 'base orange color must not be !important or it blocks the animation'
assert '-webkit-text-fill-color:#ffad4d!important;' not in selector_block, 'base WebKit text fill must not be !important or it blocks the animation'
assert '!important' not in keyframes, 'keyframe color declarations must not use !important because browsers ignore it inside @keyframes'
assert 'home-theme.css?v=2026090805' in page, 'home theme cache key must advance after fixing the blocked color cycle'

print('hero title can actually cycle orange-cyan every 3 seconds and refreshed CSS cache')
