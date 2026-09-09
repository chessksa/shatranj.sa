from pathlib import Path

html = Path('index.html').read_text(encoding='utf-8')
theme_css = Path('home-theme.css').read_text(encoding='utf-8')

assert '@media(max-width:800px){\n  body{padding-bottom:61px}' not in html, 'obsolete mobile bottom reserve still creates blank scroll space'
assert 'bottomGapStylePattern' in html, 'bottom-gap style replacement must not depend on one exact historical style id'
assert 'home-theme\\.css\\?v=' in html, 'home-theme cache buster must be replaced with a version-agnostic pattern'
assert 'site-notifications\\.js\\?v=' in html, 'notification cache buster must be replaced with a version-agnostic pattern'
assert '@media(min-width:901px) and (max-height:700px)' not in html, 'short desktop heights must not re-enable page scrolling'
assert 'max-height:100dvh!important;' in html, 'signed-in desktop must be capped to the viewport height'
assert 'padding-bottom:0!important;' in html, 'mobile body bottom padding must remain zero'

assert 'html:has(body.home-signed-in){overscroll-behavior-y:none!important}' not in html, 'current loader must not disable mobile pull-to-refresh'
assert 'html body.home-signed-in{overscroll-behavior-y:none!important}' not in html, 'current loader must not disable mobile pull-to-refresh on body'
assert 'html:has(body.home-signed-in):root{overscroll-behavior-y:auto!important}' in theme_css, 'fresh theme must override stale loader rules and restore pull-to-refresh'
assert 'html body footer{margin-top:0!important}' in theme_css, 'fresh theme must cancel the artificial mobile footer gap'

# The mobile ranking viewport must remain fixed and internally scrollable.
assert 'html body.home-signed-in #ranking .table-card{\n    position:relative!important;\n    flex:0 0 210px!important;\n    height:210px!important;\n    min-height:210px!important;\n    max-height:210px!important;' in theme_css, 'signed-in mobile ranking card must stay 210px tall'
assert 'html body.home-signed-in #ranking .table-wrap{\n    height:100%!important;' in theme_css, 'ranking rows must scroll inside the fixed card'
assert 'html body.home-signed-in #ranking .table-card{\n    flex:1 1 auto!important;\n    height:auto!important;' not in theme_css, 'ranking card must not stretch to reveal all ten rows'
assert 'html body.home-signed-in #ranking{\n    flex:1 0 auto!important;' in theme_css, 'only the outer ranking section may absorb leftover viewport space'

print('mobile pull refresh, fixed ranking viewport, and bottom gap checks passed')
