from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
css = (ROOT / 'exact-board-v13.css').read_text(encoding='utf-8')
page = (ROOT / 'play-v10.html').read_text(encoding='utf-8')

assert 'class="side-head-stack"' in page
assert 'id="tournamentGameBadge"' in page
assert 'body.live-game .board-panel{flex:0 0 auto!important}' in css, 'live mobile board panel must not flex-shrink when tournament banner is visible'
assert 'body.live-game .board-panel>.board-frame{flex:0 0 auto!important}' in css, 'board frame must keep its established size'
assert 'body.live-game .board-panel>.board-frame,body.live-game .board-panel>.actions-card{width:min(calc(100vw - 10px),calc(100dvh - 330px))!important}' in css, 'existing live board size formula must stay unchanged'

print('tournament banner board-size stability: PASS')
