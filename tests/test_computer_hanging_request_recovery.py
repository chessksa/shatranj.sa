from pathlib import Path

SRC = (Path(__file__).resolve().parents[1] / 'play-computer.js').read_text(encoding='utf-8')

assert 'COMPUTER_REQUEST_TIMEOUT_MS' in SRC, 'computer requests must have a finite timeout'
assert 'function withTimeout' in SRC, 'computer invoke must be guarded by a timeout helper'
assert 'startRatedRecoveryWatch(moveId)' in SRC, 'rated move must start an independent recovery watchdog before awaiting the move request'
assert 'reconcileRatedComputerReply' in SRC, 'recovery watchdog must poll authoritative state independently'
assert "if (!isCurrentRatedReply(moveId)) return;" in SRC, 'late/stale replies must be ignored after recovery wins the race'
assert 'stopRatedRecoveryWatch' in SRC, 'watchdog must be stopped when the move is resolved or the game ends'

print('computer hanging request recovery: PASS')
