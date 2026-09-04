from pathlib import Path

html = Path('play-v8.html').read_text(encoding='utf-8')

assert "location.replace('play-v10.html' + location.search + location.hash)" in html, (
    'play-v8.html must redirect legacy URLs to play-v10.html while preserving query/hash'
)
assert 'id="matchmakingScreen"' not in html, 'legacy matchmaking UI must not remain in play-v8.html'
assert 'play-v8.js' not in html, 'legacy play-v8 runtime must not execute after redirect'

print('play-v8 legacy redirect: PASS')
