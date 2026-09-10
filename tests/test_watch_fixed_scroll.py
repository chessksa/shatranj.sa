from pathlib import Path

watch = Path('watch.html').read_text(encoding='utf-8')

assert '--match-row-h:44px' in watch
assert '--match-head-h:50px' in watch
assert '.match-shell{height:min(calc(var(--match-head-h) + (var(--match-row-h) * 10) + 2px),100%);max-height:100%' in watch
assert '.table-head{height:var(--match-head-h);flex:0 0 var(--match-head-h)' in watch
assert '.table-wrap{width:100%;flex:1 1 auto;min-height:0;height:auto;overflow-y:auto;overflow-x:hidden' in watch
assert '.match-table td{text-align:center;height:var(--match-row-h)' in watch
assert 'scrollbar-width:thin' in watch
assert '@media(max-width:760px)' in watch
assert '--match-row-h:42px' in watch
assert 'grid-template-rows:repeat(2,minmax(0,1fr))' in watch

print('watch fixed ten-row scroll contract fits the viewport')
