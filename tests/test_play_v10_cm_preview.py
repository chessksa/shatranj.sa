from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_play_v10_prematch_board_uses_cm_chessboard():
    js = (ROOT / "play-v10-match.js").read_text(encoding="utf-8")
    assert "cm-chessboard@8/src/Chessboard.js" in js
    assert "new Chessboard(boardEl" in js
    assert "cm-chessboard-shatranj.css" in js
    assert "renderPreviewBoard" not in js
    assert "assets/pieces/${color}${type}.png" not in js
