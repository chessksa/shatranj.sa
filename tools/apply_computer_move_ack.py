from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

edge_path = ROOT / 'supabase' / 'functions' / 'computer-game' / 'index.ts'
edge = edge_path.read_text(encoding='utf-8')

if 'function lastPlayerRequestId(' not in edge:
    marker = '\nfunction clockPayload(\n'
    helper = '''
function lastPlayerRequestId(row: Record<string, unknown>) {
  const moves = Array.isArray(row.moves) ? row.moves : [];
  for (let index = moves.length - 1; index >= 0; index -= 1) {
    const entry = moves[index];
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    if (record.side === 'player' && typeof record.request_id === 'string' && record.request_id) {
      return record.request_id;
    }
  }
  return null;
}

function clockPayload(
'''
    if marker not in edge:
        raise SystemExit('clockPayload marker not found')
    edge = edge.replace(marker, '\n' + helper, 1)

clock_old = '''    turn_started_at: turnStartedAt,
    server_now: new Date().toISOString(),
'''
clock_new = '''    turn_started_at: turnStartedAt,
    server_now: new Date().toISOString(),
    last_player_request_id: lastPlayerRequestId(row),
'''
if 'last_player_request_id: lastPlayerRequestId(row)' not in edge:
    if clock_old not in edge:
        raise SystemExit('clock payload return marker not found')
    edge = edge.replace(clock_old, clock_new, 1)

tail_old = '''      const persistedChess = new Chess(persisted.fen);
      if (persisted.status === 'active' && persistedChess.turn() === 'b') {
        return reply(await completePendingComputerTurn(persisted));
      }
      return reply(await currentGamePayload(persisted));
'''
tail_new = '''      return reply(await currentGamePayload(persisted));
'''
if tail_old in edge:
    edge = edge.replace(tail_old, tail_new, 1)
elif 'completePendingComputerTurn(persisted)' in edge:
    raise SystemExit('unexpected move action tail')

edge_path.write_text(edge, encoding='utf-8')

play_path = ROOT / 'play-computer.js'
play = play_path.read_text(encoding='utf-8')

sync_start = play.index('function syncRatedClocks(payload, computerCapMs = null) {')
sync_end = play.index('\nasync function requestRatedTimeout()', sync_start)
sync_new = '''function syncRatedClocks(payload, computerCapMs = null) {
  if (!payload) return;
  playerTimeMs = Math.max(0, Number(payload.player_time_ms) || 0);
  const serverComputerTimeMs = Math.max(0, Number(payload.computer_time_ms) || 0);
  computerTimeMs = computerCapMs !== null && Number.isFinite(Number(computerCapMs))
    ? Math.max(0, Math.min(serverComputerTimeMs, computerCapMs))
    : serverComputerTimeMs;
  if (payload.status === 'active') {
    let activeSide = 'player';
    try {
      if (payload.fen) activeSide = new window.Chess(payload.fen).turn() === 'b' ? 'computer' : 'player';
    } catch (error) {
      console.warn('تعذر تحديد صاحب الدور من وضع الخادم', error);
    }
    const serverNow = Date.parse(String(payload.server_now || ''));
    const turnStarted = Date.parse(String(payload.turn_started_at || ''));
    if (Number.isFinite(serverNow) && Number.isFinite(turnStarted)) {
      const elapsed = Math.max(0, serverNow - turnStarted);
      if (activeSide === 'computer') computerTimeMs = Math.max(0, computerTimeMs - elapsed);
      else playerTimeMs = Math.max(0, playerTimeMs - elapsed);
    }
    clockActiveSide = activeSide;
    clockAnchorMs = Date.now();
  } else {
    clockActiveSide = null;
    clockAnchorMs = 0;
  }
  renderClocks();
}
'''
play = play[:sync_start] + sync_new + play[sync_end:]

submit_start = play.index('async function submitRatedMove(move, moveId) {')
submit_end = play.index('\nfunction handleBoardInput', submit_start)
submit_new = '''function ratedPayloadMatchesMove(payload, moveId) {
  return Boolean(payload && moveId && payload.last_player_request_id === moveId);
}

function ratedPayloadTurn(payload) {
  if (!payload?.fen) return null;
  try {
    return new window.Chess(payload.fen).turn();
  } catch (error) {
    console.error('invalid rated payload fen', error);
    return null;
  }
}

async function waitForRatedMoveAck(moveId, attempts = 8) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const payload = await fetchRatedState();
    if (ratedPayloadMatchesMove(payload, moveId)) return payload;
    await new Promise((resolve) => setTimeout(resolve, 250 + attempt * 120));
  }
  return null;
}

async function waitForRatedComputerReply(moveId, initialPayload = null, attempts = 8) {
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
'''
play = play[:submit_start] + submit_new + play[submit_end:]
play_path.write_text(play, encoding='utf-8')

html_path = ROOT / 'play-v10.html'
html = html_path.read_text(encoding='utf-8')
html, count = re.subn(r'play-computer\.js\?v=[0-9-]+', 'play-computer.js?v=20260907-22', html, count=1)
if count != 1:
    raise SystemExit(f'expected one computer script version, replaced {count}')
html_path.write_text(html, encoding='utf-8')

index_path = ROOT / 'index.html'
index = index_path.read_text(encoding='utf-8')
index, count = re.subn(r'play-v10\.html\?computer=1(?:&v=[0-9-]+)?', 'play-v10.html?computer=1&v=20260907-22', index)
if count < 1:
    raise SystemExit('computer entry link not found')
index_path.write_text(index, encoding='utf-8')

print('computer move acknowledgement patch applied')
