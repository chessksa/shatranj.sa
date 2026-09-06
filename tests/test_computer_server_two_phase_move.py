from pathlib import Path
import re

# Verification for the deployed two-phase synchronization path:
# phase 1 acknowledges the persisted player move; phase 2 completes the computer reply via state polling.
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
assert 'await persistPlayerTurnBeforeComputer' in move_block, 'move action must persist the player move'
assert 'completePendingComputerTurn(persisted)' not in move_block, 'move action must acknowledge persistence without waiting for engine reply'
assert 'currentGamePayload(persisted)' in move_block, 'move action must return the persisted player position immediately'
assert 'chooseComputerMove' in EDGE[EDGE.index('async function completePendingComputerTurn'):EDGE.index("if (action === 'start')")], 'computer calculation belongs in the resumable helper'
assert "stateChess.turn() === 'b'" in state_block and 'completePendingComputerTurn' in state_block, 'state reconciliation must resume a pending computer turn'
assert 'last_player_request_id' in EDGE and 'ratedPayloadMatchesMove' in PLAY, 'state reconciliation must correlate to the exact player move id'
assert 'waitForRatedComputerReply' in PLAY, 'client must wait independently for the computer reply after player move acknowledgement'
assert 'game.undo()' not in PLAY[PLAY.index('async function submitRatedMove'):PLAY.index('function handleBoardInput')], 'transient synchronization must not roll the player move back'
assert re.search(r'play-v10\.html\?computer=1&v=20260907-(?:2\d|[3-9]\d)', INDEX), 'computer entry link must cache-bust the HTML page itself'
script_match = re.search(r"play-computer\.js\?v=20260907-(\d+)", HTML)
assert script_match and int(script_match.group(1)) >= 22, 'computer script cache version must include the move-acknowledgement fix'
assert "toast('تم تحديث المباراة من الخادم.');" not in PLAY, 'successful synchronization must remain silent'

print('computer server move acknowledgement and resumable reply: PASS')
