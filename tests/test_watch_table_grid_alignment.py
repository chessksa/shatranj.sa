from pathlib import Path

watch = Path('watch.html').read_text(encoding='utf-8')

assert '.match-table td+td{' in watch
assert 'border-inline-start:1px solid rgba(165,162,158,0.17)' in watch
assert '.match-table td{text-align:center' in watch
assert '.players-cell{text-align:center' in watch
assert '.player-pair{display:flex;align-items:center;justify-content:center' in watch
assert '.col-num{width:64px' in watch
assert 'col-watch' not in watch
assert 'match-row[aria-current="true"] td' in watch

print('watch compact two-column grid alignment: PASS')
