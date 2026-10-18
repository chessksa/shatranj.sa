"""Watch list contrast and completed-match outcomes without touching board geometry."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def get(name): return (ROOT/name).read_text(encoding="utf-8")

def test_watch_list_uses_white_names_and_distinct_small_headers():
    watch=get("watch.html")
    assert "--match-row-h:21px;--match-head-h:30px" in watch
    assert '--match-row-h:20px;--match-head-h:27px' in watch
    assert "--match-row-h:25px;--match-head-h:34px" in watch
    assert '.current-shell{border-block-end:2px solid #718091}' in watch
    assert '.finished-shell{border-block-start:2px solid #718091}' in watch
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
    for module in ["index.html","play-v2.html","watch.html","spectator-board.mjs","human-watch.html","computer-watch.html"]:
        assert "20261019-adaptive-live-gold-row-v1" in get(module)
