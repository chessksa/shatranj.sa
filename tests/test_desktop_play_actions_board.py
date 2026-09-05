from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "play-v10.html").read_text(encoding="utf-8")


def test_desktop_actions_move_between_players_and_mobile_restores_below_board():
    assert 'id="gameActions"' in HTML
    assert 'id="bottomPlayerCard"' in HTML
    assert "desktopStack.insertBefore(gameActions, bottomPlayerCard)" in HTML
    assert "boardPanel.appendChild(gameActions)" in HTML
    assert "window.matchMedia('(min-width:901px)')" in HTML


def test_desktop_board_grows_to_1000px_without_changing_mobile_cap():
    assert "@media(min-width:901px)" in HTML
    assert ".board-panel>.board-frame{width:min(100%,calc(100dvh - 34px),1000px)" in HTML
    assert "body.live-game .board-panel>.board-frame{width:min(calc(100vw - 10px),calc(100dvh - 236px))!important" in HTML

# RED first: this test intentionally lands before the production change.
