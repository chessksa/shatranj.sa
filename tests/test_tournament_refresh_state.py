from pathlib import Path

html = Path('tournaments.html').read_text(encoding='utf-8')

assert "const TOURNAMENT_QUERY_KEY='tournament'" in html
assert "searchParams.set(TOURNAMENT_QUERY_KEY" in html
assert "searchParams.delete(TOURNAMENT_QUERY_KEY)" in html
assert "history.replaceState" in html
assert "function restoreTournamentFromUrl()" in html
assert "restoreTournamentFromUrl();" in html
