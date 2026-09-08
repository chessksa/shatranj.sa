from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def test_tournament_context_marks_root_for_scroll_safe_layout():
    live = read('play-v8.js')
    demo = read('play-tournament-demo.js')
    spectator = read('play-live.js')
    marker = "document.documentElement.classList.add('tournament-match')"
    body_marker = "document.body.classList.add('tournament-match')"
    assert marker in live and body_marker in live
    assert marker in demo and body_marker in demo
    assert marker in spectator and body_marker in spectator


def test_mobile_tournament_layout_does_not_clip_bottom_player():
    css = read('exact-board-v13.css')
    page = read('play-v10.html')
    legacy = read('play.html')

    assert 'html.tournament-match' in css
    assert 'body.live-game.tournament-match #gamePage' in css
    assert 'overflow:visible!important' in css
    assert 'body.live-game.tournament-match #gamePage .layout' in css
    assert 'height:auto!important' in css

    assert 'html.tournament-match' in page
    assert 'html.tournament-match' in legacy


def test_board_width_rule_is_not_changed_by_visibility_fix():
    css = read('exact-board-v13.css')
    assert 'width:calc(100vw - 10px)!important' in css


if __name__ == '__main__':
    test_tournament_context_marks_root_for_scroll_safe_layout()
    test_mobile_tournament_layout_does_not_clip_bottom_player()
    test_board_width_rule_is_not_changed_by_visibility_fix()
    print('tournament bottom player visibility: PASS')
