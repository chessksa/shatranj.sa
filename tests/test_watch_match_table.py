from pathlib import Path

watch = Path('watch.html').read_text(encoding='utf-8')
migration = Path('supabase/migrations/20260910_public_finished_games.sql').read_text(encoding='utf-8')

# Both tables have two columns: rank and players, with the whole row as watch action.
assert 'class="tables-grid"' in watch
assert 'id="currentCount"' in watch and 'id="finishedCount"' in watch
assert 'id="currentTableBody"' in watch and 'id="finishedTableBody"' in watch
assert watch.count('class="match-table"') == 2
assert '<thead>' not in watch
assert 'id="currentTab"' not in watch and 'id="finishedTab"' not in watch
assert 'setActiveTab' not in watch
assert 'class="col-num"' in watch and 'class="players-cell"' in watch
assert 'class="col-watch"' not in watch
assert 'watch-btn' not in watch
assert '<tr class="match-row" role="link" tabindex="0"' in watch
assert 'data-watch-href=' in watch
assert 'function openMatchFromRow(row)' in watch
assert "event.target.closest?.('.match-row[data-game-id]')" in watch
assert "if(event.target.closest?.('.player-profile-action'))return;" in watch
assert 'data-profile-game=' in watch
assert 'selectedGameKey' in watch

assert "supabase.rpc('list_public_current_games')" in watch
assert "supabase.rpc('list_public_finished_games')" in watch
assert "human-watch.html?v=" in watch
assert "computer-watch.html?v=" in watch
assert "renderRows(currentTableBody,currentGames,'لا توجد مباريات جارية الآن.')" in watch
assert "renderRows(finishedTableBody,finishedGames,'لا توجد مباريات منتهية.')" in watch

assert 'create or replace function public.list_public_finished_games()' in migration
assert migration.count("where g.status = 'finished'") == 2
assert "'human'::text" in migration
assert "'computer'::text" in migration
assert 'count(*) over() as total_count' in migration
assert 'grant execute on function public.list_public_finished_games() to anon, authenticated;' in migration

print('watch whole-row match table and public RPC: PASS')
