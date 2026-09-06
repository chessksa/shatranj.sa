from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = (ROOT / 'exact-board-v13.css').read_text(encoding='utf-8')
SW = (ROOT / 'sw.js').read_text(encoding='utf-8')

assert 'body.computer-game.pregame .opponent-time-options' in CSS, 'mobile computer time choices need a dedicated layout rule'
assert 'grid-template-columns:repeat(3,minmax(0,1fr))' in CSS, '5/10/15 minute choices must be three equal columns'
assert 'gap:8px' in CSS, 'time choices need even spacing'
assert 'body.computer-game.pregame .opponent-time-option:not([data-level])' in CSS, 'time-card polish must not alter difficulty cards'
assert 'height:56px' in CSS and 'border-radius:12px' in CSS, 'time cards need one consistent size and radius'
assert 'border:1.5px solid rgba(224,181,103,.72)' in CSS, 'time cards should use a clear gold outline matching the approved mockup'
assert 'body.computer-game.pregame .opponent-time-option:not([data-level]) strong' in CSS
assert 'font-size:28px' in CSS and 'color:#e0b567' in CSS, 'minute numbers should be prominent and gold'
assert 'body.computer-game.pregame .opponent-time-option:not([data-level]) span' in CSS
assert 'font-size:11px' in CSS, 'minute label should be compact and centered'
assert '"/exact-board-v13.css"' in SW, 'the chooser stylesheet must bypass stale service-worker cache'
print('mobile time option cards aligned: PASS')
