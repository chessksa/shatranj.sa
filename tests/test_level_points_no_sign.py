from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = (ROOT / 'exact-board-v13.css').read_text(encoding='utf-8')

for level, label in [('easy', '5 نقاط'), ('medium', '10 نقاط'), ('hard', '20 نقطة')]:
    selector = f'.opponent-time-option[data-level="{level}"] > span::after'
    assert selector in CSS, f'{level} needs a display-only label override'
    assert f'content:"{label}"' in CSS, f'{level} must display {label} without ±'

assert 'font-size:0!important' in CSS, 'original ± text must be visually suppressed without changing score logic'
print('level point labels display without ±: PASS')
