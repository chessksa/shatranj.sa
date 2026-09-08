from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path, old, new):
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"{path}: expected source block not found")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "last-move-highlight.mjs",
    "export function inferLastMoveFromFens(previousFen, currentFen, ChessCtor) {",
    """export function latestMoveFromServerMoves(moves) {
  if (!Array.isArray(moves) || moves.length === 0) return null;
  const move = moves[moves.length - 1];
  const isSquare = (value) => /^[a-h][1-8]$/.test(String(value || ''));
  if (!isSquare(move?.from) || !isSquare(move?.to)) return null;
  return { from: move.from, to: move.to };
}

export function inferLastMoveFromFens(previousFen, currentFen, ChessCtor) {""",
)

replace_once(
    "play-v8.js",
    "import { inferLastMoveFromFens } from './last-move-highlight.mjs?v=20260908-2';",
    "import { inferLastMoveFromFens, latestMoveFromServerMoves } from './last-move-highlight.mjs?v=20260908-3';",
)

replace_once(
    "play-v8.js",
    """    const fenChanged=Boolean(previousFen && previousFen!==row.fen);
    const inferredLastMove=fenChanged && !ignoreNextLastMoveInference
      ? inferLastMoveFromFens(previousFen, row.fen, Chess)
      : null;""",
    """    const fenChanged=Boolean(previousFen && previousFen!==row.fen);
    const serverLastMove=fenChanged && !ignoreNextLastMoveInference
      ? latestMoveFromServerMoves(row.moves)
      : null;
    const inferredLastMove=fenChanged && !ignoreNextLastMoveInference && !serverLastMove
      ? inferLastMoveFromFens(previousFen, row.fen, Chess)
      : null;""",
)

replace_once(
    "play-v8.js",
    "      lastMove=inferredLastMove;",
    "      lastMove=serverLastMove || inferredLastMove;",
)

replace_once(
    "play-v10.html",
    "s.src='play-v8.js?v=20260908-lastmove3';",
    "s.src='play-v8.js?v=20260908-lastmove4';",
)

print("server move history last-move highlight applied")
