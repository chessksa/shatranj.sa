from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_cm_chessboard_uses_final_3d_staunton_sprite_everywhere():
    live = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    prematch = (ROOT / "play-v10-match.js").read_text(encoding="utf-8")
    expected = "pieces/shatranj-3d-staunton-final.svg"
    assert expected in live
    assert expected in prematch


def test_final_sprite_maps_all_twelve_embedded_webp_pieces_and_declares_approved_shape():
    sprite = (ROOT / "assets" / "pieces" / "shatranj-3d-staunton-final.svg").read_text(encoding="utf-8")
    for code in ("wk", "wq", "wr", "wb", "wn", "wp", "bk", "bq", "br", "bb", "bn", "bp"):
        assert f'id="{code}"' in sprite
    assert sprite.count("data:image/webp;base64,") == 12
    assert 'data-piece-scale="1.16"' in sprite
    assert 'data-pawn-height="34"' in sprite
    assert 'data-king-top="circle"' in sprite


def test_board_theme_keeps_cream_and_uses_lighter_petrol():
    css = (ROOT / "cm-chessboard-shatranj.css").read_text(encoding="utf-8")
    compact = css.replace(" ", "")
    assert "fill:#d6cfbf" in compact
    assert "fill:#2b6f75" in compact


def test_board_colors_are_forced_inline_on_svg_squares():
    for filename in ("play-v8.js", "play-v10-match.js"):
        js = (ROOT / filename).read_text(encoding="utf-8")
        compact = js.replace(" ", "")
        assert "function forceBoardSquareColors" in js
        assert "style.setProperty('fill','#d6cfbf','important')" in compact
        assert "style.setProperty('fill','#2b6f75','important')" in compact
        assert "MutationObserver" in js
