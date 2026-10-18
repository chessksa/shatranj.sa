"""Desktop home: full-height personal statistics at right, compact cards at left."""
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def read(p):return (ROOT/p).read_text(encoding="utf-8")

def test_desktop_layout_columns_and_vertical_stat_rows():
    css=read("v2/home/desktop-board-shell-tune.css")
    assert "grid-template-columns:minmax(175px,38%) minmax(0,1fr)!important" in css
    assert "grid-template-rows:minmax(0,1.65fr) repeat(8,minmax(0,1fr))!important" in css
    assert "grid-column:1!important;grid-row:1 / 3!important" in css
    assert ".desktop-home-statistics .desktop-statistics-group{display:contents!important}" in css
    order=["points","bullet","blitz","rapid","games","wins","puzzles","lessons","achievements"]
    for n,key in enumerate(order,1):
        assert f'.desktop-statistics-row[data-stat-row="{key}"]{{grid-row:{n}!important}}' in css
    assert "grid-column:2!important;grid-row:1!important" in css # platform counters
    assert "grid-column:2!important;grid-row:2!important" in css # champions
    assert "grid-template-rows:repeat(3,max-content)!important" in css
    assert "height:auto!important;min-height:62px!important" in css
    assert ".desktop-champion-card" in css
    assert "grid-template-rows:clamp(86px,16dvh,105px) minmax(0,1fr)!important" in css

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
    assert "lastUserId=null;\n    verifiedName='';\n    syncPlayerName();" in stats
    assert "supabase.rpc('get_my_player_profile')" in stats
    assert "verifiedName=name.slice(0,80)" in stats
    assert "stats?.[key]" in stats # retains real numbers rather than hardcoded points
    assert "mountPersonalStatistics(supabase)" in shell

def test_updated_desktop_assets_and_unmodified_board():
    home=read("index.html")
    shell=read("v2/home/desktop-board-shell.mjs")
    assert 'content="20261019-saved-desktop-computer-games-v1"' in home
    assert 'desktop-board-shell-tune.css?v=20261019-saved-desktop-computer-games-v1' in home
    assert "personal-statistics.mjs?v=20261019-centered-home-stats-v2" in shell
    assert 'id="homeBoardPreview"' in home

def test_stat_rows_are_centered_larger_and_delimited_without_tiles():
    css=read("v2/home/desktop-board-shell-tune.css")
    assert "justify-content:center!important" in css
    assert "border:0!important;" in css
    assert "background:rgba(141,156,169,.23);pointer-events:none;" in css
    assert '.desktop-statistics-row[data-stat-row="achievements"]::after' in css
    assert "width:24px!important;height:24px!important" in css
    assert "font-size:clamp(13px,1.05vw,17px)!important" in css
    assert "font-size:clamp(17px,1.32vw,22px)!important" in css
    assert "grid-template-rows:clamp(105px,15dvh,128px) minmax(0,1fr)!important" in css
    assert "justify-content:center!important" in css

def test_gold_champion_names_are_larger_and_override_site_theme():
    css=read("v2/home/desktop-board-shell-tune.css")
    assert "html body.desktop-board-workspace .desktop-dashboard-home" in css
    assert ".desktop-champions-grid .desktop-champion-card[data-champion] .desktop-champion-name" in css
    assert "color:#D8B665!important" in css
    assert "font-size:clamp(19px,1.52vw,26px)!important" in css

def test_player_name_above_points_with_short_faint_dividers():
    css=read("v2/home/desktop-board-shell-tune.css")
    assert "grid-template-rows:minmax(0,1.65fr) repeat(8,minmax(0,1fr))!important" in css
    assert "flex-direction:column!important;justify-content:center!important" in css
    assert 'data-stat-row="points"] [data-stats-player-name]' in css
    assert "font-size:clamp(17px,1.45vw,25px)!important" in css
    assert "color:#D8B665!important" in css
    assert 'data-stat-row="points"]>[data-stat-value]' in css
    assert "width:100%!important;border:0!important;padding:0!important" in css
    assert "left:15%;right:15%;height:1px" in css
    assert "background:rgba(141,156,169,.23)" in css
    assert "border-bottom:1px solid #66717D!important" not in css
    assert 'data-stat-row="achievements"]::after' in css
