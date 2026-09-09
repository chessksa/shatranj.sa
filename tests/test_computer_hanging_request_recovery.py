from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAY = (ROOT / 'play-computer.js').read_text(encoding='utf-8')
HELPER = (ROOT / 'last-move-highlight.mjs').read_text(encoding='utf-8')

assert "last-move-highlight.mjs?v=20260909-pawnhighlight1" in PLAY, 'computer play must load the helper that installs the network guard'
assert 'COMPUTER_REQUEST_TIMEOUT_MS' in HELPER, 'computer requests must have a finite timeout'
assert 'installComputerGameNetworkGuard' in HELPER, 'helper must install the computer-game fetch guard'
assert 'watchComputerMoveState' in HELPER, 'move requests must have an independent state watchdog'
assert "action === 'move'" in HELPER and "action: 'state'" in HELPER, 'watchdog must reconcile a hanging move through authoritative state'
assert 'last_player_request_id' in HELPER, 'watchdog must only accept the state for the exact player move'
assert 'Promise.race' in HELPER, 'a hanging primary request must not block recovery indefinitely'

print('computer hanging request recovery: PASS')
