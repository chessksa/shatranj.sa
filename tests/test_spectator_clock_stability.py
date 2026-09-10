from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_human_spectator_refresh_is_serialized_and_clock_uses_monotonic_anchor():
    html = read("human-watch.html")
    assert "let refreshInFlight=false" in html
    assert "performance.now()" in html
    assert "clockAnchor" in html
    assert "scheduleRefresh" in html
    assert "setInterval(fetchGame,1200)" not in html
    assert "setInterval(renderClocks,250)" not in html


def test_computer_spectator_never_restarts_elapsed_time_on_every_fetch():
    html = read("computer-watch.html")
    assert "serverFetchedAt" not in html
    assert "Date.now()-serverFetchedAt" not in html
    assert "let refreshInFlight=false" in html
    assert "performance.now()" in html
    assert "clockAnchor" in html
    assert "scheduleRefresh" in html
    assert "setInterval(fetchGame,1200)" not in html
    assert "setInterval(renderClocks,250)" not in html


def test_watch_routes_bust_spectator_cache():
    html = read("watch.html")
    assert "human-watch.html?v=20260910-clockfix1&game=" in html
    assert "computer-watch.html?v=20260910-clockfix1&game=" in html
