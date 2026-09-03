from pathlib import Path

css = Path('realistic-pieces.css').read_text(encoding='utf-8')

assert '-webkit-mask-image:none !important' in css, 'realistic sprite must clear legacy webkit mask images'
assert 'mask-image:none !important' in css, 'realistic sprite must clear legacy mask images'
assert '.piece::after' in css and 'display:none !important' in css, 'legacy overlay pseudo-element must be disabled'
assert 'background-image:url("assets/realistic-pieces.png")' in css, 'realistic sprite image must remain enabled'

print('realistic piece mask isolation: PASS')
