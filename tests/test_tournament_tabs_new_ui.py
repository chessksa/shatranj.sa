from pathlib import Path
root=Path(__file__).resolve().parents[1]
page=(root/'tournaments-app.html').read_text(encoding='utf-8')
boot=(root/'tournaments.html').read_text(encoding='utf-8')
css=(root/'tournament-tabs-v1.css').read_text(encoding='utf-8')
admin=(root/'admin.js').read_text(encoding='utf-8')
assert page.count('class="tournament-tab')==3
for name in ('current','upcoming','finished'):
    assert f'data-tournament-tab="{name}"' in page
assert 'id="tournamentCards"' in page
assert '<table class="tournament-table"' not in page
assert 'id="currentTournamentList"' not in page
assert 'id="finishedTournamentList"' not in page
assert 'function renderTournamentCards(rows)' in page
assert 'function selectTournamentTab(tab,focus=false)' in page
assert 'function renderTournamentDetail(row)' in page
assert 'function openTournamentDetail(tournamentId)' in page
assert 'data-tournament-id' in page
assert 'get_tournament_registration_counts' in page
assert 'register_for_tournament' in page
assert 'get_tournament_bracket' in page
assert 'get_my_tournament_match_access' in page
assert 'play-v10.html?spectate=' in page
assert 'get_tournament_registration_counts' in page
assert 'admin_get_access' in page
assert 'adminCreateLink.hidden=false' in page
assert "openTournamentModal();" in admin
assert "location.hash==='#create-tournament'" in admin
assert 'tournament-tabs-v1.css?v=20261009-tournament-tabs-v1' in page
assert "20261009-tournament-tabs-v1" in boot
assert '.tournament-list-item{' in css
assert '.tournament-tabs{' in css
assert 'html.tournament-embedded .tournament-list-view' in css
assert 'role="tablist"' in page and 'role="tabpanel"' in page
assert 'backToTournamentListInline' in page
print('tournament tabs, same-page detail, participation and admin permissions: PASS')
