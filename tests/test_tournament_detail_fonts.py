from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_tournament_detail_fields_use_12px_without_resizing_other_controls():
    css = (ROOT / "tournament-mobile-fonts.css").read_text(encoding="utf-8")
    loader = (ROOT / "site-presence.js").read_text(encoding="utf-8")

    assert ".detail-label,.detail-value{font-size:12px!important}" in css
    assert "tournament-mobile-fonts.css?v=20260910-font14-detail12" in loader
    assert ".detail-title{font-size:12px!important}" not in css
    assert ".register-btn{font-size:12px!important}" not in css
