function finiteMs(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

export function remainingAt(state, nowMs = Date.now()) {
  let white = finiteMs(state?.white_ms);
  let black = finiteMs(state?.black_ms);
  const status = String(state?.status ?? '');
  const turn = state?.turn === 'b' ? 'b' : 'w';

  if (status !== 'active' && status !== 'matched') return { white, black };

  let anchor = finiteMs(state?.clock_anchor_ms, nowMs);
  if (status === 'matched') {
    const grace = finiteMs(state?.grace_until_ms, anchor);
    if (nowMs <= grace) return { white, black };
    anchor = grace;
  }

  const elapsed = Math.max(0, nowMs - anchor);
  if (turn === 'w') white = Math.max(0, white - elapsed);
  else black = Math.max(0, black - elapsed);
  return { white, black };
}

export function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(finiteMs(ms) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function isFinalMinute(ms) {
  const value = finiteMs(ms);
  return value < 60_000;
}
