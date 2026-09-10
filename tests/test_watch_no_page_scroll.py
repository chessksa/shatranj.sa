from pathlib import Path

watch = Path('watch.html').read_text(encoding='utf-8')

assert 'html,body{height:100dvh;min-height:100dvh;max-height:100dvh;overflow:hidden}' in watch
assert 'body{margin:0;display:flex;flex-direction:column;' in watch
assert 'header{flex:0 0 58px;' in watch
assert 'main{flex:1 1 auto;min-height:0;overflow:hidden;' in watch
assert '.tables-grid{height:100%;min-height:0;' in watch
assert '.match-shell{height:min(calc(var(--match-head-h) + (var(--match-row-h) * 10) + 2px),100%);max-height:100%;' in watch
assert '.table-wrap{width:100%;flex:1 1 auto;min-height:0;height:auto;overflow-y:auto;' in watch

print('watch page has no outer scroll; tables own the scrolling')
