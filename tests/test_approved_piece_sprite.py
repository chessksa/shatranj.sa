from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_cm_chessboard_uses_approved_piece_sprite_everywhere():
    live = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    prematch = (ROOT / "play-v10-match.js").read_text(encoding="utf-8")
    expected = "pieces/shatranj-approved.svg"
    assert expected in live
    assert expected in prematch
    assert "pieces/staunty.svg" not in live
    assert "pieces/staunty.svg" not in prematch


def test_approved_sprite_maps_all_twelve_existing_png_pieces_from_page_root():
    sprite = (ROOT / "assets" / "pieces" / "shatranj-approved.svg").read_text(encoding="utf-8")
    for code in ("wk", "wq", "wr", "wb", "wn", "wp", "bk", "bq", "br", "bb", "bn", "bp"):
        assert f'id="{code}"' in sprite
        assert f'href="assets/pieces/{code}.png"' in sprite


def test_board_theme_keeps_approved_cream_and_petrol_colors():
    css = (ROOT / "cm-chessboard-shatranj.css").read_text(encoding="utf-8")
    assert "fill:#d6cfbf" in css.replace(" ", "")
    assert "fill:#0b4850" in css.replace(" ", "")
