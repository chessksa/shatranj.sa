from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
css_path = ROOT / 'exact-board-v13.css'
page_path = ROOT / 'play-v10.html'

css = css_path.read_text(encoding='utf-8')
page = page_path.read_text(encoding='utf-8')

marker = '/* Tournament banner must not change the established mobile board width. */'
block = '''\n\n/* Tournament banner must not change the established mobile board width. */\n@media(max-width:900px){\n  body.live-game .board-panel>.board-frame,body.live-game .board-panel>.actions-card{\n    width:calc(100vw - 10px)!important;\n    max-width:100%!important;\n  }\n}\n'''

if marker not in css:
    css = css.rstrip() + block
else:
    start = css.index(marker)
    css = css[:start].rstrip() + block

page = page.replace(
    'exact-board-v13.css?v=20260909-tournamentboardsize1',
    'exact-board-v13.css?v=20260909-tournamentboardwidth2'
)

css_path.write_text(css, encoding='utf-8')
page_path.write_text(page, encoding='utf-8')
print('tournament board width fix applied')
