from pathlib import Path

EDGE = Path('supabase/functions/computer-game/index.ts').read_text(encoding='utf-8')

assert 'settlePlayerTimeoutIfCurrent' in EDGE, 'player timeout settlement needs an atomic stale-state guard helper'
helper_start = EDGE.index('async function settlePlayerTimeoutIfCurrent')
helper_end = EDGE.index('async function completePendingComputerTurn', helper_start)
helper = EDGE[helper_start:helper_end]
assert ".eq('fen', row.fen)" in helper, 'timeout loss must only commit if the authoritative FEN is unchanged'
assert '.select(gameSelect)' in helper and '.maybeSingle()' in helper, 'guarded timeout update must detect whether it actually committed'
assert 'currentGamePayload(current)' in helper, 'stale timeout must return the newer authoritative game instead of applying a loss'

state_start = EDGE.index("if (action === 'state')")
move_start = EDGE.index("if (action === 'move')", state_start)
timeout_start = EDGE.index("if (action === 'timeout')", move_start)
resign_start = EDGE.index("if (action === 'resign')", timeout_start)
state_block = EDGE[state_start:move_start]
move_block = EDGE[move_start:timeout_start]
timeout_block = EDGE[timeout_start:resign_start]

assert 'settlePlayerTimeoutIfCurrent' in state_block, 'state-triggered player timeout must use the guarded settlement'
assert 'settlePlayerTimeoutIfCurrent' in move_block, 'move-triggered player timeout must use the guarded settlement'
assert 'settlePlayerTimeoutIfCurrent' in timeout_block, 'explicit timeout must use the guarded settlement'

print('stale player timeout cannot overwrite a newer computer-turn position: PASS')
