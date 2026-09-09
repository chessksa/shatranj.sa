from pathlib import Path

html = Path('index.html').read_text(encoding='utf-8')
base_css = Path('home-theme-base.css').read_text(encoding='utf-8')

assert '@media(max-width:800px){\n  body{padding-bottom:61px}' not in html, 'obsolete mobile bottom reserve still creates blank scroll space'
assert 'bottomGapStylePattern' in html, 'bottom-gap style replacement must not depend on one exact historical style id'
assert 'home-theme\\.css\\?v=' in html, 'home-theme cache buster must be replaced with a version-agnostic pattern'
assert 'site-notifications\\.js\\?v=' in html, 'notification cache buster must be replaced with a version-agnostic pattern'
assert '@media(min-width:901px) and (max-height:700px)' not in html, 'short desktop heights must not re-enable page scrolling'
assert 'max-height:100dvh!important;' in html, 'signed-in desktop must be capped to the viewport height'
assert 'padding-bottom:0!important;' in html, 'mobile body bottom padding must remain zero'

assert 'html:has(body.home-signed-in){overscroll-behavior-y:none!important}' not in html, 'mobile pull-to-refresh must not be disabled on the root scroller'
assert 'html body.home-signed-in{overscroll-behavior-y:none!important}' not in html, 'mobile pull-to-refresh must not be disabled on the signed-in body'
assert 'footer{margin-top:4px!important}' not in base_css, 'mobile footer must not add an artificial bottom-area gap'

print('mobile pull refresh and bottom gap checks passed')
