from pathlib import Path

js_path = Path('play-computer.js')
html_path = Path('play-v10.html')

js = js_path.read_text(encoding='utf-8')
old = """    const move = game.move({ from: event.squareFrom, to: event.squareTo, promotion: 'q' });
    if (!move) return false;

    if (ratedMode) {
"""
new = """    const move = game.move({ from: event.squareFrom, to: event.squareTo, promotion: 'q' });
    if (!move) return false;

    const moveInputProcess = event.chessboard?.state?.moveInputProcess;
    Promise.resolve(moveInputProcess).then(() => renderBoard(true));

    if (ratedMode) {
"""
if old not in js:
    raise SystemExit('play-computer.js anchor not found')
js = js.replace(old, new, 1)
js_path.write_text(js, encoding='utf-8')

html = html_path.read_text(encoding='utf-8')
old_version = "play-computer.js?v=20260907-16"
new_version = "play-computer.js?v=20260907-17"
if old_version not in html:
    raise SystemExit('play-v10.html computer script version anchor not found')
html = html.replace(old_version, new_version, 1)
html_path.write_text(html, encoding='utf-8')

print('computer move snap-back fix applied')
