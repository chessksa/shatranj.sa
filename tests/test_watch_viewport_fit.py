from pathlib import Path

css = Path('spectator-play-layout.css').read_text(encoding='utf-8')
board = Path('spectator-board.mjs').read_text(encoding='utf-8')
human = Path('human-watch.html').read_text(encoding='utf-8')
computer = Path('computer-watch.html').read_text(encoding='utf-8')

# Spectator page must stay inside one viewport; only the moves list may scroll.
assert '.spectator-play-layout-root' in css
assert 'height:100dvh' in css
assert 'overflow:hidden' in css
assert '.spectator-play-layout main.wrap{' in css
assert 'height:calc(100dvh - 62px)' in css
assert '.spectator-play-layout .layout{' in css and 'height:100%' in css
assert '.spectator-play-layout .side{' in css and 'min-height:0' in css
assert '.spectator-play-layout .moves{' in css
assert 'overflow-y:auto' in css
assert 'min-height:0' in css

# Mobile must fit the full square board into the viewport rather than enabling page scroll.
assert '@media(max-width:900px)' in css
assert 'calc(45dvh - 8px)' in css
assert 'overflow:auto' not in css.split('@media(max-width:900px)', 1)[1]

# Cache-busted layout/module versions must be referenced by both spectator pages.
assert "document.documentElement.classList.add('spectator-play-layout-root');" in board
assert "spectator-play-layout.css?v=20260910-viewfit1" in board
assert "spectator-board.mjs?v=20260910-viewfit1" in human
assert "spectator-board.mjs?v=20260910-viewfit1" in computer

print('spectator viewport fit contract is present')
