from pathlib import Path

html = Path('play-v10.html').read_text(encoding='utf-8')
js = Path('play-computer.js').read_text(encoding='utf-8')

assert 'COMPUTER MOBILE CHOOSER POLISH V2 20260906' in html
assert 'body.computer-game.pregame .opponent-time-option[data-level] strong' in html
assert 'font-family:Arial,sans-serif!important' in html
assert 'font-size:18px!important' in html
assert 'body.computer-game.pregame .computer-chooser-header{' in html
assert 'height:30px!important' in html
assert 'display:block!important' in html
assert 'position:relative!important' in html
assert 'body.computer-game.pregame .computer-time-back{' in html
assert 'position:absolute!important' in html
assert 'right:0!important' in html
assert 'left:auto!important' in html
assert 'top:0!important' in html
assert "header.style.direction = 'rtl';" not in js
assert 'play-computer.js?v=20260906-15' in html
