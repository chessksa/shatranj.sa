from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_tournament_mobile_font_override_is_loaded_at_14px_with_fresh_cache_key():
    loader = (ROOT / "site-presence.js").read_text(encoding="utf-8")
    page = (ROOT / "tournaments.html").read_text(encoding="utf-8")
    css_path = ROOT / "tournament-mobile-fonts.css"

    assert "tournament-mobile-fonts.css?v=20260910-font14" in loader
    assert "site-presence.js?v=20260910-tournament-font14" in page
    assert css_path.exists()

    css = css_path.read_text(encoding="utf-8")
    assert ".tournament-table th{font-size:14px!important}" in css
    assert ".tournament-table td{font-size:14px!important}" in css
    assert ".tournament-name{font-size:14px!important}" in css
    assert ".tournament-date{font-size:14px!important}" in css
    assert ".status{font-size:14px!important}" in css
    assert ".champion-name{font-size:14px!important}" in css
