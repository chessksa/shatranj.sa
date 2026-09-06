from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
admin = (ROOT / 'admin.js').read_text(encoding='utf-8')
public_page = (ROOT / 'tournaments.html').read_text(encoding='utf-8')
registration_sql = (ROOT / 'supabase/migrations/20260906183000_tournament_registration_rpc.sql').read_text(encoding='utf-8')

# Verify the production UI and server-side capacity contract together.
assert 'id="tournamentCapacityMode"' in admin
assert '<option value="fixed">محدد</option>' in admin
assert '<option value="open">مفتوح</option>' in admin
assert 'id="tournamentMaxGroup"' in admin
assert 'function syncTournamentCapacityMode()' in admin
assert "$('tournamentCapacityMode')?.addEventListener('change',syncTournamentCapacityMode)" in admin
assert "const capacityMode=$('tournamentCapacityMode').value" in admin
assert "p_max_players:capacityMode==='open'?null:maxPlayers" in admin
assert 'حدد عدد المشاركين للبطولة.' in admin

assert 'function tournamentIsFull(row)' in public_page
assert "if(tournamentIsFull(row))return '<button class=\"register-btn\" type=\"button\" disabled>اكتمل العدد</button>'" in public_page
assert "row.max_players?esc(row.max_players)+' لاعب':'مفتوحة'" in public_page
assert "if v_tournament.max_players is not null then" in registration_sql
assert "if v_registered_count >= v_tournament.max_players then" in registration_sql

print('tournament capacity mode: PASS')
