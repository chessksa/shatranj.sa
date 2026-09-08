from pathlib import Path

root = Path(__file__).resolve().parents[1]
css_path = root / 'exact-board-v13.css'
page_path = root / 'play-v10.html'

css = css_path.read_text(encoding='utf-8')
rule = """

/* Keep the live board at its established size when the tournament banner adds vertical UI. */
@media(max-width:900px){
  body.live-game .board-panel{flex:0 0 auto!important}
  body.live-game .board-panel>.board-frame{flex:0 0 auto!important}
}
"""
if 'body.live-game .board-panel{flex:0 0 auto!important}' not in css:
    css = css.rstrip() + rule
    css_path.write_text(css, encoding='utf-8')

page = page_path.read_text(encoding='utf-8')
page = page.replace('exact-board-v13.css?v=20260908-playcontrols1', 'exact-board-v13.css?v=20260909-tournamentboardsize1')
page_path.write_text(page, encoding='utf-8')

print('tournament board-size stability fix applied')
