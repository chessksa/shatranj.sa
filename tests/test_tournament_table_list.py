from pathlib import Path

HTML = (Path(__file__).resolve().parents[1] / 'tournaments.html').read_text(encoding='utf-8')

assert '<table class="tournament-table"' in HTML, 'tournament list must render as a table'
assert '<th class="num">#</th>' in HTML, 'tournament table must include a number column'
assert 'list.map((row,index)' in HTML and '${index+1}' in HTML, 'tournament rows must be numbered dynamically'
assert "a.status==='finished'?1:0" in HTML and "b.status==='finished'?1:0" in HTML, 'finished tournaments need an explicit sort rank'
assert 'if(aFinished!==bFinished)return aFinished-bFinished' in HTML, 'finished tournaments must sort below active tournaments'
assert '.sort(tournamentSort)' in HTML, 'the visible tournament list must use the tournament sort'
assert 'openTournamentDetail(row.dataset.tournamentId)' in HTML, 'clicking a tournament row must still open its details in the same page'
assert "supabase.rpc('register_for_tournament'" in HTML, 'registration behavior must remain wired to the existing RPC'
print('tournament table list: PASS')
