from pathlib import Path

html = Path('tournaments.html').read_text(encoding='utf-8')
play_page = Path('play-v10.html').read_text(encoding='utf-8')
play_script = Path('play-v8.js').read_text(encoding='utf-8')

assert "match.match_status==='active'&&match.game_id" in html, 'active tournament matches must expose spectator availability'
assert 'play-v10.html?spectate=${encodeURIComponent(match.game_id)}' in html, 'spectator link must open the modern shared read-only board'
assert '>مشاهدة</a>' in html, 'tournament bracket must show a مشاهدة action for live matches'
assert "const spectatorGame = params.get('spectate');" in play_page, 'modern play page must recognize spectator routes'
assert "supabase.rpc('get_spectator_live_game_state'" in play_script, 'modern play script must use the read-only spectator RPC'

print('tournament spectator link: PASS')
