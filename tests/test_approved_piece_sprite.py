from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPRITE = ROOT / "assets" / "pieces" / "shatranj-approved-20260904.svg"


def test_only_the_new_approved_piece_sprite_is_used():
    assert SPRITE.exists(), "new approved sprite must exist"
    sprite = SPRITE.read_text(encoding="utf-8")
    for code in ("wk", "wq", "wr", "wb", "wn", "wp", "bk", "bq", "br", "bb", "bn", "bp"):
        assert f'id="{code}"' in sprite
    assert sprite.count("data:image/webp;base64,") == 12

    for filename in ("play-v8.js", "play-v10-match.js"):
        js = (ROOT / filename).read_text(encoding="utf-8")
        assert "pieces/shatranj-approved-20260904.svg" in js
        assert "pieces/shatranj-3d-staunton-v3.svg" not in js


def test_previous_piece_assets_are_removed():
    pieces = ROOT / "assets" / "pieces"
    assert not (pieces / "approved-dark-20260904.png").exists()
    assert not (pieces / "approved-light-20260904.png").exists()


def test_board_theme_keeps_approved_cream_and_petrol_colors():
    css = (ROOT / "cm-chessboard-shatranj-v3.css").read_text(encoding="utf-8")
    compact = css.replace(" ", "")
    assert "fill:#d6cfbf" in compact
    assert "fill:#246f77" in compact
