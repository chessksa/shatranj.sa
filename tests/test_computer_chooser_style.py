from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CODE = (ROOT / 'play-computer.js').read_text(encoding='utf-8')
PLAY = (ROOT / 'play-v10.html').read_text(encoding='utf-8')

assert "function ensureChooserHeader()" in CODE, 'chooser must use a dedicated header row'
header_start = CODE.index('function ensureChooserHeader()')
header_end = CODE.index('function addTimeChooserBack()', header_start)
header = CODE[header_start:header_end]
assert "computer-chooser-header" in header, 'dedicated chooser header needs a stable hook'
assert "display:grid" in header and "align-items:center" in header, 'header row must own layout for its contents'
assert "direction:ltr" in header, 'header grid must use explicit visual left-to-right columns'

back_start = CODE.index('function addTimeChooserBack() {')
back_end = CODE.index('function applyChooserTitle', back_start)
back = CODE[back_start:back_end]
assert '<span aria-hidden="true">›</span><span>رجوع</span>' in back, 'back control must show arrow and رجوع text'
assert "header.style.gridTemplateColumns = 'auto minmax(0, 1fr)'" in back, 'time chooser header must reserve a separate left column for back'
assert "header.insertBefore(back, title)" in back, 'back control must occupy the left column before the title'
assert 'position:absolute' not in back, 'back control must participate in the header row instead of overlapping content'
assert 'min-width:72px' in back and 'height:36px' in back, 'back control must stay compact'
assert 'border:1px solid rgba(224,181,103,.4)' in back, 'back control must preserve the existing gold-outline style'
assert 'border-radius:10px' in back and 'background:rgba(2,28,33,.44)' in back, 'back control must match chooser styling'

style_start = CODE.index('function applyChooserTitle')
style_end = CODE.index('function setupTimeChooser', style_start)
style = CODE[style_start:style_end]
assert "title.style.setProperty('font-size', 'clamp(11px, 2.5vw, 17px)', 'important')" in style, 'chooser titles must use a compact size that fits one line'
assert "title.style.setProperty('white-space', 'nowrap', 'important')" in style, 'chooser title must remain on one line'
assert "title.style.setProperty('padding-inline', '0', 'important')" in style, 'title must not reserve overlapping internal space'
assert "title.style.setProperty('direction', 'rtl', 'important')" in style, 'Arabic title must retain RTL direction inside the LTR grid'
assert "title.style.setProperty('text-align', 'center', 'important')" in style

time_start = CODE.index('function setupTimeChooser')
time_end = CODE.index('function setupLevelChooser', time_start)
time_block = CODE[time_start:time_end]
assert "const { title } = ensureChooserHeader();" in time_block, 'time chooser must use the dedicated header row'
assert "applyChooserTitle(title, `اختر زمن المباراة — مستوى ${level.label}`);" in time_block
assert "options.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';" in time_block, 'time choices must remain in one row'

level_start = CODE.index('function setupLevelChooser')
level_block = CODE[level_start:]
assert "const { header, title } = ensureChooserHeader();" in level_block, 'level chooser must reuse the same header row'
assert "header.style.gridTemplateColumns = 'minmax(0, 1fr)'" in level_block, 'level chooser must collapse the unused back column'
assert "applyChooserTitle(title, 'اختر مستوى الكمبيوتر — النقاط للمسجلين');" in level_block

assert 'play-computer.js?v=20260906-13' in PLAY, 'computer controller cache version must advance'
print('computer chooser non-overlapping header grid: PASS')
