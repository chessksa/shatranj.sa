from pathlib import Path

html = Path('index.html').read_text(encoding='utf-8')

assert '@media(max-width:800px){\n  body{padding-bottom:61px}' not in html, 'obsolete mobile bottom reserve still creates blank scroll space'
assert 'bottomGapStylePattern' in html, 'bottom-gap style replacement must not depend on one exact historical style id'
assert 'home-theme\\.css\\?v=' in html, 'home-theme cache buster must be replaced with a version-agnostic pattern'
assert 'site-notifications\\.js\\?v=' in html, 'notification cache buster must be replaced with a version-agnostic pattern'
assert '@media(min-width:901px) and (max-height:700px)' not in html, 'short desktop heights must not re-enable page scrolling'
assert 'max-height:100dvh!important;' in html, 'signed-in desktop must be capped to the viewport height'
assert 'overflow:hidden!important;' in html, 'signed-in desktop must not expose page-level overflow'
assert 'padding-bottom:0!important;' in html, 'mobile body bottom padding must remain zero'

print('home refresh and bottom gap checks passed')
