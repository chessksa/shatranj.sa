from pathlib import Path

path = Path('tournaments.html')
text = path.read_text(encoding='utf-8')

old = "const canEnter=Boolean(match.is_my_match&&match.player_one_id&&match.player_two_id&&['pending','active'].includes(match.match_status));const retry="
new = "const canEnter=Boolean(match.is_my_match&&match.player_one_id&&match.player_two_id&&['pending','active'].includes(match.match_status));const canWatch=Boolean(match.match_status==='active'&&match.game_id);const retry="
if old not in text:
    if new not in text:
        raise SystemExit('canEnter anchor not found')
else:
    text = text.replace(old, new, 1)

old_action = "${canEnter?`<button class=\"register-btn tournament-enter-btn\" type=\"button\" data-tournament-match=\"${esc(match.match_id)}\">دخول المباراة</button>`:''}</div>"
new_action = "${canEnter?`<button class=\"register-btn tournament-enter-btn\" type=\"button\" data-tournament-match=\"${esc(match.match_id)}\">دخول المباراة</button>`:''}${canWatch?`<a class=\"register-btn tournament-watch-btn\" href=\"play.html?spectate=${encodeURIComponent(match.game_id)}\">مشاهدة</a>`:''}</div>"
if old_action not in text:
    if new_action not in text:
        raise SystemExit('match action anchor not found')
else:
    text = text.replace(old_action, new_action, 1)

path.write_text(text, encoding='utf-8')
print('tournament spectator link applied')
