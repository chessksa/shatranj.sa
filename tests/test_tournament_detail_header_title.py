from pathlib import Path

HTML = (Path(__file__).resolve().parents[1] / 'tournaments.html').read_text(encoding='utf-8')

assert 'id="tournamentPageHeadTitle"' in HTML, 'page header container needs a stable id for detail/list state switching'
assert 'id="tournamentPageTitle"' in HTML, 'page title needs a stable id for showing the selected tournament name'
assert '.page-head-title.detail-mode{grid-template-columns:1fr}' in HTML, 'detail mode must turn the top header into one centered cell'
assert '.page-head-title.detail-mode::after{display:none}' in HTML, 'detail mode must remove the middle divider'
assert '.page-head-title.detail-mode .count{display:none}' in HTML, 'detail mode must hide the tournament count'

start = HTML.index('function renderTournamentDetail(row)')
end = HTML.index('function firstRow(data)', start)
detail_fn = HTML[start:end]
assert '<span class="detail-label">اسم البطولة</span>' not in detail_fn, 'tournament name must not be duplicated inside the details table'

assert 'function setTournamentDetailHeader(row)' in HTML, 'opening a tournament must update the top header'
assert 'function resetTournamentHeader()' in HTML, 'returning to the list must restore the normal tournaments header'
assert 'pageTitle.textContent=`بطولة ${row.name}`' in HTML, 'detail header must read بطولة + tournament name'
assert 'setTournamentDetailHeader(row);' in HTML, 'openTournamentDetail must switch the header to the tournament name'
assert 'resetTournamentHeader();' in HTML, 'showTournamentList must restore the list header'

print('tournament detail header title contract: PASS')
