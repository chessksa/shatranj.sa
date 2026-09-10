from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_shared_clock_tracker_uses_monotonic_time_and_never_increases_same_turn():
    tracker = read("spectator-clock.mjs")
    assert "globalThis.performance?.now?.()" in tracker
    assert "anchor.turnStartedAt===turnStartedAt" in tracker
    assert "white=Math.min(white,previous.white)" in tracker
    assert "black=Math.min(black,previous.black)" in tracker


def test_human_spectator_refresh_is_serialized_and_uses_shared_clock_anchor():
    html = read("human-watch.html")
    assert "spectator-clock.mjs?v=20260910-clockfix1" in html
    assert "let refreshInFlight=false" in html
    assert "clockAnchor" in html
    assert "scheduleRefresh" in html
    assert "setInterval(fetchGame,1200)" not in html
    assert "setInterval(renderClocks,250)" not in html


def test_computer_spectator_never_restarts_elapsed_time_on_every_fetch():
    html = read("computer-watch.html")
    assert "serverFetchedAt" not in html
    assert "Date.now()-serverFetchedAt" not in html
    assert "spectator-clock.mjs?v=20260910-clockfix1" in html
    assert "let refreshInFlight=false" in html
    assert "clockAnchor" in html
    assert "scheduleRefresh" in html
    assert "setInterval(fetchGame,1200)" not in html
    assert "setInterval(renderClocks,250)" not in html


def test_watch_routes_bust_spectator_cache():
    html = read("watch.html")
    assert "human-watch.html?v=20260910-clockfix1&game=" in html
    assert "computer-watch.html?v=20260910-clockfix1&game=" in html
