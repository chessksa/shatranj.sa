from pathlib import Path

HTML = (Path(__file__).resolve().parents[1] / 'tournaments.html').read_text(encoding='utf-8')

assert 'اختر البطولة للتسجيل والمشاركة والمشاهدة' not in HTML, 'intro strip must be removed from tournaments page'
assert 'class="tournament-intro-strip"' not in HTML, 'intro strip markup must be removed'

finished_start = HTML.index('<section class="tournament-table-shell finished-tournaments"')
finished_end = HTML.index('</section>', finished_start)
finished_section = HTML[finished_start:finished_end]
assert '<th class="num">#</th><th class="name-col">اسم البطولة</th><th class="champion-col">البطل</th>' in finished_section, 'finished tournaments table must contain only number, tournament name, and champion'
assert 'الموعد' not in finished_section, 'finished tournaments table must not show date column'
assert 'الحالة' not in finished_section, 'finished tournaments table must not show status column'
assert 'colspan="3">جاري تحميل البطولات...' in finished_section, 'finished loading row must span the three visible columns'

assert 'finished?`<td class="champion-col"' in HTML, 'finished rows must still render champion'
assert 'data-tournament-id="${esc(row.id)}"' in HTML, 'tournament rows must remain selectable'
assert "openTournamentDetail(row.dataset.tournamentId)" in HTML, 'clicking a tournament row must open its details'
print('finished tournament compact table contract: PASS')
