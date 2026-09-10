from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_tournament_list_removes_top_summary_and_uses_two_fixed_five_row_panels():
    html = (ROOT / "tournaments.html").read_text(encoding="utf-8")
    loader = (ROOT / "site-presence.js").read_text(encoding="utf-8")
    css = (ROOT / "tournament-layout-5rows.css").read_text(encoding="utf-8")

    assert 'البطولات الحالية' in html
    assert 'البطولات المنتهية' in html
    assert "document.querySelector('.page-head')?.remove()" in loader
    assert '--visible-tournament-rows:5' in css
    assert 'height:calc(var(--table-title-h) + var(--column-head-h) + (var(--tournament-row-h) * var(--visible-tournament-rows)) + 2px)' in css
    assert '.tournament-table-scroll{overflow-y:auto!important;overflow-x:hidden!important}' in css
    assert '.tournament-tables-grid{height:auto!important' in css
    assert '@media(max-width:700px)' in css
