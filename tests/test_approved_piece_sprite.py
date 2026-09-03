from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_cm_chessboard_keeps_single_approved_sprite_path_everywhere():
    live = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    prematch = (ROOT / "play-v10-match.js").read_text(encoding="utf-8")
    expected = "pieces/shatranj-approved.svg"
    assert expected in live
    assert expected in prematch


def test_approved_sprite_is_3d_staunton_and_maps_all_twelve_pieces():
    sprite = (ROOT / "assets" / "pieces" / "shatranj-approved.svg").read_text(encoding="utf-8")
    assert "3D Staunton" in sprite
    for code in ("wk", "wq", "wr", "wb", "wn", "wp", "bk", "bq", "br", "bb", "bn", "bp"):
        assert f'id="{code}"' in sprite
    assert 'assets/pieces/3d-staunton-dark.webp?v=20260904' in sprite
    assert 'assets/pieces/3d-staunton-light.webp?v=20260904' in sprite
    assert (ROOT / "assets" / "pieces" / "3d-staunton-dark.webp").exists()
    assert (ROOT / "assets" / "pieces" / "3d-staunton-light.webp").exists()


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
