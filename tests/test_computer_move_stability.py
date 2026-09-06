from pathlib import Path

code = Path('play-computer.js').read_text(encoding='utf-8')

start = code.index("if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {")
end = code.index("if (event.type === INPUT_EVENT_TYPE.moveInputCanceled)", start)
block = code[start:end]

assert "moveInputProcess" in block, 'accepted computer-game moves must wait for cm-chessboard input completion before syncing the visual board'
assert "renderBoard(true)" in block, 'accepted player moves must be committed visually immediately instead of snapping back while the computer thinks'

print('computer move visual stability: PASS')
