from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = (ROOT / 'exact-board-v13.css').read_text(encoding='utf-8')
SW = (ROOT / 'sw.js').read_text(encoding='utf-8')

assert 'body.computer-game.pregame .opponent-time-options' in CSS, 'mobile computer time choices need a dedicated layout rule'
assert 'grid-template-columns:repeat(3,minmax(0,1fr))' in CSS, '5/10/15 minute choices must be three equal columns'
assert 'gap:8px' in CSS, 'time choices need even spacing'
assert 'body.computer-game.pregame #topPlayerCard' in CSS, 'time chooser card needs a mobile-specific height override'
assert 'min-height:118px' in CSS and 'height:auto' in CSS and 'overflow:visible' in CSS, 'time chooser container must expand instead of clipping its cards'
assert 'body.computer-game.pregame #opponentSearchPanel' in CSS, 'time chooser panel needs its own mobile sizing'
assert 'min-height:110px' in CSS and 'padding:4px 3px 8px' in CSS, 'time chooser panel needs enough room below the cards'
assert 'body.computer-game.pregame .opponent-time-option:not([data-level])' in CSS, 'time-card polish must not alter difficulty cards'
assert 'height:52px' in CSS and 'min-height:52px' in CSS and 'border-radius:12px' in CSS, 'time cards need one consistent compact size and radius'
assert 'border:1.5px solid rgba(224,181,103,.72)' in CSS, 'time cards should use a clear gold outline matching the approved mockup'
assert 'body.computer-game.pregame .opponent-time-option:not([data-level]) strong' in CSS
assert 'font-size:18px' in CSS and 'color:#e0b567' in CSS, 'minute numbers should stay compact at 18px and remain gold'
assert 'body.computer-game.pregame .opponent-time-option:not([data-level]) span' in CSS
assert 'font-size:11px' in CSS, 'minute label should be compact and centered'
assert 'body.pregame .board-panel,\n  body.live-game .board-panel' not in CSS, 'lower game-action spacing must be restored to its prior layout'
assert 'body.pregame .board-panel > .actions-card,\n  body.live-game .board-panel > .actions-card' not in CSS, 'lower action bar must not receive the extra margin'
assert '"/exact-board-v13.css"' in SW, 'the chooser stylesheet must bypass stale service-worker cache'
print('mobile time chooser unclipped and lower actions restored: PASS')
