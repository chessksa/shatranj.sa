from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "home-theme.css").read_text(encoding="utf-8")


def test_stacked_ticker_titles_use_four_pixel_padding_without_fixed_width():
    assert "#welcomeTicker .welcome-ticker-label" in SOURCE
    assert "#tournamentResultsTicker .welcome-ticker-label" in SOURCE
    assert "padding:0 4px!important;" in SOURCE
    assert "flex:0 0 auto!important;" in SOURCE
    assert "width:auto!important;" in SOURCE
    assert "width:160px!important;" not in SOURCE
