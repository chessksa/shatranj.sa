from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_tournament_detail_typography_is_enlarged_to_20_16_14():
    css = (ROOT / "tournament-mobile-fonts.css").read_text(encoding="utf-8")
    loader = (ROOT / "site-presence.js").read_text(encoding="utf-8")

    assert ".detail-toolbar-title,.detail-title,.bracket-title{font-size:20px!important}" in css
    assert ".detail-label,.bracket-round-title{font-size:16px!important;font-weight:900!important}" in css
    assert ".detail-value{font-size:14px!important;font-weight:700!important}" in css
    assert ".detail-shell .status,.bracket-player,.bracket-meta,.bracket-empty{font-size:14px!important}" in css
    assert "tournament-mobile-fonts.css?v=20260910-detail-scale3" in loader
    assert ".detail-toolbar-title,.detail-title,.bracket-title{font-size:20px!important}" in loader
    assert ".detail-label,.bracket-round-title{font-size:16px!important;font-weight:900!important}" in loader
    assert ".detail-value{font-size:14px!important;font-weight:700!important}" in loader
    assert ".detail-shell .status,.bracket-player,.bracket-meta,.bracket-empty{font-size:14px!important}" in loader


def test_transformed_tournament_detail_table_keeps_label_larger_than_value_on_mobile():
    base = (ROOT / "site-presence-base.js").read_text(encoding="utf-8")
    loader = (ROOT / "site-presence.js").read_text(encoding="utf-8")

    assert ".tournament-detail-table th{width:36%;font-size:16px;font-weight:900}" in base
    assert ".tournament-detail-table td{font-size:14px;font-weight:700}" in base
    assert "site-presence-base.js?v=20260910-tournament-detail-table2" in loader
