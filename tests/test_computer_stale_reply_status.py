from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
code = (ROOT / 'play-computer.js').read_text(encoding='utf-8')
page = (ROOT / 'play-v10.html').read_text(encoding='utf-8')

resume_start = code.index('async function resumeRatedComputerReply')
resume_end = code.index('async function submitRatedMove', resume_start)
resume = code[resume_start:resume_end]

submit_start = code.index('async function submitRatedMove')
submit_end = code.index('function handleBoardInput', submit_start)
submit = code[submit_start:submit_end]

assert 'let activeRatedMoveId = null;' in code, 'client must track which rated move is still awaiting a computer reply'
assert 'moveId !== activeRatedMoveId' in resume, 'a stale reply loop must exit before it can set computer status to thinking'
assert resume.index('moveId !== activeRatedMoveId') < resume.index("setComputerStatus('يفكر…')"), 'stale-loop guard must run before changing the visible status'
assert 'activeRatedMoveId = moveId;' in submit, 'submitting a new player move must supersede any older reply waiter'
assert 'activeRatedMoveId = null;' in resume or 'clearActiveRatedReply(moveId)' in resume, 'successful computer reply must retire the active waiter'
assert 'play-computer.js?v=20260909-stalereply1' in page, 'computer script cache must be bumped so mobile Safari gets the fix'

print('computer stale reply status guard: PASS')
