from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_play_page_loads_cm_chessboard_assets():
    html = (ROOT / "play-v10.html").read_text(encoding="utf-8")
    assert "cm-chessboard@8/assets/chessboard.css" in html
    assert 'id="board" class="cm-board-host"' in html


def test_live_game_uses_cm_chessboard_for_rendering_and_input():
    js = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    assert "cm-chessboard@8/src/Chessboard.js" in js
    assert "new Chessboard(boardEl" in js
    assert "enableMoveInput" in js
    assert "setPosition(game.fen()" in js
    assert "submit_live_move" in js
    assert "boardEl.innerHTML=''" not in js
