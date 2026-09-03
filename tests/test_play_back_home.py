from pathlib import Path
import re

js = Path('play-live.js').read_text(encoding='utf-8')
html = Path('play.html').read_text(encoding='utf-8')

match = re.search(r"leaveBtn\.addEventListener\('click',async\(\)=>\{(.*?)\n\}\);", js, re.S)
assert match, 'leave button handler not found'
block = match.group(1)

assert 'confirm(' not in block, 'back button must not ask for leave confirmation'
assert "location.href='index.html';" in block, 'back button must navigate directly to homepage'
assert "if(!matchmakingWaiting.hidden) await cancelMatchmaking();" in block, 'active matchmaking must be cancelled before leaving'
assert 'play-live.js?v=20260903-3' in html, 'play page must load the fresh play-live.js version'

print('play back-to-home behavior: PASS')
