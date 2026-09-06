from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'tournaments.html').read_text(encoding='utf-8')

assert 'id="tournamentListView"' in HTML, 'tournaments page needs a dedicated list view'
assert 'id="tournamentDetailView"' in HTML, 'tournaments page needs an in-page detail view'
assert 'id="backToTournamentList"' in HTML, 'detail view needs a back-to-list control'
assert 'function renderTournamentList' in HTML, 'tournaments must render as a compact list'
assert 'function renderTournamentDetail' in HTML, 'selected tournament must render full details'
assert 'function openTournamentDetail' in HTML, 'list selection must open details in the same page'
assert 'listView.hidden=true' in HTML and 'detailView.hidden=false' in HTML, 'opening a tournament must swap list for detail without navigation'
assert 'detailView.hidden=true' in HTML and 'listView.hidden=false' in HTML, 'back control must restore the tournament list'
assert 'class="tournament-list-item"' in HTML, 'each tournament must be a selectable list item'
assert 'اسم البطولة' in HTML and 'نظام الوقت' in HTML and 'المسجلون' in HTML and 'السعة' in HTML, 'detail view must expose the existing tournament fields'
assert "supabase.rpc('register_for_tournament'" in HTML, 'existing tournament registration backend must remain unchanged'
assert "supabase.rpc('get_tournament_registration_counts')" in HTML, 'existing registration count backend must remain unchanged'
assert '<table' not in HTML, 'landing view should be a list rather than the old full-details table'
print('tournament list/detail same-page flow: PASS')
