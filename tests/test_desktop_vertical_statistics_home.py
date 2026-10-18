"""Desktop home: full-height personal statistics at right, compact cards at left."""
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def read(p):return (ROOT/p).read_text(encoding="utf-8")

def test_desktop_layout_columns_and_vertical_stat_rows():
    css=read("v2/home/desktop-board-shell-tune.css")
    assert "grid-template-columns:minmax(175px,38%) minmax(0,1fr)!important" in css
    assert "grid-template-rows:repeat(9,minmax(0,1fr))!important" in css
    assert "grid-column:1!important;grid-row:1 / 3!important" in css
    assert ".desktop-home-statistics .desktop-statistics-group{display:contents!important}" in css
    order=["points","bullet","blitz","rapid","games","wins","puzzles","lessons","achievements"]
    for n,key in enumerate(order,1):
        assert f'.desktop-statistics-row[data-stat-row="{key}"]{{grid-row:{n}!important}}' in css
    assert "grid-column:2!important;grid-row:1!important" in css # platform counters
    assert "grid-column:2!important;grid-row:2!important" in css # champions
    assert "grid-template-rows:repeat(3,minmax(0,1fr))!important" in css
    assert ".desktop-champion-card" in css
    assert "grid-template-rows:clamp(70px,12dvh,86px) minmax(0,1fr)!important" in css

def test_points_card_is_authenticated_player_name_and_number_only():
    shell=read("v2/home/desktop-board-shell.mjs")
    stats=read("v2/home/personal-statistics.mjs")
    start=shell.index('data-stat-row="points"')
    end=shell.index('</div>',start)
    card=shell[start:end]
    assert 'data-stats-player-name' in card
    assert 'data-stat-value="points"' in card
    assert '<svg' not in card
    assert '<span>نقاط اللعب</span>' not in card
    assert "headerName?.dataset.playerId===lastUserId" in stats
    assert "new MutationObserver(syncPlayerName)" in stats
    assert "lastUserId=null;\n    syncPlayerName();" in stats
    assert "stats?.[key]" in stats # retains real numbers rather than hardcoded points
    assert "mountPersonalStatistics(supabase)" in shell

def test_updated_desktop_assets_and_unmodified_board():
    home=read("index.html")
    shell=read("v2/home/desktop-board-shell.mjs")
    assert 'content="20261019-desktop-right-stats-column-v1"' in home
    assert 'desktop-board-shell-tune.css?v=20261019-desktop-right-stats-column-v1' in home
    assert "personal-statistics.mjs?v=20261019-desktop-right-stats-column-v1" in shell
    assert 'id="homeBoardPreview"' in home
