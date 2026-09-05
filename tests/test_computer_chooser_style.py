from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CODE = (ROOT / 'play-computer.js').read_text(encoding='utf-8')
PLAY = (ROOT / 'play-v10.html').read_text(encoding='utf-8')

back_start = CODE.index('function addTimeChooserBack() {')
back_end = CODE.index('function applyChooserTitle', back_start)
back = CODE[back_start:back_end]

assert '<span aria-hidden="true">›</span><span>رجوع</span>' in back, 'back control must show arrow and رجوع text'
assert 'position:absolute' in back and 'inset-inline-end:12px' in back, 'back control must stay fixed on the right'
assert 'min-width:72px' in back and 'height:38px' in back, 'back control must be compact'
assert 'border:1px solid rgba(224,181,103,.4)' in back, 'back control must use the existing gold-outline style'
assert 'border-radius:10px' in back and 'background:rgba(2,28,33,.44)' in back, 'back control must match chooser cards'
assert 'font:700 14px/1 Arial,sans-serif' in back, 'back label must stay compact'

style_start = CODE.index('function applyChooserTitle')
style_end = CODE.index('function setupTimeChooser', style_start)
style = CODE[style_start:style_end]
assert "title.style.setProperty('font-size', 'clamp(14px, 2.6vw, 20px)', 'important')" in style, 'chooser titles must use the smaller unified size'
assert "title.style.setProperty('white-space', 'normal', 'important')" in style, 'chooser title must wrap rather than clip'

assert 'play-computer.js?v=20260906-11' in PLAY, 'computer controller cache version must advance'
print('computer chooser compact title and styled back control: PASS')
