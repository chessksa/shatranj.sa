from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_home_restores_welcome_ticker_and_counts_loaded_subscribers():
    html = read("index-app.html")

    assert '<small>المشتركين</small>' in html
    assert 'id="welcomeTicker"' in html
    assert 'id="welcomeTickerTrack"' in html
    assert 'renderWelcomeTicker(ALL_PLAYERS);' in html

    assert '.slice(0,10)' in html
    assert "track.className='welcome-ticker-track';" in html
    assert 'headerPlayers.textContent=ALL_PLAYERS.length' in html
    assert '500 + ALL_PLAYERS.length' not in html
