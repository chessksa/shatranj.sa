from pathlib import Path
import re

# Verification refresh for the deployed two-phase synchronization path.
ROOT = Path(__file__).resolve().parents[1]
EDGE = (ROOT / 'supabase' / 'functions' / 'computer-game' / 'index.ts').read_text(encoding='utf-8')
PLAY = (ROOT / 'play-computer.js').read_text(encoding='utf-8')
HTML = (ROOT / 'play-v10.html').read_text(encoding='utf-8')
INDEX = (ROOT / 'index.html').read_text(encoding='utf-8')

move_start = EDGE.index("if (action === 'move')")
move_end = EDGE.index("if (action === 'timeout')", move_start)
move_block = EDGE[move_start:move_end]
state_start = EDGE.index("if (action === 'state')")
state_end = EDGE.index("if (action === 'move')", state_start)
state_block = EDGE[state_start:state_end]

assert 'persistPlayerTurnBeforeComputer' in EDGE, 'player move must be persisted before computer thinking begins'
assert 'completePendingComputerTurn' in EDGE, 'server needs a resumable pending-computer-turn helper'
assert move_block.index('await persistPlayerTurnBeforeComputer') < move_block.index('completePendingComputerTurn(persisted)'), 'persist player move before resuming computer work'
assert 'chooseComputerMove' in EDGE[EDGE.index('async function completePendingComputerTurn'):EDGE.index("if (action === 'start')")], 'computer calculation belongs in the resumable helper'
assert "stateChess.turn() === 'b'" in state_block and 'completePendingComputerTurn' in state_block, 'state reconciliation must resume a pending computer turn instead of returning the pre-move position'
assert 'existingMove' in move_block and 'completePendingComputerTurn' in move_block, 'retry of the same request id must resume pending computer work'
assert "const activeSide = stateChess.turn() === 'b' ? 'computer' : 'player';" in state_block, 'state clocks must follow the side to move'
assert re.search(r'play-v10\.html\?computer=1&v=20260907-(?:19|2\d)', INDEX), 'computer entry link must cache-bust the HTML page itself'
script_match = re.search(r"play-computer\.js\?v=20260907-(\d+)", HTML)
assert script_match and int(script_match.group(1)) >= 19, 'computer script cache version must include the synchronization fix'
assert "toast('تمت مزامنة المباراة مع الخادم.');" not in PLAY, 'generic reconciliation must no longer silently roll a legal local move back'

print('computer server two-phase move persistence and recovery: PASS')
