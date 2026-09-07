from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
EDGE_PATH = ROOT / 'supabase' / 'functions' / 'computer-game' / 'index.ts'
PLAY_PATH = ROOT / 'play-computer.js'
HTML_PATH = ROOT / 'play-v10.html'
INDEX_PATH = ROOT / 'index.html'


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing anchor: {label}')
    return text.replace(old, new, 1)

edge = EDGE_PATH.read_text(encoding='utf-8')
play = PLAY_PATH.read_text(encoding='utf-8')
html = HTML_PATH.read_text(encoding='utf-8')
index = INDEX_PATH.read_text(encoding='utf-8')

edge = replace_once(
    edge,
    "const MIN_THINK_MS = { easy: 900, medium: 1200, hard: 1600 } as const;",
    "const MIN_THINK_MS = { easy: 900, medium: 1200, hard: 1600 } as const;\nconst SEARCH_BUDGET_MS = { easy: 250, medium: 500, hard: 900 } as const;",
    'search budget constant',
)

edge = replace_once(
    edge,
    "function minimax(chess: Chess, depth: number, alpha: number, beta: number): number {\n  if (depth <= 0 || chess.isGameOver()) return evaluate(chess);",
    "function minimax(chess: Chess, depth: number, alpha: number, beta: number, deadlineMs = Number.POSITIVE_INFINITY): number {\n  if (Date.now() >= deadlineMs || depth <= 0 || chess.isGameOver()) return evaluate(chess);",
    'minimax deadline',
)
edge = edge.replace(
    "minimax(chess, depth - 1, alpha, beta)",
    "minimax(chess, depth - 1, alpha, beta, deadlineMs)",
)

edge = replace_once(
    edge,
    "function chooseComputerMove(chess: Chess, level: Level) {\n  const moves = orderMoves(chess.moves({ verbose: true }) as SearchMove[]);",
    "function chooseComputerMove(chess: Chess, level: Level, deadlineMs = Date.now() + SEARCH_BUDGET_MS[level]) {\n  const moves = orderMoves(chess.moves({ verbose: true }) as SearchMove[]);",
    'chooser deadline signature',
)
edge = replace_once(
    edge,
    "  for (const move of moves) {\n    chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });\n    let score = minimax(chess, settings.depth, -Infinity, Infinity);",
    "  for (const move of moves) {\n    if (Date.now() >= deadlineMs && scored.length) break;\n    chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });\n    let score = minimax(chess, settings.depth, -Infinity, Infinity, deadlineMs);",
    'chooser bounded loop',
)
edge = replace_once(
    edge,
    "  scored.sort((a, b) => b.score - a.score);\n  const bestScore = scored[0].score;",
    "  if (!scored.length) return moves[0];\n  scored.sort((a, b) => b.score - a.score);\n  const bestScore = scored[0].score;",
    'chooser fallback',
)

edge = replace_once(
    edge,
    "      const selected = chooseComputerMove(chess, row.level);\n      const elapsedAfterSearch = Math.max(0, Date.now() - computerStartedAt);",
    "      const elapsedBeforeSearch = Math.max(0, Date.now() - computerStartedAt);\n      const computerRemainingMs = Math.max(0, computerTimeBefore - elapsedBeforeSearch);\n      if (computerRemainingMs <= 0) {\n        const expiredAt = new Date().toISOString();\n        return settlePendingComputerTurn(\n          row,\n          'win',\n          chess.fen(),\n          moves,\n          playerTimeMs,\n          0,\n          expiredAt,\n        );\n      }\n\n      const searchBudgetMs = Math.max(1, Math.min(SEARCH_BUDGET_MS[row.level], computerRemainingMs));\n      const selected = chooseComputerMove(chess, row.level, Date.now() + searchBudgetMs);\n      const elapsedAfterSearch = Math.max(0, Date.now() - computerStartedAt);",
    'computer timeout before search',
)

play = replace_once(
    play,
    "    } else if (clockActiveSide === 'computer' && currentClockMs('computer') <= 0 && !ratedMode) {\n      commitActiveClock();\n      clockActiveSide = null;\n      if (engine) engine.postMessage('stop');\n      finishGame('انتهى وقت الكمبيوتر — فزت');\n    }",
    "    } else if (clockActiveSide === 'computer' && currentClockMs('computer') <= 0) {\n      if (ratedMode) {\n        requestRatedTimeout();\n      } else {\n        commitActiveClock();\n        clockActiveSide = null;\n        if (engine) engine.postMessage('stop');\n        finishGame('انتهى وقت الكمبيوتر — فزت');\n      }\n    }",
    'rated computer timeout loop',
)

play = replace_once(
    play,
    "  } catch (error) {\n    console.error(error);\n    clockAnchorMs = Date.now();\n    toast('تعذر التحقق من انتهاء الوقت. سنحاول مجددًا.');\n  } finally {",
    "  } catch (error) {\n    console.error(error);\n    if (clockActiveSide === 'computer') setComputerStatus('يفكر…');\n  } finally {",
    'timeout retry keeps expired clock',
)

old_wait = """async function waitForRatedComputerReply(moveId, initialPayload = null, attempts = 8) {
  let payload = initialPayload;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (ratedPayloadMatchesMove(payload, moveId) && payload?.fen) {
      const turn = ratedPayloadTurn(payload);
      if (payload.status === 'finished' || turn === 'w') return payload;
    }
    await new Promise((resolve) => setTimeout(resolve, 220 + attempt * 120));
    payload = await fetchRatedState();
  }
  return ratedPayloadMatchesMove(payload, moveId) ? payload : null;
}

async function submitRatedMove(move, moveId) {
  if (!ratedGameId || finished) return;
  thinking = true;
  setComputerStatus('يفكر…');
  try {
    let payload = null;
    try {
      payload = await retryRatedMove(move, moveId);
    } catch (requestError) {
      console.warn('computer move acknowledgement delayed; reconciling by request id', requestError);
      payload = await waitForRatedMoveAck(moveId);
    }

    if (!ratedPayloadMatchesMove(payload, moveId)) {
      payload = await waitForRatedMoveAck(moveId);
    }
    if (!payload?.fen || !ratedPayloadMatchesMove(payload, moveId)) {
      throw new Error('Server did not acknowledge this player move');
    }

    const localComputerRemaining = currentClockMs('computer');
    game.load(payload.fen);
    renderBoard(true);
    syncRatedClocks(payload, localComputerRemaining);
    if (payload.status === 'finished') {
      finishRatedResult(payload, localComputerRemaining);
      return;
    }

    const finalPayload = await waitForRatedComputerReply(moveId, payload);
    if (!finalPayload?.fen || !ratedPayloadMatchesMove(finalPayload, moveId)) {
      setComputerStatus('إعادة الاتصال…');
      toast('تعذر تأكيد رد الكمبيوتر. حركتك بقيت في مكانها.', 3600);
      return;
    }

    game.load(finalPayload.fen);
    renderBoard(true);
    syncRatedClocks(finalPayload);
    if (finalPayload.status === 'finished') finishRatedResult(finalPayload);
    else setComputerStatus('جاهز');
  } catch (error) {
    console.error(error);
    const recovered = await waitForRatedMoveAck(moveId, 10);
    if (recovered?.fen && ratedPayloadMatchesMove(recovered, moveId)) {
      game.load(recovered.fen);
      renderBoard(true);
      syncRatedClocks(recovered);
      if (recovered.status === 'finished') finishRatedResult(recovered);
      else {
        const finalPayload = await waitForRatedComputerReply(moveId, recovered, 10);
        if (finalPayload?.fen && ratedPayloadMatchesMove(finalPayload, moveId)) {
          game.load(finalPayload.fen);
          renderBoard(true);
          syncRatedClocks(finalPayload);
          if (finalPayload.status === 'finished') finishRatedResult(finalPayload);
          else setComputerStatus('جاهز');
        } else {
          setComputerStatus('إعادة الاتصال…');
          toast('الاتصال بالخادم متعثر. حركتك بقيت في مكانها.', 4000);
        }
      }
    } else {
      clockActiveSide = 'computer';
      clockAnchorMs = Date.now();
      setComputerStatus('إعادة الاتصال…');
      toast('تعذر الاتصال بالخادم. حركتك لن تُعاد للخلف.', 4000);
    }
  } finally {
    thinking = false;
  }
}
"""
new_wait = """async function waitForRatedComputerReply(moveId, initialPayload = null, attempts = 12) {
  let payload = initialPayload;
  for (let attempt = 0; attempt < attempts && !finished; attempt += 1) {
    if (ratedPayloadMatchesMove(payload, moveId) && payload?.fen) {
      const turn = ratedPayloadTurn(payload);
      if (payload.status === 'finished' || turn === 'w') return payload;
    }
    if (clockActiveSide === 'computer' && currentClockMs('computer') <= 0) {
      await requestRatedTimeout();
      if (finished) return null;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    payload = await fetchRatedState();
  }
  if (ratedPayloadMatchesMove(payload, moveId) && payload?.fen) {
    const turn = ratedPayloadTurn(payload);
    if (payload.status === 'finished' || turn === 'w') return payload;
  }
  return null;
}

function applyRatedComputerReply(payload) {
  if (!payload?.fen) return false;
  game.load(payload.fen);
  renderBoard(true);
  syncRatedClocks(payload);
  if (payload.status === 'finished') finishRatedResult(payload);
  else setComputerStatus('جاهز');
  return true;
}

async function resumeRatedComputerReply(moveId) {
  if (!ratedGameId || finished) return;
  setComputerStatus('يفكر…');
  const finalPayload = await waitForRatedComputerReply(moveId, null, 12);
  if (finished) return;
  if (finalPayload?.fen && ratedPayloadMatchesMove(finalPayload, moveId)) {
    applyRatedComputerReply(finalPayload);
    return;
  }
  if (clockActiveSide === 'computer' && currentClockMs('computer') <= 0) {
    await requestRatedTimeout();
    if (finished) return;
  }
  setTimeout(() => resumeRatedComputerReply(moveId), 650);
}

async function submitRatedMove(move, moveId) {
  if (!ratedGameId || finished) return;
  thinking = true;
  setComputerStatus('يفكر…');
  try {
    let payload = null;
    try {
      payload = await retryRatedMove(move, moveId);
    } catch (requestError) {
      console.warn('computer move acknowledgement delayed; reconciling by request id', requestError);
      payload = await waitForRatedMoveAck(moveId);
    }

    if (!ratedPayloadMatchesMove(payload, moveId)) payload = await waitForRatedMoveAck(moveId);
    if (!payload?.fen || !ratedPayloadMatchesMove(payload, moveId)) {
      setTimeout(() => resumeRatedComputerReply(moveId), 450);
      return;
    }

    const localComputerRemaining = currentClockMs('computer');
    game.load(payload.fen);
    renderBoard(true);
    syncRatedClocks(payload, localComputerRemaining);
    if (payload.status === 'finished') {
      finishRatedResult(payload, localComputerRemaining);
      return;
    }

    const finalPayload = await waitForRatedComputerReply(moveId, payload);
    if (finished) return;
    if (finalPayload?.fen && ratedPayloadMatchesMove(finalPayload, moveId)) {
      applyRatedComputerReply(finalPayload);
      return;
    }
    setComputerStatus('يفكر…');
    setTimeout(() => resumeRatedComputerReply(moveId), 650);
  } catch (error) {
    console.error(error);
    setComputerStatus('يفكر…');
    setTimeout(() => resumeRatedComputerReply(moveId), 650);
  } finally {
    thinking = false;
  }
}
"""
play = replace_once(play, old_wait, new_wait, 'rated reply recovery block')

html, html_count = re.subn(r"play-computer\.js\?v=20260907-\d+", "play-computer.js?v=20260907-23", html, count=1)
if html_count != 1:
    raise SystemExit('missing play-computer cache version')

index, index_count = re.subn(r"play-v10\.html\?computer=1(?:&amp;|&)v=20260907-\d+", "play-v10.html?computer=1&v=20260907-23", index, count=1)
if index_count == 0:
    # Preserve operation if the homepage currently links without a page cache-buster.
    index, index_count = re.subn(r"play-v10\.html\?computer=1", "play-v10.html?computer=1&v=20260907-23", index, count=1)
if index_count != 1:
    raise SystemExit('missing homepage computer link')

EDGE_PATH.write_text(edge, encoding='utf-8')
PLAY_PATH.write_text(play, encoding='utf-8')
HTML_PATH.write_text(html, encoding='utf-8')
INDEX_PATH.write_text(index, encoding='utf-8')
print('computer reply timeout resolution patch applied')
