"""Tournament list/detail colors must follow the site's approved charcoal palette.

The older tournament detail/table scripts inject their own !important styles.
Selectors in the dedicated contrast sheet intentionally outrank those rules.
"""
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT/path).read_text(encoding="utf-8")

def test_tournament_theme_loads_after_generic_palette():
    app=read("tournaments-app.html")
    css=read("tournament-unified-contrast.css")
    boot=read("tournaments.html")
    assert "tournament-unified-contrast.css?v=20261019-tournament-graphite-v1" in app
    assert app.index("site-charcoal-theme.css?v=") < app.index("tournament-unified-contrast.css?v=")
    assert "const stamp='20261019-tournament-graphite-v1'" in boot
    for token in ("#353C45", "#66717D", "#D8B665", "#303943"):
        assert token in css

def test_detail_themes_override_classic_injected_style():
    css=read("tournament-unified-contrast.css")
    # html body prefix supplies greater selector specificity than the legacy
    # detail-style JS, even when that script appends a <style> later on.
    for selector in (
        "html body #tournamentDetailView .detail-toolbar",
        "html body #tournamentDetailView .detail-toolbar-title",
        "html body #tournamentDetailCard .tournament-detail-classic thead th",
        "html body #tournamentDetailCard .tournament-detail-classic tbody th",
        "html body #tournamentDetailCard .tournament-detail-classic tbody td",
        "html body #tournamentDetailCard .tournament-matches-classic thead th",
        "html body #tournamentDetailCard .tournament-matches-classic tbody tr.tournament-watching",
        "html body #v3TournamentFormatPanel .v3-standing.head",
        "html body #v3TournamentFormatPanel .v3-arena-btn",
    ):
        assert selector in css, selector
    assert "background:#303943!important;" in css
    assert "background:var(--tourney-title)!important;" in css
    assert "color:var(--tourney-text)!important;" in css
    assert "border:1px solid var(--tourney-border)!important;" in css

def test_mobile_embedded_and_game_actions_keep_integrity():
    app=read("tournaments-app.html")
    css=read("tournament-unified-contrast.css")
    for selector in (
        "html.tournament-embedded body main",
        "html.tournament-embedded body #tournamentDetailView.detail-shell",
        "html body #tournamentDetailCard .register-btn:disabled",
        "html body #tournamentDetailCard .tournament-enter-btn:disabled",
        "html body #tournamentDetailCard .bracket-player.winner",
        "html body #tournamentListView .tournament-tab.is-active",
    ):
        assert selector in css, selector
    assert "#tournamentListView" in app
    assert "#tournamentDetailView" not in app or 'id="tournamentDetailView"' in app
    assert "renderTournamentDetail(row)" in app
    assert "openTournamentDetail(tournamentId)" in app
    assert "play-v10.html?spectate=" in app
    # Tournament-specific theme must never recolor the user's chess board.
    for prohibited in (".board-square", ".chess-board", ".piece-image", "#homeBoardPreview"):
        assert prohibited not in css
