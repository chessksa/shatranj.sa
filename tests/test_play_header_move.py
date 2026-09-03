from pathlib import Path

html = Path('play.html').read_text(encoding='utf-8')

assert '<header class="topbar">' not in html, 'page header must be removed from play page'
assert 'class="side-header"' in html, 'header actions must move into a compact side header'
assert html.index('class="side-header"') < html.index('<section class="player-card">'), 'side header must sit above player cards'
assert 'id="leaveBtn"' in html and 'id="reportBtn"' in html and 'id="siteNotificationHost"' in html, 'existing header controls must be preserved'
assert '--header-h:0px' in html, 'play layout must reclaim header height for the board'
assert 'grid-template-rows:auto minmax(0,1fr) auto minmax(0,1fr)' in html, 'side panel rows must account for compact header and both players'

print('play header move: PASS')
