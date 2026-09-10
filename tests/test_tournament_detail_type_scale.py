from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_tournament_detail_typography_is_forced_inline_at_16_14_12():
    css = (ROOT / "tournament-mobile-fonts.css").read_text(encoding="utf-8")
    loader = (ROOT / "site-presence.js").read_text(encoding="utf-8")
    html = (ROOT / "tournaments.html").read_text(encoding="utf-8")

    assert ".detail-toolbar-title,.detail-title,.bracket-title{font-size:16px!important}" in css
    assert ".detail-label,.bracket-round-title{font-size:14px!important}" in css
    assert ".detail-value{font-size:12px!important}" in css
    assert "tournament-mobile-fonts.css?v=20260910-detail-scale1" in loader
    assert 'site-presence.js?v=20260910-detail-scale2' in html
    assert '/* tournament-detail-type-scale-16-14-12 */' in html
    assert '.detail-toolbar-title,.detail-title,.bracket-title{font-size:16px!important}' in html
    assert '.detail-label,.bracket-round-title{font-size:14px!important}' in html
    assert '.detail-value,.detail-shell .status,.bracket-player,.bracket-meta,.bracket-empty{font-size:12px!important}' in html
