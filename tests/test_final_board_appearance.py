from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_final_sprite_is_used_before_and_during_matches():
    expected = "pieces/shatranj-3d-staunton-final.svg"
    for filename in ("play-v8.js", "play-v10-match.js"):
        js = (ROOT / filename).read_text(encoding="utf-8")
        assert expected in js


def test_final_sprite_declares_enlarged_uniform_pawns_and_circle_kings():
    sprite = (ROOT / "assets" / "pieces" / "shatranj-3d-staunton-final.svg").read_text(encoding="utf-8")
    assert 'data-piece-scale="1.16"' in sprite
    assert 'data-pawn-height="34"' in sprite
    assert 'data-king-top="circle"' in sprite
    for code in ("wk", "wq", "wr", "wb", "wn", "wp", "bk", "bq", "br", "bb", "bn", "bp"):
        assert f'id="{code}"' in sprite
    assert sprite.count("data:image/webp;base64,") == 12


def test_petrol_is_lighter_while_cream_stays_approved():
    css = (ROOT / "cm-chessboard-shatranj.css").read_text(encoding="utf-8").replace(" ", "")
    assert "fill:#d6cfbf" in css
    assert "fill:#2b6f75" in css

    for filename in ("play-v8.js", "play-v10-match.js"):
        js = (ROOT / filename).read_text(encoding="utf-8").replace(" ", "")
        assert "style.setProperty('fill','#d6cfbf','important')" in js
        assert "style.setProperty('fill','#2b6f75','important')" in js
