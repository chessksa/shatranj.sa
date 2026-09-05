from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CODE = (ROOT / 'play-computer.js').read_text(encoding='utf-8')
PLAY = (ROOT / 'play-v10.html').read_text(encoding='utf-8')

assert "function ensureChooserHeader()" in CODE, 'chooser must use a dedicated header row'
header_start = CODE.index('function ensureChooserHeader()')
header_end = CODE.index('function addTimeChooserBack()', header_start)
header = CODE[header_start:header_end]
assert "computer-chooser-header" in header, 'dedicated chooser header needs a stable hook'
assert "position:relative" in header and "display:flex" in header, 'header row must own positioning for its contents'
assert "justify-content:center" in header, 'chooser title must remain centered in the header row'

back_start = CODE.index('function addTimeChooserBack() {')
back_end = CODE.index('function applyChooserTitle', back_start)
back = CODE[back_start:back_end]
assert '<span aria-hidden="true">›</span><span>رجوع</span>' in back, 'back control must show arrow and رجوع text'
assert "header.appendChild(back)" in back, 'back control must live inside the dedicated header row'
assert 'position:absolute' in back and 'left:8px' in back, 'back control must be fixed on the visual left side of the header row'
assert 'top:50%' in back and 'transform:translateY(-50%)' in back, 'back control must align vertically with the title'
assert 'min-width:72px' in back and 'height:36px' in back, 'back control must stay compact'
assert 'border:1px solid rgba(224,181,103,.4)' in back, 'back control must preserve the existing gold-outline style'
assert 'border-radius:10px' in back and 'background:rgba(2,28,33,.44)' in back, 'back control must match chooser styling'

style_start = CODE.index('function applyChooserTitle')
style_end = CODE.index('function setupTimeChooser', style_start)
style = CODE[style_start:style_end]
assert "title.style.setProperty('font-size', 'clamp(12px, 3vw, 18px)', 'important')" in style, 'chooser titles must use the compact unified size'
assert "title.style.setProperty('white-space', 'nowrap', 'important')" in style, 'chooser title must remain on one line'
assert "title.style.setProperty('padding-inline', '0', 'important')" in style, 'title must not reserve space internally for the back control'
assert "title.style.setProperty('text-align', 'center', 'important')" in style

time_start = CODE.index('function setupTimeChooser')
time_end = CODE.index('function setupLevelChooser', time_start)
time_block = CODE[time_start:time_end]
assert "const { header, title } = ensureChooserHeader();" in time_block, 'time chooser must use the dedicated header row'
assert "header.style.padding = '0 84px';" in time_block, 'time chooser header must reserve equal space around the centered title'
assert "applyChooserTitle(title, `اختر زمن المباراة — مستوى ${level.label}`);" in time_block
assert "options.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';" in time_block, 'time choices must remain in one row'

level_start = CODE.index('function setupLevelChooser')
level_block = CODE[level_start:]
assert "const { header, title } = ensureChooserHeader();" in level_block, 'level chooser must reuse the same header row'
assert "header.style.padding = '0 8px';" in level_block, 'level chooser should remove the reserved back-button space'
assert "applyChooserTitle(title, 'اختر مستوى الكمبيوتر — النقاط للمسجلين');" in level_block

assert 'play-computer.js?v=20260906-13' in PLAY, 'computer controller cache version must advance'
print('computer chooser dedicated header row: PASS')
