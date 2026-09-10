from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_tournament_list_removes_top_summary_and_stretches_two_scrollable_panels():
    html = (ROOT / "tournaments.html").read_text(encoding="utf-8")
    loader = (ROOT / "site-presence.js").read_text(encoding="utf-8")
    css = (ROOT / "tournament-layout-5rows.css").read_text(encoding="utf-8")

    assert 'البطولات الحالية' in html
    assert 'البطولات المنتهية' in html
    assert "document.querySelector('.page-head')?.remove()" in loader
    assert '--visible-tournament-rows:5' not in css
    assert 'main>.wrap:not(.detail-active){display:flex!important;flex-direction:column!important;height:100%!important;min-height:0!important}' in css
    assert '.tournament-list-view{flex:1 1 auto!important;height:auto!important;min-height:0!important;overflow:hidden!important}' in css
    assert '.tournament-tables-grid{height:100%!important' in css
    assert '.tournament-table-shell{height:100%!important;max-height:100%!important;min-height:0!important}' in css
    assert '.tournament-table-scroll{' in css
    assert 'overflow-y:auto!important' in css
    assert 'overflow-x:hidden!important' in css
    assert '.tournament-table-head{font-size:16px!important}' in css
    assert 'grid-template-rows:repeat(2,minmax(0,1fr))!important' in css
