# Final post-cleanup verification for the approved 2026-09-04 chess piece set.
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PIECES = ROOT / "assets" / "pieces"
SPRITE = PIECES / "shatranj-approved-20260904.svg"
DARK = "approved-dark-20260904.png"
LIGHT = "approved-light-20260904.png"


def test_only_the_new_approved_piece_set_is_used():
    assert SPRITE.exists(), "cm-chessboard wrapper for the approved pieces must exist"
    sprite = SPRITE.read_text(encoding="utf-8")
    for code in ("wk", "wq", "wr", "wb", "wn", "wp", "bk", "bq", "br", "bb", "bn", "bp"):
        assert f'id="{code}"' in sprite
    assert DARK in sprite
    assert LIGHT in sprite

    for filename in ("play-v8.js", "play-v10-match.js"):
        js = (ROOT / filename).read_text(encoding="utf-8")
        assert "pieces/shatranj-approved-20260904.svg" in js
        assert "pieces/shatranj-3d-staunton-v3.svg" not in js


def test_piece_script_cache_is_busted_for_the_new_sprite():
    html = (ROOT / "play-v10.html").read_text(encoding="utf-8")
    assert "play-v8.js?v=20260904-4" in html
    assert "play-v10-match.js?v=20260904-4" in html


def test_no_previous_piece_assets_remain():
    assert {p.name for p in PIECES.iterdir() if p.is_file()} == {
        DARK,
        LIGHT,
        "shatranj-approved-20260904.svg",
    }


def test_board_theme_keeps_approved_cream_and_petrol_colors():
    css = (ROOT / "cm-chessboard-shatranj-v3.css").read_text(encoding="utf-8")
    compact = css.replace(" ", "")
    assert "fill:#d6cfbf" in compact
    assert "fill:#246f77" in compact
