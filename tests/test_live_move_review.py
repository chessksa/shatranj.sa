from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_grace_end_becomes_bidirectional_move_review():
    js = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    assert "function showMoveReviewMode()" in js
    assert "الحركة السابقة" in js
    assert "data-review-direction=\"-1\"" in js
    assert "data-review-direction=\"1\"" in js
    assert "remaining <= 0" in js
    assert "showMoveReviewMode();" in js


def test_review_tracks_real_server_fen_history_without_mutating_live_game():
    js = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    assert "let reviewFens = []" in js
    assert "let reviewIndex = -1" in js
    assert "function rememberLiveFen(fen)" in js
    assert "sessionStorage.setItem(reviewStorageKey()" in js
    assert "function renderReviewedFen(index)" in js
    assert "board.setPosition(reviewFens[reviewIndex],false)" in js
    assert "game.load(reviewFens" not in js


def test_review_has_back_forward_boundaries_and_blocks_moves_while_reviewing_past():
    js = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    assert "function stepMoveReview(direction)" in js
    assert "reviewIndex <= 0" in js
    assert "reviewIndex >= reviewFens.length - 1" in js
    assert "function isReviewingPast()" in js
    assert js.count("if(isReviewingPast()) return false;") >= 2


def test_new_server_positions_are_recorded_before_live_board_render():
    js = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    load_pos = js.index("game = new Chess(row.fen);")
    remember_pos = js.index("rememberLiveFen(row.fen);", load_pos)
    render_pos = js.index("renderBoard();", load_pos)
    assert load_pos < remember_pos < render_pos


def test_live_script_cache_is_bumped_for_review_feature():
    html = (ROOT / "play-v10.html").read_text(encoding="utf-8")
    assert "play-v8.js?v=20260908-lastmove4" in html


def test_move_review_css_is_well_formed_at_opponent_slot_boundary():
    html = (ROOT / "play-v10.html").read_text(encoding="utf-8")
    assert 'white-space:nowrap}"' not in html
    assert '.move-review-label{display:none}\n\n    .opponent-slot' in html


if __name__ == "__main__":
    test_grace_end_becomes_bidirectional_move_review()
    test_review_tracks_real_server_fen_history_without_mutating_live_game()
    test_review_has_back_forward_boundaries_and_blocks_moves_while_reviewing_past()
    test_new_server_positions_are_recorded_before_live_board_render()
    test_live_script_cache_is_bumped_for_review_feature()
    test_move_review_css_is_well_formed_at_opponent_slot_boundary()
    print("live move review: PASS")
