from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CODE = (ROOT / 'play-computer.js').read_text(encoding='utf-8')
PLAY = (ROOT / 'play-v10.html').read_text(encoding='utf-8')

back_start = CODE.index('function addTimeChooserBack() {')
back_end = CODE.index('function applyChooserTitle', back_start)
back = CODE[back_start:back_end]

assert '<span aria-hidden="true">›</span><span>رجوع</span>' in back, 'back control must show arrow and رجوع text'
assert 'position:absolute' in back and 'inset-inline-start:12px' in back, 'back control must move to the opposite side (left in RTL)'
assert 'inset-inline-end:auto' in back, 'back control must no longer occupy the right side'
assert 'min-width:72px' in back and 'height:36px' in back, 'back control must remain compact beside the title'
assert 'border:1px solid rgba(224,181,103,.4)' in back, 'back control must keep the existing gold-outline style'
assert 'border-radius:10px' in back and 'background:rgba(2,28,33,.44)' in back, 'back control must match chooser cards'

style_start = CODE.index('function applyChooserTitle')
style_end = CODE.index('function setupTimeChooser', style_start)
style = CODE[style_start:style_end]
assert "title.style.setProperty('font-size', 'clamp(12px, 3vw, 18px)', 'important')" in style, 'chooser title must be compact enough for one line'
assert "title.style.setProperty('white-space', 'nowrap', 'important')" in style, 'chooser title must stay on one line'
assert "title.style.setProperty('padding-inline-end', '88px', 'important')" in style, 'title must reserve space for the opposite-side back control'
assert "title.style.setProperty('padding-inline-start', '8px', 'important')" in style, 'title must not be symmetrically padded into the time cards'

assert 'play-computer.js?v=20260906-12' in PLAY, 'computer controller cache version must advance'
print('computer chooser single-line title and opposite-side back control: PASS')