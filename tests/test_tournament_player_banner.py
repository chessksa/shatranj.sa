from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
page = (ROOT / 'play-v10.html').read_text(encoding='utf-8')
spectator = (ROOT / 'play.html').read_text(encoding='utf-8')
play = (ROOT / 'play-v8.js').read_text(encoding='utf-8')
spectator_play = (ROOT / 'play-live.js').read_text(encoding='utf-8')
demo = (ROOT / 'play-tournament-demo.js').read_text(encoding='utf-8')


def assert_badge_inside_top_card(html, top_marker):
    top_start = html.index(top_marker)
    top_end = html.index('</section>', top_start)
    badge = html.index('id="tournamentGameBadge"')
    clock = html.index('id="topClock"', top_start)
    assert top_start < clock < badge < top_end, 'tournament banner must sit inside the top player card after the clock'


assert_badge_inside_top_card(page, 'id="topPlayerCard"')
assert_badge_inside_top_card(spectator, 'id="topPlayerCard"')

for html in [page, spectator]:
    for marker in [
        'class="tournament-game-badge tournament-player-banner"',
        'class="tournament-game-cup"',
        'class="tournament-game-divider"',
        'class="tournament-game-title"',
        '.tournament-player-banner{',
        'left:8px;right:98px;bottom:7px',
        '#topPlayerCard.tournament-match-card',
    ]:
        assert marker in html, marker
    assert 'top:8px;left:50%;transform:translateX(-50%)' not in html

for script in [play, spectator_play]:
    assert "classList.add('tournament-match-card')" in script
    assert "classList.remove('tournament-match-card')" in script

assert "classList.add('tournament-match-card')" in demo

print('tournament player banner placement: PASS')
