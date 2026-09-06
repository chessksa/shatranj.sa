from pathlib import Path

EDGE = Path('supabase/functions/computer-game/index.ts').read_text(encoding='utf-8')
start = EDGE.index("if (action === 'timeout')")
end = EDGE.index("if (action === 'resign')", start)
block = EDGE[start:end]

assert "const timeoutChess = new Chess(row.fen);" in block, 'timeout must inspect the authoritative side to move'
assert "timeoutChess.turn() === 'b'" in block, 'timeout must detect that the player already moved'
assert block.index("timeoutChess.turn() === 'b'") < block.index('const playerTimeMs'), 'turn guard must run before deducting player time'
assert 'completePendingComputerTurn(row)' in block, 'a late timeout during the computer turn must resume/return the computer turn, not settle a player loss'

print('computer timeout ignores stale player-time requests after the move is accepted: PASS')
