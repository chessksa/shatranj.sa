from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f"missing patch target: {label}")
    return text.replace(old, new, 1)


def patch_file(path, transforms):
    file_path = ROOT / path
    text = file_path.read_text(encoding="utf-8")
    for old, new, label in transforms:
        text = replace_once(text, old, new, label)
    file_path.write_text(text, encoding="utf-8")


HELPER = r'''export function fenPositionKey(fen) {
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
'''

(ROOT / "last-move-highlight.mjs").write_text(HELPER, encoding="utf-8")

patch_file(
    "play-v8.js",
    [
        (
            "import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';\n",
            "import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';\nimport { inferLastMoveFromFens, squareOverlayPosition } from './last-move-highlight.mjs?v=20260908-1';\n",
            "live helper import",
        ),
        (
            "let graceStateLoaded = false;\n",
            "let graceStateLoaded = false;\nlet lastMove = null;\nlet ignoreNextLastMoveInference = false;\n",
            "live last-move state",
        ),
        (
            "  board.setPosition(reviewFens[reviewIndex],false);\n  forceBoardSquareColors();\n  updateMoveReviewControls();\n",
            "  board.setPosition(reviewFens[reviewIndex],false);\n  forceBoardSquareColors();\n  renderLastMoveHighlight();\n  updateMoveReviewControls();\n",
            "live review highlight",
        ),
        (
            "function clearMoveHints(){\n  if(moveHintsEl) moveHintsEl.replaceChildren();\n}\n",
            "function clearMoveHints(){\n  if(!moveHintsEl) return;\n  moveHintsEl.querySelectorAll('.move-hint').forEach((hint)=>hint.remove());\n}\n",
            "live hint clearing",
        ),
        (
            "function showMoveHints(fromSquare){\n",
            "function clearLastMoveHighlight(){\n  if(!moveHintsEl) return;\n  moveHintsEl.querySelectorAll('.last-move-highlight').forEach((marker)=>marker.remove());\n}\n\nfunction renderLastMoveHighlight(){\n  clearLastMoveHighlight();\n  if(!moveHintsEl || !lastMove?.from || !lastMove?.to || isReviewingPast()) return;\n  [lastMove.from,lastMove.to].forEach((square,index)=>{\n    const pos=squareOverlayPosition(square,flipped);\n    if(!pos) return;\n    const marker=document.createElement('span');\n    marker.className='last-move-highlight';\n    marker.dataset.square=square;\n    marker.dataset.moveEnd=index===0?'from':'to';\n    marker.style.left=`${pos.left}%`;\n    marker.style.top=`${pos.top}%`;\n    moveHintsEl.appendChild(marker);\n  });\n}\n\nfunction showMoveHints(fromSquare){\n",
            "live highlight renderer",
        ),
        (
            "  board.setPosition(game.fen(),false);\n  forceBoardSquareColors();\n  updateClockUI();\n",
            "  board.setPosition(game.fen(),false);\n  forceBoardSquareColors();\n  renderLastMoveHighlight();\n  updateClockUI();\n",
            "live board render highlight",
        ),
        (
            "    const move=game.move({from:event.squareFrom,to:event.squareTo,promotion:'q'});\n    if(!move) return false;\n    moveBusy=true;\n",
            "    const move=game.move({from:event.squareFrom,to:event.squareTo,promotion:'q'});\n    if(!move) return false;\n    lastMove = { from: move.from, to: move.to };\n    renderLastMoveHighlight();\n    moveBusy=true;\n",
            "live local move tracking",
        ),
        (
            "      }catch(err){\n        console.error(err);\n        toast('تعذر اعتماد الحركة. أُعيدت الرقعة إلى حالة الخادم.');\n      }finally{\n",
            "      }catch(err){\n        console.error(err);\n        ignoreNextLastMoveInference = true;\n        lastMove = null;\n        renderLastMoveHighlight();\n        toast('تعذر اعتماد الحركة. أُعيدت الرقعة إلى حالة الخادم.');\n      }finally{\n",
            "live failed move rollback",
        ),
        (
            "  if(changed){\n    try{\n      game = new Chess(row.fen);\n      rememberLiveFen(row.fen);\n    }catch(err){\n      console.error(err);\n      toast('تعذر تحميل وضع الرقعة.');\n      return;\n    }\n    selected=null;\n    legalTargets=[];\n    clearMoveHints();\n    lastServerUpdate=row.updated_at || '';\n    renderBoard();\n  }else{\n",
            "  if(changed){\n    restoreMoveReviewHistory();\n    let previousFen=game?.fen?.() || null;\n    if(!previousFen && reviewFens.length){\n      const latestStoredFen=reviewFens[reviewFens.length-1];\n      previousFen=latestStoredFen===row.fen && reviewFens.length>1\n        ? reviewFens[reviewFens.length-2]\n        : latestStoredFen;\n    }\n    const fenChanged=Boolean(previousFen && previousFen!==row.fen);\n    const inferredLastMove=fenChanged && !ignoreNextLastMoveInference\n      ? inferLastMoveFromFens(previousFen, row.fen, Chess)\n      : null;\n    try{\n      game = new Chess(row.fen);\n      rememberLiveFen(row.fen);\n    }catch(err){\n      console.error(err);\n      toast('تعذر تحميل وضع الرقعة.');\n      return;\n    }\n    if(ignoreNextLastMoveInference){\n      lastMove=null;\n      ignoreNextLastMoveInference=false;\n    }else if(fenChanged){\n      lastMove=inferredLastMove;\n    }\n    selected=null;\n    legalTargets=[];\n    clearMoveHints();\n    lastServerUpdate=row.updated_at || '';\n    renderBoard();\n  }else{\n",
            "live server move inference",
        ),
    ],
)

patch_file(
    "play-computer.js",
    [
        (
            "import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';\n",
            "import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';\nimport { inferLastMoveFromFens, squareOverlayPosition } from './last-move-highlight.mjs?v=20260908-1';\n",
            "computer helper import",
        ),
        (
            "let computerMoveReviewMode = false;\n",
            "let computerMoveReviewMode = false;\nlet lastMove = null;\n",
            "computer last-move state",
        ),
        (
            "  ensureBoard().setPosition(computerReviewFens[index], false);\n  forceBoardSquareColors();\n  updateComputerMoveReviewControls();\n",
            "  ensureBoard().setPosition(computerReviewFens[index], false);\n  forceBoardSquareColors();\n  renderLastMoveHighlight();\n  updateComputerMoveReviewControls();\n",
            "computer review highlight",
        ),
        (
            "function clearMoveHints() {\n  if (moveHintsEl) moveHintsEl.innerHTML = '';\n}\n",
            "function clearMoveHints() {\n  if (!moveHintsEl) return;\n  moveHintsEl.querySelectorAll('.move-hint').forEach((hint) => hint.remove());\n}\n",
            "computer hint clearing",
        ),
        (
            "function showMoveHints(square) {\n",
            "function clearLastMoveHighlight() {\n  if (!moveHintsEl) return;\n  moveHintsEl.querySelectorAll('.last-move-highlight').forEach((marker) => marker.remove());\n}\n\nfunction renderLastMoveHighlight() {\n  clearLastMoveHighlight();\n  if (!moveHintsEl || !lastMove?.from || !lastMove?.to || isComputerReviewingPast()) return;\n  [lastMove.from, lastMove.to].forEach((square, index) => {\n    const pos = squareOverlayPosition(square, false);\n    if (!pos) return;\n    const marker = document.createElement('span');\n    marker.className = 'last-move-highlight';\n    marker.dataset.square = square;\n    marker.dataset.moveEnd = index === 0 ? 'from' : 'to';\n    marker.style.left = `${pos.left}%`;\n    marker.style.top = `${pos.top}%`;\n    moveHintsEl.appendChild(marker);\n  });\n}\n\nfunction showMoveHints(square) {\n",
            "computer highlight renderer",
        ),
        (
            "  ensureBoard().setPosition(game.fen(), animated);\n  forceBoardSquareColors();\n}\n",
            "  ensureBoard().setPosition(game.fen(), animated);\n  forceBoardSquareColors();\n  renderLastMoveHighlight();\n}\n\nfunction loadComputerFen(fen) {\n  if (!fen) return false;\n  const previousFen = game.fen();\n  const fenChanged = Boolean(previousFen && previousFen !== fen);\n  const inferredLastMove = fenChanged\n    ? inferLastMoveFromFens(previousFen, fen, window.Chess)\n    : null;\n  const loaded = game.load(fen);\n  if (loaded === false) return false;\n  if (fenChanged) lastMove = inferredLastMove;\n  return true;\n}\n",
            "computer board render and fen loader",
        ),
        (
            "      game.load(payload.fen);\n      renderBoard(false);\n",
            "      loadComputerFen(payload.fen);\n      renderBoard(false);\n",
            "computer timeout fen sync",
        ),
        (
            "  game.load(payload.fen);\n  renderBoard(true);\n",
            "  loadComputerFen(payload.fen);\n  renderBoard(true);\n",
            "computer reply fen sync",
        ),
        (
            "    const move = game.move({\n      from: best.slice(0, 2),\n      to: best.slice(2, 4),\n      promotion: best[4] || 'q'\n    });\n    if (!move) throw new Error(`invalid engine move: ${best}`);\n    renderBoard(true);\n",
            "    const move = game.move({\n      from: best.slice(0, 2),\n      to: best.slice(2, 4),\n      promotion: best[4] || 'q'\n    });\n    if (!move) throw new Error(`invalid engine move: ${best}`);\n    lastMove = { from: move.from, to: move.to };\n    renderBoard(true);\n",
            "guest computer move tracking",
        ),
        (
            "    game.load(payload.fen);\n    renderBoard(true);\n    syncRatedClocks(payload, localComputerRemaining);\n",
            "    loadComputerFen(payload.fen);\n    renderBoard(true);\n    syncRatedClocks(payload, localComputerRemaining);\n",
            "rated player ack fen sync",
        ),
        (
            "    const move = game.move({ from: event.squareFrom, to: event.squareTo, promotion: 'q' });\n    if (!move) return false;\n\n    const moveInputProcess = event.chessboard?.state?.moveInputProcess;\n",
            "    const move = game.move({ from: event.squareFrom, to: event.squareTo, promotion: 'q' });\n    if (!move) return false;\n    lastMove = { from: move.from, to: move.to };\n    renderLastMoveHighlight();\n\n    const moveInputProcess = event.chessboard?.state?.moveInputProcess;\n",
            "computer player move tracking",
        ),
        (
            "    game.reset();\n    finished = false;\n",
            "    game.reset();\n    lastMove = null;\n    clearLastMoveHighlight();\n    finished = false;\n",
            "computer new game reset highlight",
        ),
        (
            "      game.load(started.fen);\n      setPlayingLayout(levelKey, selectedMinutes, { name: started.player_name, rating: started.rating });\n",
            "      loadComputerFen(started.fen);\n      setPlayingLayout(levelKey, selectedMinutes, { name: started.player_name, rating: started.rating });\n",
            "computer rated start fen sync",
        ),
    ],
)

patch_file(
    "play-v10.html",
    [
        (
            ".move-hint{position:absolute;width:12.5%;height:12.5%;display:grid;place-items:center;pointer-events:none}",
            ".move-hint{position:absolute;width:12.5%;height:12.5%;display:grid;place-items:center;pointer-events:none;z-index:1}",
            "move hint stacking",
        ),
        (
            ".move-hint.capture::after{width:68%;height:68%;background:transparent;border:4px solid rgba(117,45,36,.58);box-shadow:none}",
            ".move-hint.capture::after{width:68%;height:68%;background:transparent;border:4px solid rgba(117,45,36,.58);box-shadow:none}\n    .last-move-highlight{position:absolute;width:12.5%;height:12.5%;background:rgba(240,196,93,.18);box-shadow:inset 0 0 0 1px rgba(240,196,93,.22);pointer-events:none;z-index:0}",
            "last move highlight style",
        ),
        (
            "s.src='play-computer.js?v=20260907-26';",
            "s.src='play-computer.js?v=20260908-lastmove1';",
            "computer cache bust",
        ),
        (
            "s.src='play-v8.js?v=20260907-5';",
            "s.src='play-v8.js?v=20260908-lastmove1';",
            "live cache bust",
        ),
    ],
)

print("last-move highlight patch applied")
