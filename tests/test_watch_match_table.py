from pathlib import Path

watch = Path('watch.html').read_text(encoding='utf-8')
migration = Path('supabase/migrations/20260910_public_finished_games.sql').read_text(encoding='utf-8')

# One connected table: two header tabs, then the match rows immediately beneath them.
assert 'id="currentTab"' in watch
assert 'id="finishedTab"' in watch
assert 'id="currentCount"' in watch
assert 'id="finishedCount"' in watch
assert 'id="matchTableBody"' in watch
assert 'class="match-tabs"' in watch
assert 'class="match-table"' in watch
assert '<thead>' not in watch
assert 'liveSection' not in watch
assert 'computerSection' not in watch

# Each row is: number, both players, then one watch action.
assert 'class="col-num"' in watch
assert 'class="players-cell"' in watch
assert 'class="col-watch"' in watch
assert '>مشاهدة</a>' in watch

# Current and finished lists stay on the same page and switch inside the same table body.
assert "supabase.rpc('list_public_current_games')" in watch
assert "supabase.rpc('list_public_finished_games')" in watch
assert "human-watch.html?game=" in watch
assert "computer-watch.html?game=" in watch
assert 'renderRows(activeTab === \'finished\' ? finishedGames : currentGames)' in watch

# Finished games are exposed through a narrow public read-only RPC with a total count.
assert 'create or replace function public.list_public_finished_games()' in migration
assert migration.count("where g.status = 'finished'") == 2
assert "'human'::text" in migration
assert "'computer'::text" in migration
assert 'count(*) over() as total_count' in migration
assert 'grant execute on function public.list_public_finished_games() to anon, authenticated;' in migration

print('watch match table contract is present')
