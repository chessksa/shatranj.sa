from pathlib import Path

html = Path('index.html').read_text(encoding='utf-8')

assert '@media(max-width:800px){\n  body{padding-bottom:61px}' not in html, 'obsolete 61px mobile bottom reserve still creates blank scroll space'
assert 'id="homeBottomGapFix20260909"' in html, 'explicit mobile bottom-gap fix is missing'
assert '@media(max-width:800px){body{padding-bottom:0!important}}' in html, 'mobile body bottom padding must be zero'

print('home bottom gap checks passed')
