from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')
index = Path('index.html').read_text(encoding='utf-8')

assert '/* Member data alignment and board action polish */' in css, 'member polish styles are missing'
assert '#accountPanel{' in css and 'text-align:center' in css, 'member data is not centered'
assert 'grid-template-columns:repeat(4,minmax(0,1fr))' in css, 'member stat boxes are not evenly sized'
assert 'min-height:64px' in css, 'member stat boxes do not have a consistent height'
assert 'grid-template-columns:repeat(2,minmax(0,1fr))' in css, 'play and invite actions are not equal columns'
assert 'height:42px' in css, 'play and invite buttons are not equal height'
assert 'home-theme.css?v=20260903-7' in index, 'homepage must load the fresh header/member stylesheet'

print('home member polish: PASS')
