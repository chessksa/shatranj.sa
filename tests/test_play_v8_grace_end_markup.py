from pathlib import Path

html = Path('play-v8.html').read_text(encoding='utf-8')
js = Path('play-v8.js').read_text(encoding='utf-8')

assert 'id="endGraceBtn"' in html, 'play-v8.html must provide the endGraceBtn expected by play-v8.js'
assert 'id="endGraceCountdown"' in html, 'play-v8.html must provide the endGraceCountdown expected by play-v8.js'
assert 'id="flipBoard"' not in html, 'flip-board control must be removed from play-v8.html'
assert 'endGraceBtn.addEventListener' in js, 'play-v8.js must wire the grace-end button'
assert '.end-grace-countdown' in html and 'color:#f39a2e' in html, 'grace countdown must be orange'

print('play-v8 grace end markup: PASS')
