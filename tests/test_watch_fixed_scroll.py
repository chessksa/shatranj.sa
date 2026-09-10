from pathlib import Path

watch = Path('watch.html').read_text(encoding='utf-8')

assert '--match-row-h:44px' in watch
assert '--match-head-h:50px' in watch
assert '.match-shell{height:calc(var(--match-head-h) + (var(--match-row-h) * 10) + 2px)' in watch
assert '.table-head{height:var(--match-head-h)' in watch
assert '.table-wrap{width:100%;height:calc(var(--match-row-h) * 10);overflow-y:auto;overflow-x:hidden' in watch
assert '.match-table td{text-align:center;height:var(--match-row-h)' in watch
assert 'scrollbar-width:thin' in watch
assert '@media(max-width:760px)' in watch
assert '--match-row-h:42px' in watch

print('watch fixed ten-row scroll contract is present')
