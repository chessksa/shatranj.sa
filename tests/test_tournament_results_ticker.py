from pathlib import Path

wrapper = Path('site-notifications.js').read_text(encoding='utf-8')

assert "tournamentResultsTicker" in wrapper, 'Home page must create a second tournament results ticker.'
assert "نتائج البطولات" in wrapper, 'Tournament ticker must show the approved Arabic title.'
assert "tournament-name-highlight" in wrapper, 'Tournament name must have a dedicated highlight class.'
assert "winner_player_id" in wrapper and "finished_at" in wrapper, 'Ticker must read actual finished tournament winners.'
assert "public_players" in wrapper, 'Ticker must resolve winner country and city from public player data.'
assert "slice(0, 10)" in wrapper or "slice(0,10)" in wrapper, 'Ticker must be capped at the latest ten tournament winners.'
assert "tournament-country-flag" in wrapper and "flagcdn.com" in wrapper, 'Ticker must render the winner country flag as an image.'
assert "player.html?id=" in wrapper, 'Winner name must link to the public player profile.'
assert "لفوزه ببطولة" in wrapper, 'Ticker message must use the approved congratulation wording.'

print('tournament results ticker contract is present')
