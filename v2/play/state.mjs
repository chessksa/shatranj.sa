export function sameVersion(a, b) {
  return Boolean(a && b && a.id === b.id && Number(a.ply) === Number(b.ply) && a.status === b.status);
}

export function normalizeGameState(row) {
  if (!row) return null;
  return {
    ...row,
    white_ms: Number(row.white_ms ?? 0),
    black_ms: Number(row.black_ms ?? 0),
    ply: Number(row.ply ?? 0),
    clock_anchor_ms: row.clock_anchor_at ? Date.parse(row.clock_anchor_at) : null,
    grace_until_ms: row.grace_until ? Date.parse(row.grace_until) : null,
  };
}
