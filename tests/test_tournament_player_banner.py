from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
page = (ROOT / 'play-v10.html').read_text(encoding='utf-8')
spectator = (ROOT / 'play.html').read_text(encoding='utf-8')


def assert_banner_below_header(html, top_marker):
    stack = html.index('<div class="panel-stack">')
    head_stack = html.index('class="side-head-stack"', stack)
    header = html.index('class="side-header"', head_stack)
    badge = html.index('id="tournamentGameBadge"', header)
    top_player = html.index(top_marker, badge)
    assert stack < head_stack < header < badge < top_player, 'tournament banner must sit directly below the header and before the top player card'


assert_banner_below_header(page, 'id="topPlayerCard"')
assert_banner_below_header(spectator, 'id="topPlayerCard"')

for html in [page, spectator]:
    for marker in [
        'class="side-head-stack"',
        'class="tournament-game-badge tournament-player-banner"',
        'class="tournament-game-cup"',
        'class="tournament-game-divider"',
        'class="tournament-game-title"',
        '.side-head-stack{',
        '.tournament-player-banner{',
        'justify-content:center',
        'text-align:center',
        'width:100%',
    ]:
        assert marker in html, marker
    assert '#topPlayerCard.tournament-match-card{position:relative;padding-bottom:' not in html
    assert 'left:8px;right:98px;bottom:7px' not in html

print('tournament header banner placement: PASS')
