from pathlib import Path

theme = Path('home-theme.css').read_text(encoding='utf-8')

assert 'MOBILE PLAY BOXES 20PX 20260906' in theme
assert 'grid-template-rows:repeat(2,82px)!important' in theme
assert 'gap:10px!important' in theme
assert 'height:82px!important' in theme
assert 'min-height:82px!important' in theme
assert 'border-radius:14px!important' in theme
assert 'font-size:20px!important' in theme
assert 'font-family:Arial,sans-serif!important' in theme
assert 'line-height:1.2!important' in theme

print('mobile play boxes are evenly sized and use unified 20px Arial text')
