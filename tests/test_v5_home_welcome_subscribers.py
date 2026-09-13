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
    assert "welcome-ticker-track" in dashboard
    assert "cloneNode(true)" in dashboard


def test_home_ticker_explicitly_loads_synthetic_members_and_restores_tournaments_strip():
    dashboard = read("v2/home/dashboard.mjs")

    assert ".from('public_players')" in dashboard
    assert "is_synthetic" in dashboard
    assert ".order('created_at',{ascending:false})" in dashboard
    assert ".limit(20)" in dashboard
    assert "renderWelcomeSubscribers" in dashboard

    assert "tournamentResultsTicker" in dashboard
    assert "tournamentResultsTickerTrack" in dashboard
    assert ".from('tournaments')" in dashboard
    assert "loadTournamentTicker" in dashboard
    assert "status==='running'" in dashboard
    assert "status==='open'" in dashboard


def test_public_snapshot_includes_all_active_subscribers_including_synthetic():
    migration = read("supabase/migrations/20260913_home_public_snapshot_all_subscribers.sql")

    assert "create or replace function public.get_public_home_snapshot()" in migration
    assert "where p.status = 'active'" in migration
    assert "p.auth_user_id is not null" not in migration
    assert "coalesce(p.is_synthetic, false) = false" not in migration


def test_tournament_strip_is_bootstrapped_before_dashboard_runtime():
    loader = read("index.html")
    bootstrap = read("home-tickers-bootstrap.js")

    bootstrap_at = loader.index("home-tickers-bootstrap.js")
    dashboard_at = loader.index("v2/home/dashboard.mjs")

    assert bootstrap_at < dashboard_at
    assert "tournamentResultsTicker" in bootstrap
    assert "tournamentResultsTickerTrack" in bootstrap
    assert "نتائج البطولات" in bootstrap
    assert "/rest/v1/tournaments" in bootstrap
