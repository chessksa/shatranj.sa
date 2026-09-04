from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPRITE = ROOT / "assets" / "pieces" / "shatranj-approved-20260904.svg"
PIECE_CODES = ("wk", "wq", "wr", "wb", "wn", "wp", "bk", "bq", "br", "bb", "bn", "bp")
PNG_CODES = ("wr", "wn", "wb", "wq", "wk", "wp", "br", "bn", "bb", "bq", "bk", "bp")
CACHE = "20260904-12"


def test_uploaded_png_piece_set_is_complete():
    for code in PNG_CODES:
        piece = ROOT / "assets" / "pieces" / f"{code}.png"
        assert piece.exists(), f"missing {piece.name}"
        assert piece.stat().st_size > 1000


def test_sprite_is_self_contained_for_ios_webkit():
    assert SPRITE.exists(), "cm-chessboard sprite is missing"
    sprite = SPRITE.read_text(encoding="utf-8")
    for code in PIECE_CODES:
        assert f'id="{code}"' in sprite
    assert sprite.count("data:image/png;base64,") == 12
    assert sprite.count('preserveAspectRatio="xMidYMid meet"') == 12
    assert ".png" not in sprite


def test_live_and_prematch_boards_use_current_sprite_cache():
    expected = f"pieces/shatranj-approved-20260904.svg?v={CACHE}"
    for filename in ("play-v8.js", "play-v10-match.js"):
        js = (ROOT / filename).read_text(encoding="utf-8")
        assert expected in js


def test_play_page_loads_current_scripts():
    html = (ROOT / "play-v10.html").read_text(encoding="utf-8")
    assert f"play-v8.js?v={CACHE}" in html
    assert f"play-v10-match.js?v={CACHE}" in html


def test_board_theme_keeps_approved_colors():
    css = (ROOT / "cm-chessboard-shatranj-v3.css").read_text(encoding="utf-8")
    compact = css.replace(" ", "")
    assert "fill:#d6cfbf" in compact
    assert "fill:#246f77" in compact
