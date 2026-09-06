from pathlib import Path

html = Path('play-v10.html').read_text(encoding='utf-8')
js = Path('play-computer.js').read_text(encoding='utf-8')

assert 'COMPUTER MOBILE CHOOSER POLISH 20260906' in html
assert 'body.computer-game.pregame .opponent-time-option[data-level] strong' in html
assert 'font-family:Arial,sans-serif!important' in html
assert 'font-size:18px!important' in html
assert '.computer-chooser-header{margin-bottom:4px!important}' in html
assert '.computer-time-back{height:30px!important}' in html
assert "header.style.direction = 'rtl';" in js
assert 'play-computer.js?v=20260906-14' in html
