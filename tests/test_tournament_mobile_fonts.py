from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_tournament_mobile_table_fonts_are_readable():
    html = (ROOT / "tournaments.html").read_text(encoding="utf-8")
    assert ".tournament-table th{font-size:11px}" in html
    assert ".tournament-table td{font-size:12px}" in html
    assert ".tournament-name{font-size:12px}" in html
    assert ".tournament-date{font-size:10px}" in html
    assert ".status{padding:3px 4px;font-size:9px}" in html
    assert ".champion-name{font-size:12px}" in html
