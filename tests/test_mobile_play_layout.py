from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "play-v10.html").read_text(encoding="utf-8")


def test_mobile_layout_places_opponent_above_centered_board_and_player_below():
    assert "@media(max-width:900px)" in HTML
    assert ".side-panel{display:contents}" in HTML
    assert ".panel-stack{display:contents}" in HTML
    assert ".side-header{order:0;" in HTML
    assert "#topPlayerCard{order:1;" in HTML
    assert ".board-panel{width:100%;height:auto;order:2;display:flex;justify-content:center;align-items:center}" in HTML
    assert ".panel-stack>.player-card:not(#topPlayerCard){order:3;" in HTML
    assert ".actions-card{order:4;" in HTML


def test_opponent_search_card_has_small_bottom_spacing_and_all_text_is_20px():
    assert "#topPlayerCard:has(#opponentSearchPanel:not([hidden])){align-self:center;min-height:0;padding-top:0;padding-bottom:6px}" in HTML
    assert ".opponent-search-error:empty{display:none}" in HTML
    assert "#opponentSearchPanel,#opponentSearchPanel *{font-size:20px}" in HTML

# This test locks the approved mobile visual order and search-card presentation.
