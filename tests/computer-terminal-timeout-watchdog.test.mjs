import assert from 'node:assert/strict';

const endpoint = 'https://example.supabase.co/functions/v1/computer-game';
const moveId = 'move-watchdog-last-seconds';
let calls = 0;

globalThis.fetch = async (_input, init = {}) => {
  calls += 1;
  const body = JSON.parse(String(init.body || '{}'));
  if (body.action === 'move') return new Promise(() => {});
  if (body.action === 'state') {
    return new Response(JSON.stringify({
      game_id: 'game-2',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      status: 'finished',
      result: 'loss',
      player_time_ms: 0,
      computer_time_ms: 90000,
      last_player_request_id: 'previous-move-id'
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  throw new Error('unexpected action');
};
delete globalThis.__shatranjComputerGameNetworkGuardV2;

await import(`../last-move-highlight.mjs?terminal-watchdog=${Date.now()}`);
const response = await globalThis.fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'move', game_id: 'game-2', move_id: moveId })
});
const payload = await response.json();

assert.equal(payload.status, 'finished');
assert.equal(payload.last_player_request_id, moveId);
assert.ok(calls >= 2, 'watchdog must reconcile terminal server state after a hanging move request');
console.log('computer terminal timeout watchdog: PASS');
process.exit(0);
