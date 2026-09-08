from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
code = (ROOT / 'play-computer.js').read_text(encoding='utf-8')
page = (ROOT / 'play-v10.html').read_text(encoding='utf-8')

helper_start = code.index('function isCurrentRatedReply') if 'function isCurrentRatedReply' in code else -1
helper_end = code.index('async function waitForRatedMoveAck') if 'async function waitForRatedMoveAck' in code else -1
helper = code[helper_start:helper_end] if helper_start >= 0 and helper_end > helper_start else ''

resume_start = code.index('async function resumeRatedComputerReply')
resume_end = code.index('async function submitRatedMove', resume_start)
resume = code[resume_start:resume_end]

submit_start = code.index('async function submitRatedMove')
submit_end = code.index('function handleBoardInput', submit_start)
submit = code[submit_start:submit_end]

assert 'let activeRatedMoveId = null;' in code, 'client must track which rated move is still awaiting a computer reply'
assert 'activeRatedMoveId === moveId' in helper, 'current-reply guard must bind the waiter to the active move id'
assert 'if (!isCurrentRatedReply(moveId)) return;' in resume, 'a stale reply loop must exit before it can set computer status to thinking'
assert resume.index('if (!isCurrentRatedReply(moveId)) return;') < resume.index("setComputerStatus('يفكر…')"), 'stale-loop guard must run before changing the visible status'
assert 'activeRatedMoveId = moveId;' in submit, 'submitting a new player move must supersede any older reply waiter'
assert 'retireRatedReply(moveId);' in resume, 'successful computer reply must retire the active waiter'
assert 'play-computer.js?v=20260909-pawnhighlight1' in page, 'computer script cache must be bumped so mobile Safari gets the fix'

print('computer stale reply status guard: PASS')
