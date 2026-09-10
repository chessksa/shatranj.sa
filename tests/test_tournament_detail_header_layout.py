from pathlib import Path

root = Path(__file__).resolve().parents[1]
html = (root / 'tournaments.html').read_text(encoding='utf-8')
source = (root / 'site-presence.js').read_text(encoding='utf-8')

assert 'id="backToTournamentList"' in html
assert 'class="detail-toolbar"' in html
assert 'function syncTournamentDetailChrome()' in source
assert "const pageHead=document.querySelector('.page-head');" in source
assert "const mainWrap=document.querySelector('main>.wrap');" in source
assert "const nav=document.querySelector('header .nav');" in source
assert "navActions.id='tournamentHeaderActions';" in source
assert "backToTournamentList.classList.add('back','header-list-back');" in source
assert 'navActions.appendChild(backToTournamentList);' in source
assert "detailToolbarTitle.id='tournamentDetailToolbarTitle';" in source
assert "detailToolbarTitle.className='detail-toolbar-title';" in source
assert "detailToolbarTitle.textContent=pageTitle?.textContent||'';" in source
assert 'pageHead.hidden=active;' in source
assert 'backToTournamentList.hidden=!active;' in source
assert "mainWrap?.classList.toggle('tournament-detail-active',active);" in source
assert "detailViewObserver.observe(detailView,{attributes:true,attributeFilter:['hidden']});" in source
assert '.nav-actions{' in source
assert '.detail-toolbar-title{' in source
assert 'main>.wrap.tournament-detail-active{' in source

print('tournament detail header layout contract: PASS')
