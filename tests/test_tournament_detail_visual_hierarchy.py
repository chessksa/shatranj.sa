from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_tournament_detail_labels_are_visually_stronger_than_values():
    css = (ROOT / "tournament-mobile-fonts.css").read_text(encoding="utf-8")
    loader = (ROOT / "site-presence.js").read_text(encoding="utf-8")

    assert ".detail-label,.bracket-round-title{font-size:16px!important;font-weight:900!important}" in css
    assert ".detail-value{font-size:14px!important;font-weight:700!important}" in css
    assert ".detail-label,.bracket-round-title{font-size:16px!important;font-weight:900!important}" in loader
    assert ".detail-value{font-size:14px!important;font-weight:700!important}" in loader
