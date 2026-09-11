from pathlib import Path

path = Path('v2/play/api.js')
text = path.read_text(encoding='utf-8') if path.exists() else ''
for token in [
  'start_v2_matchmaking','poll_v2_matchmaking','cancel_v2_matchmaking',
  'get_v2_game_state','get_v2_game_moves','live-game-v2',
  'subscribeGame','v2_games','v2_game_moves',
  'startMatchmaking','submitMove','resignGame','offerDraw','respondDraw','graceEnd'
]:
    assert token in text, token
for forbidden in ['start_matchmaking(', 'submit_live_move', "from('live_games')", 'service_role']:
    assert forbidden not in text.lower(), forbidden
print('V2 play API: PASS')
