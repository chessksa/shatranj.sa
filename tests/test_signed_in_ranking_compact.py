from pathlib import Path

index = Path('index.html').read_text(encoding='utf-8')

assert 'body.home-signed-in #ranking table{height:auto!important}' in index, (
    'Signed-in desktop ranking table must keep its natural height instead of stretching rows to fill the viewport.'
)
assert 'body.home-signed-in #ranking .table-wrap{height:auto!important' in index, (
    'Signed-in ranking wrapper must not force a full-height table that clips the last row.'
)
assert '@media(min-width:901px) and (max-height:700px)' in index, (
    'Short desktop viewports need a scroll-safe fallback so all ten ranking rows remain reachable.'
)

print('signed-in ranking stays compact and does not clip the tenth row')
