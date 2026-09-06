from pathlib import Path

html = Path('tournaments.html').read_text(encoding='utf-8')

assert "match.match_status==='active'&&match.game_id" in html, 'active tournament matches must expose spectator availability'
assert 'play.html?spectate=${encodeURIComponent(match.game_id)}' in html, 'spectator link must open the shared read-only board'
assert '>مشاهدة</a>' in html, 'tournament bracket must show a مشاهدة action for live matches'

print('tournament spectator link: PASS')
