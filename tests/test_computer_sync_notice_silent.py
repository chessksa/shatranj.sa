from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
code = (ROOT / 'play-computer.js').read_text(encoding='utf-8')

start = code.index('async function submitRatedMove')
end = code.index('function handleBoardInput', start)
block = code[start:end]

assert "toast('تم تحديث المباراة من الخادم.');" not in block, (
    'successful reconciliation with the authoritative server state must be silent'
)
assert 'game.undo()' not in block, (
    'synchronization failure must never roll a locally legal move back'
)
assert 'حركتك لن تُعاد للخلف' in block or 'حركتك بقيت في مكانها' in block, (
    'connection failures should explain that the local move is preserved'
)

print('computer synchronization is silent on success and never rolls moves back: PASS')
