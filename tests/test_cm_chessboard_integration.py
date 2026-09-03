from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_live_game_loads_cm_chessboard_assets_without_rebuilding_page():
    js = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    assert "cm-chessboard@8/src/Chessboard.js" in js
    assert "cm-chessboard@8/assets/chessboard.css" in js
    assert "cm-chessboard-shatranj.css" in js
    assert "boardEl.className='cm-board-host'" in js


def test_live_game_uses_cm_chessboard_for_rendering_and_input():
    js = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    assert "new Chessboard(boardEl" in js
    assert "enableMoveInput" in js
    assert "setPosition(game.fen()" in js
    assert "submit_live_move" in js
    assert "boardEl.innerHTML=''" not in js


def test_cm_chessboard_theme_matches_site_palette():
    css = (ROOT / "cm-chessboard-shatranj.css").read_text(encoding="utf-8")
    assert "#d6cfbf" in css
    assert "#0b4850" in css
    assert ".cm-chessboard.shatranj" in css
