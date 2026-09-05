from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "play-v10.html").read_text(encoding="utf-8")

assert 'id="gameActions"' in HTML, 'desktop/mobile shared actions need a stable id'
assert 'id="bottomPlayerCard"' in HTML, 'bottom player needs a stable anchor for desktop placement'
assert "desktopStack.insertBefore(gameActions, bottomPlayerCard)" in HTML, 'desktop must place actions between players'
assert "boardPanel.appendChild(gameActions)" in HTML, 'mobile must restore actions below the board'
assert "window.matchMedia('(min-width:901px)')" in HTML, 'placement must be desktop-only'
assert "@media(min-width:901px)" in HTML, 'desktop override must be isolated'
assert ".board-panel>.board-frame{width:min(100%,calc(100dvh - 34px),1000px)" in HTML, 'desktop board cap must grow to 1000px'
assert "body.live-game .board-panel>.board-frame{width:min(calc(100vw - 10px),calc(100dvh - 236px))!important" in HTML, 'approved mobile board cap must remain unchanged'

print('desktop play actions and board: PASS')
