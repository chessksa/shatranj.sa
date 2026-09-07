from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'supabase' / 'functions' / 'computer-game' / 'index.ts'
code = PATH.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing anchor: {label}')
    return text.replace(old, new, 1)

anchor = """    async function completePendingComputerTurn(row: Record<string, any>) {
"""
helper = """    async function settlePlayerTimeoutIfCurrent(
      row: Record<string, any>,
      computerTimeMs: number,
      nowIso: string,
    ) {
      const moves = Array.isArray(row.moves) ? row.moves : [];
      const { data: saved, error } = await admin
        .from('computer_games')
        .update({
          fen: row.fen,
          moves,
          status: 'finished',
          result: 'loss',
          finished_at: nowIso,
          player_time_ms: 0,
          computer_time_ms: Math.max(0, Math.round(computerTimeMs)),
          turn_started_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', row.id)
        .eq('player_id', player.id)
        .eq('status', 'active')
        .eq('fen', row.fen)
        .select(gameSelect)
        .maybeSingle();
      if (error) throw error;
      if (!saved) {
        const current = await getGame(row.id);
        if (!current) throw new Error('Computer game disappeared while settling player timeout');
        return currentGamePayload(current);
      }
      const rating = await settledRating(saved.id);
      return {
        game_id: saved.id,
        fen: saved.fen,
        status: 'finished',
        result: 'loss',
        rating,
        ...clockPayload(saved),
      };
    }

    async function completePendingComputerTurn(row: Record<string, any>) {
"""
code = replace_once(code, anchor, helper, 'timeout helper insertion')

state_old = """      if (playerTimeMs <= 0) {
        const nowIso = new Date(nowMs).toISOString();
        const rating = await settle(row.id, 'loss', row.fen, Array.isArray(row.moves) ? row.moves : [], {
          playerTimeMs: 0,
          computerTimeMs,
          turnStartedAt: nowIso,
        });
        return reply({
          game_id: row.id,
          fen: row.fen,
          status: 'finished',
          result: 'loss',
          rating,
          ...clockPayload(row, 0, computerTimeMs, nowIso),
        });
      }
"""
state_new = """      if (playerTimeMs <= 0) {
        return reply(await settlePlayerTimeoutIfCurrent(row, computerTimeMs, new Date(nowMs).toISOString()));
      }
"""
code = replace_once(code, state_old, state_new, 'state timeout settlement')

move_old = """      if (playerTimeMs <= 0) {
        const rating = await settle(row.id, 'loss', row.fen, storedMoves, {
          playerTimeMs: 0,
          computerTimeMs: computerTimeBefore,
          turnStartedAt: playerTurnStartedAt,
        });
        return reply({
          game_id: row.id,
          fen: row.fen,
          status: 'finished',
          result: 'loss',
          rating,
          ...clockPayload(row, 0, computerTimeBefore, playerTurnStartedAt),
        });
      }
"""
move_new = """      if (playerTimeMs <= 0) {
        return reply(await settlePlayerTimeoutIfCurrent(row, computerTimeBefore, playerTurnStartedAt));
      }
"""
code = replace_once(code, move_old, move_new, 'move timeout settlement')

timeout_old = """      const rating = await settle(row.id, 'loss', row.fen, Array.isArray(row.moves) ? row.moves : [], {
        playerTimeMs: 0,
        computerTimeMs,
        turnStartedAt: nowIso,
      });
      return reply({
        game_id: row.id,
        fen: row.fen,
        status: 'finished',
        result: 'loss',
        rating,
        ...clockPayload(row, 0, computerTimeMs, nowIso),
      });
"""
timeout_new = """      return reply(await settlePlayerTimeoutIfCurrent(row, computerTimeMs, nowIso));
"""
code = replace_once(code, timeout_old, timeout_new, 'explicit timeout settlement')

PATH.write_text(code, encoding='utf-8')
print('stale computer timeout settlement guard applied')
