from pathlib import Path

client = Path('play-computer.js').read_text(encoding='utf-8')
edge = Path('supabase/functions/computer-game/index.ts').read_text(encoding='utf-8')

assert 'move_id:' in client, 'client must attach a stable move id to rated move requests'
assert 'retryRatedMove' in client, 'client must retry a failed rated move with the same move id before server-state reconciliation'
assert "body.move_id" in edge, 'server must read the move id'
assert "request_id" in edge, 'server must persist the move id with the player move'
assert 'existingMove' in edge, 'server must detect an already-processed move id'
assert "status: row.status" in edge or "status: 'active'" in edge, 'duplicate move must return current authoritative state instead of rejecting it'
print('computer move server synchronization retry: PASS')
