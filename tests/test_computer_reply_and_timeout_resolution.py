from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
EDGE = (ROOT / 'supabase' / 'functions' / 'computer-game' / 'index.ts').read_text(encoding='utf-8')
PLAY = (ROOT / 'play-computer.js').read_text(encoding='utf-8')

helper_start = EDGE.index('async function completePendingComputerTurn')
helper_end = EDGE.index("if (action === 'start')", helper_start)
helper = EDGE[helper_start:helper_end]
clock_start = PLAY.index('function startClockLoop')
clock_end = PLAY.index('function ratingSuffix', clock_start)
clock = PLAY[clock_start:clock_end]
submit_start = PLAY.index('async function submitRatedMove')
submit_end = PLAY.index('function handleBoardInput', submit_start)
submit = PLAY[submit_start:submit_end]

assert 'computerRemainingMs' in helper, 'server must compute the live remaining computer time before engine search'
assert helper.index('computerRemainingMs') < helper.index('chooseComputerMove'), 'computer timeout must be checked before engine calculation starts'
assert "'win'" in helper[:helper.index('chooseComputerMove')], 'expired computer clock must settle a player win before searching'
assert 'SEARCH_BUDGET_MS' in EDGE and 'deadlineMs' in EDGE, 'server engine search must have a bounded deadline'
assert "clockActiveSide === 'computer'" in clock and 'requestRatedTimeout()' in clock, 'rated computer clock expiry must be sent to the server'
assert 'resumeRatedComputerReply' in PLAY, 'client must keep recovering a delayed computer reply in the background'
assert "setComputerStatus('إعادة الاتصال…')" not in submit, 'a delayed computer move must not strand the UI in reconnect state'
assert 'تعذر تأكيد رد الكمبيوتر' not in submit, 'delayed server work must not be reported as a failed computer move'
assert 'return ratedPayloadMatchesMove(payload, moveId) ? payload : null' not in PLAY, 'pending black-to-move state must never be mistaken for a completed computer reply'

print('computer reply recovery and rated timeout resolution: PASS')
