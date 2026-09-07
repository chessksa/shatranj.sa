from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "play-v10.html").read_text(encoding="utf-8")
LAYOUT_FIX = (ROOT / "exact-board-v13.js").read_text(encoding="utf-8")
CSS = (ROOT / "exact-board-v13.css").read_text(encoding="utf-8")


def test_mobile_layout_places_opponent_above_centered_board_and_player_below():
    assert "@media(max-width:900px)" in HTML
    assert ".side-panel{display:contents}" in HTML
    assert ".panel-stack{display:contents}" in HTML
    assert ".side-header{order:0;" in HTML
    assert "#topPlayerCard{order:1;" in HTML
    assert ".board-panel{width:100%;height:auto;order:2;display:flex;justify-content:center;align-items:center}" in HTML
    assert ".panel-stack>.player-card:not(#topPlayerCard){order:3;" in HTML
    assert ".actions-card{order:4;" in HTML


def test_mobile_runtime_moves_board_into_the_same_flex_flow_as_players():
    # display:contents is unreliable for cross-wrapper flex ordering on some mobile browsers.
    # The runtime fix makes the board a direct child of panel-stack on mobile, then restores
    # the original desktop DOM position above 900px.
    assert "stack.appendChild(boardPanel)" in LAYOUT_FIX
    assert "layout.insertBefore(boardPanel, side)" in LAYOUT_FIX
    assert "stack.style.display = 'flex'" in LAYOUT_FIX
    assert "side.style.height = 'auto'" in LAYOUT_FIX
    assert "window.matchMedia('(max-width: 900px)')" in LAYOUT_FIX


def test_opponent_search_card_has_small_bottom_spacing_and_all_text_is_20px():
    assert "#topPlayerCard:has(#opponentSearchPanel:not([hidden])){align-self:center;min-height:0;padding-top:0;padding-bottom:6px}" in HTML
    assert ".opponent-search-error:empty{display:none}" in HTML
    assert "#opponentSearchPanel,#opponentSearchPanel *{font-size:20px}" in HTML


def test_live_mobile_player_cards_keep_their_pregame_size():
    marker = "/* Mobile live-game player cards stay fixed at pregame size. */"
    assert marker in CSS
    block = CSS.split(marker, 1)[1]
    assert "body.live-game #topPlayerCard" in block
    assert "body.live-game .panel-stack>.player-card:not(#topPlayerCard)" in block
    assert "min-height:96px!important" in block
    assert "height:96px!important" in block
    assert "grid-template-columns:82px minmax(0,1fr) 92px!important" in block
    assert "body.live-game .player-card .avatar" in block and "width:78px!important" in block
    assert "body.live-game .player-card .name" in block and "font-size:20px!important" in block
    assert "body.live-game .player-card .clock" in block and "font-size:20px!important" in block
    assert "calc(100dvh - 300px)" in block


if __name__ == "__main__":
    test_mobile_layout_places_opponent_above_centered_board_and_player_below()
    test_mobile_runtime_moves_board_into_the_same_flex_flow_as_players()
    test_opponent_search_card_has_small_bottom_spacing_and_all_text_is_20px()
    test_live_mobile_player_cards_keep_their_pregame_size()
    print("mobile play layout: PASS")
