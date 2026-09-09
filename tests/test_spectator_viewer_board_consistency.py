from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HUMAN = (ROOT / 'human-watch.html').read_text(encoding='utf-8')
COMPUTER = (ROOT / 'computer-watch.html').read_text(encoding='utf-8')
BOARD = (ROOT / 'spectator-board.mjs').read_text(encoding='utf-8') if (ROOT / 'spectator-board.mjs').exists() else ''

for name, html in [('human', HUMAN), ('computer', COMPUTER)]:
    assert '[hidden]{display:none!important}' in html, f'{name} viewer must not show hidden states'
    assert "from './spectator-board.mjs" in html, f'{name} viewer must use shared approved spectator board'
    assert 'pieceFiles=' not in html, f'{name} viewer must not render alternate PNG pieces'
    assert 'function renderBoard(fen)' not in html, f'{name} viewer must not use the legacy grid board renderer'

assert 'cm-chessboard@8/src/Chessboard.js' in BOARD
assert 'extensions/markers/Markers.js' in BOARD
assert "pieces/shatranj-approved-20260904.svg" in BOARD
assert "sprite: 'last-move-markers.svg'" in BOARD
assert "fill','#d6cfbf'" in BOARD and "fill','#246f77'" in BOARD
assert 'enableMoveInput' not in BOARD, 'spectator board must remain read-only'

print('spectator viewer board consistency: PASS')
