from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HELPER = (ROOT / 'last-move-highlight.mjs').read_text(encoding='utf-8')
PLAY = (ROOT / 'play-computer.js').read_text(encoding='utf-8')
PAGE = (ROOT / 'play-v10.html').read_text(encoding='utf-8')

guard_start = HELPER.index('export function installComputerGameNetworkGuard')
guard_end = HELPER.index('installComputerGameNetworkGuard();', guard_start)
guard = HELPER[guard_start:guard_end]

assert 'Promise.any([primaryMove, watchdog])' in guard, (
    'a move request timeout/error must not beat a successful authoritative state recovery'
)
assert 'Promise.race([primary, watchdog])' not in guard, (
    'Promise.race lets the primary timeout reject before the recovery watchdog can finish'
)
assert 'if (!response?.ok)' in guard, (
    'an HTTP error from the primary move request must not be treated as the winning recovery result'
)
assert '20260910-computerrecovery1' in PLAY, 'computer module must bypass stale mobile caches'
assert '20260910-computerrecovery1' in PAGE, 'computer page must load the repaired module version'

print('computer move recovery does not fail fast: PASS')
