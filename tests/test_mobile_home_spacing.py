from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')
html = Path('index.html').read_text(encoding='utf-8')

assert '/* Mobile home spacing cleanup 20260905 */' in css
assert '@media(max-width:800px){\n  body{padding-bottom:0!important}\n}' in css
assert '.home-hero{padding:10px 0 6px!important}' in css
assert '.home-hero h1{margin:8px 0 4px!important}' in css
assert '.home-hero p{margin:0 0 10px!important}' in css
assert '.hero-live-stats{margin:0 0 10px!important}' in css
assert '#ranking{padding:4px 7px 6px!important}' in css
assert '.home-features{padding:10px 0 12px!important}' in css
assert '#register{padding:14px 0!important}' in css
assert 'home-theme.css?v=20260905-12' in html

print('mobile home spacing: PASS')
