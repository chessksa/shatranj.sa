from pathlib import Path

watch = Path('watch.html').read_text(encoding='utf-8')
human = Path('human-watch.html').read_text(encoding='utf-8')
computer = Path('computer-watch.html').read_text(encoding='utf-8')
board = Path('spectator-board.mjs').read_text(encoding='utf-8')
css = Path('spectator-play-layout.css').read_text(encoding='utf-8')

assert '>العودة للصفحة الرئيسية</a>' in watch
assert '.back{min-height:44px' in watch
assert "./spectator-board.mjs?v=20260910-playwatch1" in human
assert "./spectator-board.mjs?v=20260910-playwatch1" in computer
assert "layout.href = 'spectator-play-layout.css?v=20260910-playwatch1';" in board
assert "document.body.classList.add('spectator-play-layout');" in board
assert "function applyResultColors()" in board
assert "classList.add('result-winner')" in board
assert "classList.add('result-loser')" in board
assert '.spectator-play-layout .layout{' in css
assert 'grid-template-columns:minmax(0,1fr) clamp(360px,30vw,460px)' in css
assert '.spectator-play-layout .board-card{' in css
assert 'width:min(100%,calc(100dvh - 34px),920px)' in css
assert '.spectator-play-layout .player.result-winner{' in css
assert '.spectator-play-layout .player.result-loser{' in css
assert '.spectator-play-layout .player.result-draw{' in css

print('watch play-layout contract is present')
