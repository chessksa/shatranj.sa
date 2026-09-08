export function fenPositionKey(fen) {
  return String(fen || '').trim().split(/\s+/).slice(0, 4).join(' ');
}

export function inferLastMoveFromFens(previousFen, currentFen, ChessCtor) {
  const before = fenPositionKey(previousFen);
  const after = fenPositionKey(currentFen);
  if (!before || !after || before === after || typeof ChessCtor !== 'function') return null;

  let source;
  try {
    source = new ChessCtor(previousFen);
  } catch (_error) {
    return null;
  }

  let moves = [];
  try {
    moves = source.moves({ verbose: true }) || [];
  } catch (_error) {
    return null;
  }

  const matches = [];
  for (const move of moves) {
    if (!move?.from || !move?.to) continue;
    try {
      const candidate = new ChessCtor(previousFen);
      const spec = { from: move.from, to: move.to };
      if (move.promotion) spec.promotion = move.promotion;
      const applied = candidate.move(spec);
      if (!applied) continue;
      if (fenPositionKey(candidate.fen()) === after) {
        matches.push({ from: move.from, to: move.to });
      }
    } catch (_error) {
      // Ignore invalid candidate moves and keep looking for the unique legal transition.
    }
  }

  const unique = [];
  const seen = new Set();
  for (const move of matches) {
    const key = `${move.from}-${move.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(move);
  }
  return unique.length === 1 ? unique[0] : null;
}

export function squareOverlayPosition(square, flipped = false) {
  const match = /^([a-h])([1-8])$/.exec(String(square || ''));
  if (!match) return null;
  let col = match[1].charCodeAt(0) - 97;
  let row = 8 - Number(match[2]);
  if (flipped) {
    col = 7 - col;
    row = 7 - row;
  }
  return { left: col * 12.5, top: row * 12.5 };
}
