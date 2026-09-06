from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
code = (ROOT / 'play-computer.js').read_text(encoding='utf-8')

start = code.index('async function submitRatedMove')
end = code.index('function handleBoardInput', start)
block = code[start:end]

assert "toast('تم تحديث المباراة من الخادم.');" not in block, (
    'successful reconciliation with the authoritative server state must be silent'
)
assert "toast('تعذر اعتماد الحركة. أُعيدت الرقعة إلى آخر وضع معتمد.');" in block, (
    'actual failure to recover server state should still warn the player'
)

print('computer successful sync notice is silent: PASS')
