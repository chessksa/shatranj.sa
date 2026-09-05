from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')
html = Path('index.html').read_text(encoding='utf-8')

assert '.hero-stat div small{order:1!important;margin:0 0 7px!important;font-size:14px!important}' in css, 'hero stat labels must be 14px'
assert 'home-theme.css?v=20260905-8' in html, 'home page must use fresh stylesheet cache version'
print('home stat labels: PASS')
