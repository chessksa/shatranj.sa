from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_tournament_detail_typography_uses_16_14_12_scale():
    css = (ROOT / "tournament-mobile-fonts.css").read_text(encoding="utf-8")
    loader = (ROOT / "site-presence.js").read_text(encoding="utf-8")

    assert ".detail-toolbar-title,.detail-title,.bracket-title{font-size:16px!important}" in css
    assert ".detail-label,.bracket-round-title{font-size:14px!important}" in css
    assert ".detail-value{font-size:12px!important}" in css
    assert "tournament-mobile-fonts.css?v=20260910-detail-scale1" in loader
