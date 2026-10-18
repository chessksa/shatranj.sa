from pathlib import Path

watch = Path('watch.html').read_text(encoding='utf-8')

# Compact lines preserve the independent scrolling and full-height panel.
assert '--match-row-h:21px;--match-head-h:34px' in watch
assert 'html[data-embed="panel"]{--match-row-h:20px;--match-head-h:31px}' in watch
assert 'height:var(--match-row-h);padding:1px 5px;line-height:18px' in watch
assert '.match-shell{height:100%;max-height:100%' in watch
assert '.table-head{height:var(--match-head-h);flex:0 0 var(--match-head-h)' in watch
assert '.table-wrap{width:100%;flex:1 1 auto;min-height:0;height:auto;overflow-y:auto;overflow-x:hidden' in watch
assert 'scrollbar-width:thin' in watch
assert '--match-row-h:25px;--match-head-h:40px' in watch
assert 'grid-template-rows:repeat(2,minmax(0,1fr))' in watch

print('watch compact fixed viewport tables: PASS')
