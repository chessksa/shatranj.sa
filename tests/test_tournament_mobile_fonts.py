from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_tournament_mobile_font_override_is_loaded_and_readable():
    loader = (ROOT / "site-presence.js").read_text(encoding="utf-8")
    css_path = ROOT / "tournament-mobile-fonts.css"
    assert "tournament-mobile-fonts.css?v=20260910-font1" in loader
    assert css_path.exists()
    css = css_path.read_text(encoding="utf-8")
    assert ".tournament-table th{font-size:11px!important}" in css
    assert ".tournament-table td{font-size:12px!important}" in css
    assert ".tournament-name{font-size:12px!important}" in css
    assert ".tournament-date{font-size:10px!important}" in css
    assert ".status{font-size:9px!important}" in css
    assert ".champion-name{font-size:12px!important}" in css
