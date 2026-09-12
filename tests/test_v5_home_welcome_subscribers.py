from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_home_restores_welcome_ticker_and_counts_loaded_subscribers():
    html = read("index-app.html")
    dashboard = read("v2/home/dashboard.mjs")

    assert '<small>المشتركين</small>' in html
    assert 'id="welcomeTicker"' in html
    assert 'id="welcomeTickerTrack"' in html
    assert "home-players-loaded" in html

    assert "home-players-loaded" in dashboard
    assert ".slice(0,10)" in dashboard
    assert "headerPlayersCount" in dashboard
    assert "players.length" in dashboard
    assert "welcome-ticker-track" in dashboard
    assert "cloneNode(true)" in dashboard
