from pathlib import Path

# Fresh verification for the production move-acknowledgement synchronization path.
ROOT = Path(__file__).resolve().parents[1]
EDGE = (ROOT / 'supabase' / 'functions' / 'computer-game' / 'index.ts').read_text(encoding='utf-8')
PLAY = (ROOT / 'play-computer.js').read_text(encoding='utf-8')

move_start = EDGE.index("if (action === 'move')")
move_end = EDGE.index("if (action === 'timeout')", move_start)
move_block = EDGE[move_start:move_end]
submit_start = PLAY.index('async function submitRatedMove')
submit_end = PLAY.index('function handleBoardInput', submit_start)
submit_block = PLAY[submit_start:submit_end]

assert 'lastPlayerRequestId' in EDGE and 'last_player_request_id' in EDGE, (
    'server state must expose the latest player request id for stale-state detection'
)
assert 'completePendingComputerTurn(persisted)' not in move_block, (
    'move action must acknowledge the persisted player move before engine calculation'
)
assert 'currentGamePayload(persisted)' in move_block, (
    'move action must return the persisted player position immediately'
)
assert 'waitForRatedComputerReply' in PLAY, (
    'client must poll for the computer reply after the player move is acknowledged'
)
assert 'payload.last_player_request_id === moveId' in PLAY and 'ratedPayloadMatchesMove' in submit_block, (
    'client reconciliation must correlate server state to the exact player move id'
)
assert 'game.undo()' not in submit_block, (
    'transient synchronization failures must never roll a locally legal player move back'
)

print('computer move acknowledgement precedes engine and stale state cannot roll back move: PASS')
