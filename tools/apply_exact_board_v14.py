from pathlib import Path

PIECE_OLD = 'assets/pieces/${color}${type}.png?v=20260903-4'
PIECE_NEW = 'assets/exact-board/pieces/${color}${type}.png?v=20260903-14'


def replace_required(path, old, new):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'missing expected text in {path}: {old}')
    p.write_text(text.replace(old, new), encoding='utf-8')


for js_name in ('play-v10-match.js', 'play-v8.js'):
    replace_required(js_name, PIECE_OLD, PIECE_NEW)

html_path = Path('play-v10.html')
html = html_path.read_text(encoding='utf-8')

old_css = '<link rel="stylesheet" href="exact-board-v13.css?v=20260903-13" />'
new_css = '<link rel="stylesheet" href="exact-board-v14.css?v=20260903-14" />'
if old_css not in html:
    raise SystemExit('play-v10.html does not contain the expected v13 stylesheet link')
html = html.replace(old_css, new_css)

old_overlay_script = '  <script src="exact-board-v13.js?v=20260903-13"></script>\n'
if old_overlay_script not in html:
    raise SystemExit('play-v10.html does not contain the expected v13 overlay script')
html = html.replace(old_overlay_script, '')

# Force the browser to fetch the updated live and prematch modules.
html = html.replace("s.src='play-v8.js?v=20260903-10';", "s.src='play-v8.js?v=20260903-14';")
html = html.replace("s.src='play-v10-match.js?v=20260903-10';", "s.src='play-v10-match.js?v=20260903-14';")

html_path.write_text(html, encoding='utf-8')
