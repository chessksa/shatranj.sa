from pathlib import Path

page = Path('tournaments.html').read_text(encoding='utf-8')

# The tournaments page stays inside the viewport; only table/detail interiors may scroll.
assert 'html,body{height:100dvh;min-height:100dvh;max-height:100dvh;overflow:hidden}' in page
assert 'main{flex:1 1 auto;min-height:0;overflow:hidden' in page
assert '.tournament-table-scroll{' in page and 'overflow-y:auto' in page
assert '.detail-shell{' in page and 'max-height:100%' in page
assert '.detail-card{' in page and 'overflow-y:auto' in page

# Current and finished tournaments are shown simultaneously in two independent tables.
assert 'class="tournament-tables-grid"' in page
assert 'id="currentTournamentList"' in page
assert 'id="finishedTournamentList"' in page
assert 'id="currentTournamentCount"' in page
assert 'id="finishedTournamentCount"' in page
assert 'البطولات الحالية' in page
assert 'البطولات المنتهية' in page
assert 'class="champion-col">البطل</th>' in page
assert 'grid-template-columns:repeat(2,minmax(0,1fr))' in page

# Finished tournaments get the champion from the winner of the final bracket match.
assert "supabase.rpc('get_tournament_bracket'" in page
assert 'async function loadTournamentChampion' in page
assert 'winner_name' in page
assert "row.status!=='finished'" in page
assert "row.status==='finished'" in page

print('tournament dual tables and champion contract is present')
