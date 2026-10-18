"""Watch list contrast and completed-match outcomes without touching board geometry."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def get(name): return (ROOT/name).read_text(encoding="utf-8")

def test_watch_list_uses_white_names_and_distinct_small_headers():
    watch=get("watch.html")
    assert "--match-row-h:21px;--match-head-h:30px" in watch
    assert '--match-row-h:20px;--match-head-h:27px' in watch
    assert "--match-row-h:25px;--match-head-h:34px" in watch
    assert 'html[data-embed="panel"] .tables-grid{' in watch
    assert 'grid-template-columns:repeat(2,minmax(0,1fr))' in watch
    assert 'grid-template-rows:minmax(0,1fr);gap:0;align-items:stretch' in watch
    assert 'border:1px solid #66717D!important' in watch
    assert 'background:#303943!important;color:#edf1f4!important' in watch
    assert 'background:#685c49!important' not in watch
    assert '.match-row:nth-child(even) td{background:#36414c}' in watch
    assert 'background:#4c5c69!important' in watch
    assert '.player-pair .player-profile-action{color:#f7f9fb!important}' in watch
    assert 'html body .tables-grid .match-table tr:nth-child(even) td' in watch
    assert 'html body .tables-grid .match-shell .table-head' in watch

def test_winner_loser_cards_follow_verified_end_results():
    desktop=get("v2/home/desktop-board-shell.mjs")
    css=get("v2/home/desktop-board-shell-tune.css")
    assert "detail.status==='انتهت المباراة'" in desktop
    assert "['1-0','win'].includes(result)" in desktop
    assert "['0-1','loss'].includes(result)" in desktop
    assert "['1/2-1/2','draw'].includes(result)" in desktop
    assert "card.classList.toggle('result-winner',winner)" in desktop
    assert "card.classList.toggle('result-loser',loser)" in desktop
    assert ".desktop-watch-player-card.result-winner" in css
    assert ".desktop-watch-player-card.result-loser" in css
    assert "color:#D8B665!important" in css

def test_play_and_standalone_watch_names_stay_gold():
    for module in ["v2/home/inline-play.mjs", "v2/play/app.js"]:
        source=get(module)
        assert "currentGame?.status==='finished'" in source
        assert "result-winner" in source
        assert "result-loser" in source
        assert "result-draw" in source
    for style in ["v2/home/inline-play.css", "v2/play/play.css", "spectator-play-layout.css"]:
        css=get(style)
        assert "result-winner" in css
        assert "result-loser" in css
        assert "#D8B665" in css

def test_watch_build_assets_have_new_version():
    home=get("index.html")
    assert 'content="20261019-desktop-right-stats-column-v1"' in home
    assert 'watch.html?v=20261019-equal-watch-columns-no-top-gap-v1#current' in home
    assert 'desktop-board-shell-tune.css?v=20261019-desktop-right-stats-column-v1' in home
    for module in ["play-v2.html","watch.html","spectator-board.mjs","human-watch.html","computer-watch.html"]:
        assert "20261019-adaptive-live-gold-row-v1" in get(module)


def test_equal_side_by_side_desktop_lists_without_gold_outline():
    watch=get("watch.html")
    css=get("v2/home/desktop-board-shell-tune.css")
    # Desktop embedded lists are truly adjacent, never stacked vertically.
    assert 'html[data-embed="panel"] .tables-grid{' in watch
    assert 'grid-template-columns:repeat(2,minmax(0,1fr))' in watch
    assert 'grid-template-rows:minmax(0,1fr);gap:0' in watch
    assert "tablesGrid.style.setProperty('--watch-current-share',currentShare+'%')" not in watch
    assert 'Math.max(40,Math.min(66,50+1.7*' not in watch
    assert '.finished-shell{border-inline-start:1px solid #66717D!important}' in watch
    assert 'border:1px solid #66717D!important' in watch
    assert 'background:#685c49!important' not in watch
    assert 'tr.match-row:first-child td' not in watch
    # The middle-column frame is the only external border.
    assert 'gap:6px!important;padding:0 0 6px!important' in css
    assert 'margin-inline:6px!important' in css
    assert 'border:0!important;border-radius:0;overflow:hidden' in css
    assert 'border:0!important' in watch
    # Separate internal scrollbars and intact player names.
    assert 'overflow-y:auto;overflow-x:hidden' in watch
    assert '.match-table .player-pair .player-profile-action{color:#f7f9fb!important}' in watch


def test_mobile_independent_rows_still_work():
    watch=get("watch.html")
    assert '@media(max-width:760px)' in watch
    assert '.tables-grid{grid-template-columns:1fr;grid-template-rows:repeat(2,minmax(0,1fr))' in watch
    assert 'min(var(--watch-current-needed,50%),72%)' in watch
    assert 'tables-grid.current-empty:not(.finished-empty){grid-template-rows:auto minmax(0,1fr)}' in watch
