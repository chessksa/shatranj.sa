import assert from 'node:assert/strict';
import { createSpectatorClock } from '../spectator-clock.mjs';

const clock=createSpectatorClock();
clock.sync({
  status:'active',fen:'8/8/8/8/8/8/8/8 w - - 0 1',
  white_time_ms:60000,black_time_ms:60000,
  turn_started_at:'2026-09-10T12:00:00.000Z'
},Date.parse('2026-09-10T12:00:01.000Z'),1000);
assert.deepEqual(clock.read(1500),{white:58500,black:60000});

// A repeated/delayed snapshot for the same turn must never make time increase.
clock.sync({
  status:'active',fen:'8/8/8/8/8/8/8/8 w - - 0 1',
  white_time_ms:60000,black_time_ms:60000,
  turn_started_at:'2026-09-10T12:00:00.000Z'
},Date.parse('2026-09-10T12:00:01.200Z'),1600);
assert.equal(clock.read(1600).white,58400);
assert.equal(clock.read(2100).white,57900);

// A real turn change accepts the new server baselines and starts the next clock.
clock.sync({
  status:'active',fen:'8/8/8/8/8/8/8/8 b - - 0 1',
  white_time_ms:57500,black_time_ms:60000,
  turn_started_at:'2026-09-10T12:00:03.000Z'
},Date.parse('2026-09-10T12:00:03.200Z'),3000);
assert.deepEqual(clock.read(3500),{white:57500,black:59300});
