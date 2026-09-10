from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_tournament_table_fonts_are_14px_and_loader_has_fresh_override():
    loader = (ROOT / "site-presence.js").read_text(encoding="utf-8")
    css_path = ROOT / "tournament-mobile-fonts.css"

    assert "tournamentFont14Override" in loader
    assert "font-size:14px!important" in loader
    assert "tournament-mobile-fonts.css?v=20260910-font14" in loader
    assert css_path.exists()

    css = css_path.read_text(encoding="utf-8")
    assert "@media" not in css
    assert ".tournament-table th{font-size:14px!important}" in css
    assert ".tournament-table td{font-size:14px!important}" in css
    assert ".tournament-name{font-size:14px!important}" in css
    assert ".tournament-date{font-size:14px!important}" in css
    assert ".status{font-size:14px!important}" in css
    assert ".champion-name{font-size:14px!important}" in css
