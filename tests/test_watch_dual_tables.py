from pathlib import Path

watch = Path('watch.html').read_text(encoding='utf-8')

assert 'class="tables-grid"' in watch
assert 'id="currentTableBody"' in watch
assert 'id="finishedTableBody"' in watch
assert 'المباريات الحالية <strong id="currentCount">' in watch
assert 'المباريات المنتهية <strong id="finishedCount">' in watch
assert 'grid-template-columns:repeat(2,minmax(0,1fr))' in watch
assert '@media(max-width:760px)' in watch
assert '.tables-grid{grid-template-columns:1fr}' in watch
assert 'setActiveTab' not in watch
assert 'currentTab.addEventListener' not in watch

print('dual independent match tables contract is present')
