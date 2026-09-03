from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_cm_chessboard_uses_3d_staunton_piece_sprite_everywhere():
    live = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    prematch = (ROOT / "play-v10-match.js").read_text(encoding="utf-8")
    expected = "pieces/shatranj-3d-staunton.svg"
    assert expected in live
    assert expected in prematch
    assert "pieces/shatranj-approved.svg" not in live
    assert "pieces/shatranj-approved.svg" not in prematch


def test_3d_staunton_sprite_maps_all_twelve_embedded_webp_pieces():
    sprite = (ROOT / "assets" / "pieces" / "shatranj-3d-staunton.svg").read_text(encoding="utf-8")
    for code in ("wk", "wq", "wr", "wb", "wn", "wp", "bk", "bq", "br", "bb", "bn", "bp"):
        assert f'id="{code}"' in sprite
    assert sprite.count("data:image/webp;base64,") == 12


def test_board_theme_keeps_approved_cream_and_petrol_colors():
    css = (ROOT / "cm-chessboard-shatranj.css").read_text(encoding="utf-8")
    assert "fill:#d6cfbf" in css.replace(" ", "")
    assert "fill:#0b4850" in css.replace(" ", "")


def test_board_colors_are_forced_inline_on_svg_squares():
    for filename in ("play-v8.js", "play-v10-match.js"):
        js = (ROOT / filename).read_text(encoding="utf-8")
        assert "function forceBoardSquareColors" in js
        assert "style.setProperty('fill','#d6cfbf','important')" in js.replace(" ", "")
        assert "style.setProperty('fill','#0b4850','important')" in js.replace(" ", "")
        assert "MutationObserver" in js
