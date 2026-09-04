from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPRITE = ROOT / "assets" / "pieces" / "shatranj-approved-20260904.svg"
PIECE_CODES = ("wk", "wq", "wr", "wb", "wn", "wp", "bk", "bq", "br", "bb", "bn", "bp")


def test_sprite_is_self_contained_for_ios_webkit():
    """External raster hrefs inside an externally loaded SVG render as broken images on iOS Safari."""
    sprite = SPRITE.read_text(encoding="utf-8")
    for code in PIECE_CODES:
        assert f'id="{code}"' in sprite
    assert sprite.count("data:image/png;base64,") == 12
    assert 'href="wk.png' not in sprite
    assert 'href="wp.png' not in sprite
    assert 'href="bk.png' not in sprite
    assert 'href="bp.png' not in sprite


def test_piece_layout_is_centered_and_pawns_are_smaller():
    sprite = SPRITE.read_text(encoding="utf-8")
    assert 'id="wp"><image' in sprite
    assert 'id="bp"><image' in sprite
    assert 'x="4.5" y="4.5" width="31" height="31"' in sprite
    assert sprite.count('preserveAspectRatio="xMidYMid meet"') == 12


def test_live_and_prematch_boards_use_the_same_approved_sprite():
    for filename in ("play-v8.js", "play-v10-match.js"):
        js = (ROOT / filename).read_text(encoding="utf-8")
        assert "pieces/shatranj-approved-20260904.svg" in js


def test_board_theme_keeps_approved_colors():
    css = (ROOT / "cm-chessboard-shatranj-v3.css").read_text(encoding="utf-8")
    compact = css.replace(" ", "")
    assert "fill:#d6cfbf" in compact
    assert "fill:#246f77" in compact
