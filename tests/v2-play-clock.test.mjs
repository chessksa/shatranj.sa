import test from 'node:test';
import assert from 'node:assert/strict';
import { remainingAt, formatClock, isFinalMinute } from '../v2/play/clock.mjs';

test('active side decreases while waiting side is stable', () => {
  const state = { status:'active', turn:'w', white_ms:600000, black_ms:600000, clock_anchor_ms:1000000 };
  assert.equal(remainingAt(state, 1002500).white, 597500);
  assert.equal(remainingAt(state, 1002500).black, 600000);
});

test('clock never renders below zero', () => {
  const state = { status:'active', turn:'w', white_ms:1000, black_ms:1000, clock_anchor_ms:0 };
  assert.equal(remainingAt(state, 5000).white, 0);
});

test('matched clock waits for grace deadline then runs', () => {
  const state = { status:'matched', turn:'w', white_ms:600000, black_ms:600000, grace_until_ms:1005000, clock_anchor_ms:1005000 };
  assert.equal(remainingAt(state, 1004000).white, 600000);
  assert.equal(remainingAt(state, 1007000).white, 598000);
});

test('final minute begins below sixty seconds', () => {
  assert.equal(isFinalMinute(59999), true);
  assert.equal(isFinalMinute(60000), false);
});

test('formats mm:ss', () => assert.equal(formatClock(305000), '05:05'));
