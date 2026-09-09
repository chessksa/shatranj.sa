import assert from 'node:assert/strict';

const endpoint = 'https://example.supabase.co/functions/v1/computer-game';
const moveId = 'move-last-seconds-1';
const terminalPayload = {
  game_id: 'game-1',
  fen: '8/8/8/8/8/8/8/8 w - - 0 1',
  status: 'finished',
  result: 'loss',
  player_time_ms: 0,
  computer_time_ms: 120000,
  last_player_request_id: 'previous-move-id'
};

globalThis.fetch = async () => new Response(JSON.stringify(terminalPayload), {
  status: 200,
  headers: { 'content-type': 'application/json' }
});
delete globalThis.__shatranjComputerGameNetworkGuardV2;

await import(`../last-move-highlight.mjs?terminal-timeout=${Date.now()}`);
const response = await globalThis.fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'move', game_id: 'game-1', move_id: moveId })
});
const payload = await response.json();

assert.equal(payload.status, 'finished');
assert.equal(
  payload.last_player_request_id,
  moveId,
  'last-seconds terminal timeout must resolve the active move instead of leaving the UI on يفكر…'
);
console.log('computer terminal timeout correlation: PASS');
process.exit(0);
