from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
css = (ROOT / 'exact-board-v13.css').read_text(encoding='utf-8')
page = (ROOT / 'play-v10.html').read_text(encoding='utf-8')

# The tournament banner adds vertical UI. Mobile board sizing must therefore
# remain width-driven and must not shrink because of viewport-height budget.
marker = '/* Tournament banner must not change the established mobile board width. */'
assert marker in css, 'missing dedicated tournament board-size stability rule'
section = css[css.index(marker):]
assert 'body.live-game .board-panel>.board-frame,body.live-game .board-panel>.actions-card' in section
assert 'width:calc(100vw - 10px)!important' in section
assert 'calc(100dvh - 330px)' not in section
assert 'exact-board-v13.css?v=20260909-tournamentboardwidth2' in page

print('tournament board width stability: PASS')
