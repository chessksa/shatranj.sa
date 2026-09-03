from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_play_v10_prematch_board_uses_cm_chessboard():
    js = (ROOT / "play-v10-match.js").read_text(encoding="utf-8")
    assert "cm-chessboard@8/src/Chessboard.js" in js
    assert "new Chessboard(boardEl" in js
    assert "cm-chessboard-shatranj.css" in js
    assert "renderPreviewBoard" not in js
    assert "assets/pieces/${color}${type}.png" not in js


def test_legacy_exact_board_overlay_is_disabled():
    css = (ROOT / "exact-board-v13.css").read_text(encoding="utf-8")
    js = (ROOT / "exact-board-v13.js").read_text(encoding="utf-8")
    assert "approved-board-v13.webp" not in css
    assert "board-reference-v12.css" not in css
    assert "exact-board-preview" not in js
