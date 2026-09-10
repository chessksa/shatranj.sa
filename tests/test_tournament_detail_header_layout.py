from pathlib import Path

html = (Path(__file__).resolve().parents[1] / 'tournaments.html').read_text(encoding='utf-8')

assert 'id="tournamentHeaderActions"' in html
assert 'id="backToTournamentList" class="back header-list-back" type="button" hidden' in html
assert '<div class="detail-toolbar"><div id="tournamentDetailToolbarTitle" class="detail-toolbar-title"></div></div>' in html
assert "const pageHead=document.querySelector('.page-head');" in html
assert "const detailToolbarTitle=document.getElementById('tournamentDetailToolbarTitle');" in html
assert "pageHead.hidden=true;" in html
assert "backToTournamentList.hidden=false;" in html
assert "detailToolbarTitle.textContent=`بطولة ${row.name}`;" in html
assert "pageHead.hidden=false;" in html
assert "backToTournamentList.hidden=true;" in html
assert "detailToolbarTitle.textContent='';" in html
assert 'main>.wrap.detail-active{display:flex;flex-direction:column}' in html

print('tournament detail header layout contract: PASS')
