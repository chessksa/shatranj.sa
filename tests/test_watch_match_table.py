from pathlib import Path

watch = Path('watch.html').read_text(encoding='utf-8')
migration = Path('supabase/migrations/20260910_public_finished_games.sql').read_text(encoding='utf-8')

# One connected table: two header tabs, then numbered rows with players and watch action.
assert 'id="currentTab"' in watch
assert 'id="finishedTab"' in watch
assert 'id="currentCount"' in watch
assert 'id="finishedCount"' in watch
assert 'id="matchTableBody"' in watch
assert '<th class="col-num">#</th>' in watch
assert '<th>اللاعبان</th>' in watch
assert '<th class="col-watch">مشاهدة</th>' in watch
assert 'liveSection' not in watch
assert 'computerSection' not in watch

# Current and finished lists stay on the same page and switch inside the same tbody.
assert "supabase.rpc('list_public_current_games')" in watch
assert "supabase.rpc('list_public_finished_games')" in watch
assert "human-watch.html?game=" in watch
assert "computer-watch.html?game=" in watch
assert 'renderRows(activeTab === \'finished\' ? finishedGames : currentGames)' in watch

# Finished games are exposed through a narrow public read-only RPC with a total count.
assert 'create or replace function public.list_public_finished_games()' in migration
assert "where g.status = 'finished'" in migration
assert "where g.status = 'finished'" in migration
assert "'human'::text" in migration
assert "'computer'::text" in migration
assert 'count(*) over() as total_count' in migration
assert 'grant execute on function public.list_public_finished_games() to anon, authenticated;' in migration

print('watch match table contract is present')
