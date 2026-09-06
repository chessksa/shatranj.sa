from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
edge_path = ROOT / 'supabase' / 'functions' / 'computer-game' / 'index.ts'
play_path = ROOT / 'play-computer.js'
html_path = ROOT / 'play-v10.html'
index_path = ROOT / 'index.html'

edge = edge_path.read_text(encoding='utf-8')
play = play_path.read_text(encoding='utf-8')
html = html_path.read_text(encoding='utf-8')
index = index_path.read_text(encoding='utf-8')

helper_marker = "    if (action === 'start') {"
if 'async function persistPlayerTurnBeforeComputer' not in edge:
    helpers = r'''    async function currentGamePayload(row: Record<string, any>) {
      return {
        game_id: row.id,
        fen: row.fen,
        status: row.status,
        result: row.result,
        rating: row.status === 'finished' && row.result ? await settledRating(row.id) : null,
        ...clockPayload(row),
      };
    }

    async function persistPlayerTurnBeforeComputer(
      row: Record<string, any>,
      chess: Chess,
      moves: unknown[],
      playerTimeMs: number,
      computerTimeMs: number,
      turnStartedAt: string,
    ) {
      const { data: saved, error } = await admin
        .from('computer_games')
        .update({
          fen: chess.fen(),
          moves,
          player_time_ms: Math.round(playerTimeMs),
          computer_time_ms: Math.round(computerTimeMs),
          turn_started_at: turnStartedAt,
          updated_at: turnStartedAt,
        })
        .eq('id', row.id)
        .eq('player_id', player.id)
        .eq('status', 'active')
        .eq('fen', row.fen)
        .select(gameSelect)
        .maybeSingle();
      if (error) throw error;
      if (saved) return saved;
      const current = await getGame(row.id);
      if (!current) throw new Error('Computer game disappeared while saving player move');
      return current;
    }

    async function settlePendingComputerTurn(
      row: Record<string, any>,
      result: GameResult,
      fen: string,
      moves: unknown[],
      playerTimeMs: number,
      computerTimeMs: number,
      turnStartedAt: string,
    ) {
      const { data: saved, error } = await admin
        .from('computer_games')
        .update({
          fen,
          moves,
          status: 'finished',
          result,
          finished_at: turnStartedAt,
          player_time_ms: Math.max(0, Math.round(playerTimeMs)),
          computer_time_ms: Math.max(0, Math.round(computerTimeMs)),
          turn_started_at: turnStartedAt,
          updated_at: turnStartedAt,
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
        if (!current) throw new Error('Computer game disappeared while settling computer turn');
        return currentGamePayload(current);
      }
      const rating = await settledRating(saved.id);
      return {
        game_id: saved.id,
        fen: saved.fen,
        status: 'finished',
        result: saved.result,
        rating,
        ...clockPayload(saved),
      };
    }

    async function completePendingComputerTurn(row: Record<string, any>) {
      if (row.status !== 'active') return currentGamePayload(row);
      if (!isLevel(row.level)) throw new Error('Invalid stored level');
      if (!isTimeControl(row.time_control_minutes)) throw new Error('Invalid stored time control');

      const chess = new Chess(row.fen);
      if (chess.turn() !== 'b') return currentGamePayload(row);

      const moves = Array.isArray(row.moves) ? [...row.moves] : [];
      const playerTimeMs = Math.max(0, Number(row.player_time_ms));
      const computerTimeBefore = Math.max(0, Number(row.computer_time_ms));
      const startedAtMs = Date.parse(String(row.turn_started_at ?? ''));
      const computerStartedAt = Number.isFinite(startedAtMs) ? startedAtMs : Date.now();

      const selected = chooseComputerMove(chess, row.level);
      const elapsedAfterSearch = Math.max(0, Date.now() - computerStartedAt);
      const waitMs = Math.max(0, MIN_THINK_MS[row.level] - elapsedAfterSearch);
      if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
      const computerElapsed = Math.max(1, Date.now() - computerStartedAt);
      const computerTimeMs = Math.max(0, computerTimeBefore - computerElapsed);
      const completedAt = new Date().toISOString();

      if (computerTimeMs <= 0) {
        return settlePendingComputerTurn(
          row,
          'win',
          chess.fen(),
          moves,
          playerTimeMs,
          0,
          completedAt,
        );
      }

      if (!selected) throw new Error('Computer has no legal move');
      const computerMove = chess.move({ from: selected.from, to: selected.to, promotion: selected.promotion || 'q' });
      if (!computerMove) throw new Error('Computer selected an invalid move');
      moves.push(moveRecord('computer', computerMove));

      const result = positionResult(chess);
      if (result) {
        const payload = await settlePendingComputerTurn(
          row,
          result,
          chess.fen(),
          moves,
          playerTimeMs,
          computerTimeMs,
          completedAt,
        );
        return { ...payload, computer_move: moveRecord('computer', computerMove) };
      }

      const { data: saved, error } = await admin
        .from('computer_games')
        .update({
          fen: chess.fen(),
          moves,
          player_time_ms: Math.round(playerTimeMs),
          computer_time_ms: Math.round(computerTimeMs),
          turn_started_at: completedAt,
          updated_at: completedAt,
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
        if (!current) throw new Error('Computer game disappeared while saving computer move');
        return currentGamePayload(current);
      }
      return {
        game_id: saved.id,
        fen: saved.fen,
        computer_move: moveRecord('computer', computerMove),
        status: 'active',
        result: null,
        ...clockPayload(saved),
      };
    }

'''
    if helper_marker not in edge:
        raise SystemExit('start action marker missing')
    edge = edge.replace(helper_marker, helpers + helper_marker, 1)

state_start = edge.index("    if (action === 'state') {")
move_start = edge.index("    if (action === 'move') {", state_start)
new_state = r'''    if (action === 'state') {
      const gameId = String(body.game_id ?? '');
      if (!gameId) return reply({ error: 'Game id required' }, 400);
      const row = await getGame(gameId);
      if (!row) return reply({ error: 'Computer game not found' }, 404);

      if (row.status === 'finished' && row.result) return reply(await currentGamePayload(row));
      if (row.status !== 'active') return reply(await currentGamePayload(row));

      const stateChess = new Chess(row.fen);
      const activeSide = stateChess.turn() === 'b' ? 'computer' : 'player';
      if (activeSide === 'computer') {
        return reply(await completePendingComputerTurn(row));
      }

      const nowMs = Date.now();
      const playerTimeMs = Math.max(0, Number(row.player_time_ms) - elapsedMs(row.turn_started_at, nowMs));
      const computerTimeMs = Math.max(0, Number(row.computer_time_ms));
      if (playerTimeMs <= 0) {
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

      return reply({ game_id: row.id, fen: row.fen, status: 'active', result: null, ...clockPayload(row) });
    }

'''
edge = edge[:state_start] + new_state + edge[move_start:]

move_start = edge.index("    if (action === 'move') {")
timeout_start = edge.index("    if (action === 'timeout') {", move_start)
new_move = r'''    if (action === 'move') {
      const gameId = String(body.game_id ?? '');
      const from = String(body.from ?? '');
      const to = String(body.to ?? '');
      const promotion = String(body.promotion ?? 'q').toLowerCase();
      const moveId = String(body.move_id ?? '');
      if (!gameId || !/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to) || moveId.length > 128) {
        return reply({ error: 'Invalid move' }, 400);
      }

      const row = await getGame(gameId);
      if (!row) return reply({ error: 'Computer game not found' }, 404);

      const storedMoves = Array.isArray(row.moves) ? row.moves : [];
      const existingMove = moveId
        ? storedMoves.find((entry) => {
            if (!entry || typeof entry !== 'object') return false;
            const record = entry as Record<string, unknown>;
            return record.side === 'player' && record.request_id === moveId;
          })
        : null;
      if (existingMove) {
        const retryChess = new Chess(row.fen);
        if (row.status === 'active' && retryChess.turn() === 'b') {
          return reply(await completePendingComputerTurn(row));
        }
        return reply(await currentGamePayload(row));
      }

      if (row.status !== 'active') return reply({ error: 'Computer game is finished' }, 409);
      if (!isLevel(row.level)) return reply({ error: 'Invalid stored level' }, 500);
      if (!isTimeControl(row.time_control_minutes)) return reply({ error: 'Invalid stored time control' }, 500);

      const receivedAt = Date.now();
      const playerTimeMs = Math.max(0, Number(row.player_time_ms) - elapsedMs(row.turn_started_at, receivedAt));
      const computerTimeBefore = Math.max(0, Number(row.computer_time_ms));
      const playerTurnStartedAt = new Date(receivedAt).toISOString();

      if (playerTimeMs <= 0) {
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

      const chess = new Chess(row.fen);
      if (chess.turn() !== 'w') return reply({ error: 'Computer turn in progress' }, 409);

      let playerMove;
      try {
        playerMove = chess.move({
          from,
          to,
          promotion: ['q', 'r', 'b', 'n'].includes(promotion) ? promotion : 'q',
        });
      } catch {
        return reply({ error: 'Illegal move' }, 400);
      }
      if (!playerMove) return reply({ error: 'Illegal move' }, 400);

      const moves = [...storedMoves];
      moves.push(moveRecord('player', playerMove, moveId || null));

      const result = positionResult(chess);
      if (result) {
        const rating = await settle(row.id, result, chess.fen(), moves, {
          playerTimeMs,
          computerTimeMs: computerTimeBefore,
          turnStartedAt: playerTurnStartedAt,
        });
        return reply({
          game_id: row.id,
          fen: chess.fen(),
          status: 'finished',
          result,
          rating,
          ...clockPayload(row, playerTimeMs, computerTimeBefore, playerTurnStartedAt),
        });
      }

      const computerStartedAt = new Date().toISOString();
      const persisted = await persistPlayerTurnBeforeComputer(
        row,
        chess,
        moves,
        playerTimeMs,
        computerTimeBefore,
        computerStartedAt,
      );
      const persistedChess = new Chess(persisted.fen);
      if (persisted.status === 'active' && persistedChess.turn() === 'b') {
        return reply(await completePendingComputerTurn(persisted));
      }
      return reply(await currentGamePayload(persisted));
    }

'''
edge = edge[:move_start] + new_move + edge[timeout_start:]

play = play.replace("toast('تمت مزامنة المباراة مع الخادم.');", "toast('تم تحديث المباراة من الخادم.');")
html = html.replace("play-computer.js?v=20260907-18", "play-computer.js?v=20260907-19")
index = index.replace("play-v10.html?computer=1&v=20260907-19", "play-v10.html?computer=1&v=20260907-19")
index = index.replace("play-v10.html?computer=1&v=20260907-18", "play-v10.html?computer=1&v=20260907-19")
index = index.replace("play-v10.html?computer=1", "play-v10.html?computer=1&v=20260907-19")

edge_path.write_text(edge, encoding='utf-8')
play_path.write_text(play, encoding='utf-8')
html_path.write_text(html, encoding='utf-8')
index_path.write_text(index, encoding='utf-8')
print('computer two-phase server synchronization fix applied')
