import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { Chess } from 'npm:chess.js@1.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8',
};

const LEVEL_POINTS = { easy: 5, medium: 10, hard: 20 } as const;
const TIME_CONTROLS = new Set([5, 10, 15]);
const MIN_THINK_MS = { easy: 900, medium: 1200, hard: 1600 } as const;
const LEVEL_SEARCH = {
  easy: { depth: 1, candidateWindow: 65, maxCandidates: 4 },
  medium: { depth: 1, candidateWindow: 12, maxCandidates: 2 },
  hard: { depth: 2, candidateWindow: 0, maxCandidates: 1 },
} as const;

type Level = keyof typeof LEVEL_POINTS;
type GameResult = 'win' | 'loss' | 'draw';

type SearchMove = {
  from: string;
  to: string;
  san: string;
  piece: string;
  captured?: string;
  promotion?: string;
  flags?: string;
};

const PIECE_VALUE: Record<string, number> = {
  p: 100,
  n: 320,
  b: 335,
  r: 500,
  q: 900,
  k: 0,
};

function reply(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: corsHeaders });
}

function isLevel(value: unknown): value is Level {
  return typeof value === 'string' && value in LEVEL_POINTS;
}

function isTimeControl(value: unknown): value is number {
  const minutes = Number(value);
  return Number.isInteger(minutes) && TIME_CONTROLS.has(minutes);
}

function elapsedMs(startedAt: unknown, nowMs = Date.now()) {
  const started = Date.parse(String(startedAt ?? ''));
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, nowMs - started);
}

function positionResult(chess: Chess): GameResult | null {
  if (chess.isCheckmate()) return chess.turn() === 'b' ? 'win' : 'loss';
  if (chess.isDraw()) return 'draw';
  return null;
}

function positionalBonus(piece: { type: string; color: string }, row: number, col: number) {
  const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
  const centrality = Math.max(0, 7 - centerDistance * 2);
  const whiteAdvance = Math.max(0, 6 - row);
  const blackAdvance = Math.max(0, row - 1);
  const advance = piece.color === 'w' ? whiteAdvance : blackAdvance;

  if (piece.type === 'p') {
    const centerPawn = col === 3 || col === 4 ? 10 : (col === 2 || col === 5 ? 4 : 0);
    return advance * 5 + centerPawn;
  }
  if (piece.type === 'n') return Math.round(centrality * 7 - centerDistance * 2);
  if (piece.type === 'b') return Math.round(centrality * 4 + (col === 2 || col === 5 ? 2 : 0));
  if (piece.type === 'r') {
    const seventh = piece.color === 'w' ? row === 1 : row === 6;
    return seventh ? 18 : Math.round(centrality);
  }
  if (piece.type === 'q') return Math.round(centrality * 1.5);
  if (piece.type === 'k') {
    const homeRow = piece.color === 'w' ? 7 : 0;
    if (row === homeRow && (col === 6 || col === 2)) return 34;
    if (row === homeRow && (col === 4 || col === 3 || col === 5)) return 10;
    return -Math.round(centrality * 3);
  }
  return 0;
}

function evaluate(chess: Chess): number {
  if (chess.isCheckmate()) return chess.turn() === 'w' ? 100000 : -100000;
  if (chess.isDraw()) return 0;

  let score = 0;
  let whiteBishops = 0;
  let blackBishops = 0;
  const board = chess.board();

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const piece = board[row][col];
      if (!piece) continue;
      const material = PIECE_VALUE[piece.type] ?? 0;
      const position = positionalBonus(piece, row, col);
      const value = material + position;
      if (piece.color === 'b') score += value;
      else score -= value;
      if (piece.type === 'b') {
        if (piece.color === 'b') blackBishops += 1;
        else whiteBishops += 1;
      }
    }
  }

  if (blackBishops >= 2) score += 24;
  if (whiteBishops >= 2) score -= 24;
  if (chess.inCheck()) score += chess.turn() === 'w' ? 45 : -45;
  return score;
}

function moveOrderingScore(move: SearchMove) {
  let score = 0;
  if (move.san.includes('#')) score += 1_000_000;
  else if (move.san.includes('+')) score += 2_000;
  if (move.promotion) score += 9_000 + (PIECE_VALUE[move.promotion] ?? 0);
  if (move.captured) {
    score += 10_000 + (PIECE_VALUE[move.captured] ?? 0) * 12 - (PIECE_VALUE[move.piece] ?? 0);
  }
  if ((move.flags || '').includes('k') || (move.flags || '').includes('q')) score += 700;
  const file = move.to.charCodeAt(0) - 97;
  const rank = Number(move.to[1]);
  if ((file === 3 || file === 4) && (rank === 4 || rank === 5)) score += 80;
  return score;
}

function orderMoves<T extends SearchMove>(moves: T[]): T[] {
  return [...moves].sort((a, b) => moveOrderingScore(b) - moveOrderingScore(a));
}

function minimax(chess: Chess, depth: number, alpha: number, beta: number): number {
  if (depth <= 0 || chess.isGameOver()) return evaluate(chess);
  const moves = orderMoves(chess.moves({ verbose: true }) as SearchMove[]);
  const blackToMove = chess.turn() === 'b';

  if (blackToMove) {
    let best = -Infinity;
    for (const move of moves) {
      chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
      best = Math.max(best, minimax(chess, depth - 1, alpha, beta));
      chess.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
    best = Math.min(best, minimax(chess, depth - 1, alpha, beta));
    chess.undo();
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

function randomItem<T>(items: T[]): T {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return items[bytes[0] % items.length];
}

function chooseComputerMove(chess: Chess, level: Level) {
  const moves = orderMoves(chess.moves({ verbose: true }) as SearchMove[]);
  if (!moves.length) return null;
  const settings = LEVEL_SEARCH[level];
  const scored: Array<{ move: SearchMove; score: number }> = [];

  for (const move of moves) {
    chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
    let score = minimax(chess, settings.depth, -Infinity, Infinity);
    if (move.captured) score += (PIECE_VALUE[move.captured] ?? 0) * 0.08;
    if (move.san.includes('+')) score += 14;
    if (move.san.includes('#')) score += 50_000;
    chess.undo();
    scored.push({ move, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const bestScore = scored[0].score;
  const candidates = scored
    .filter((entry) => entry.score >= bestScore - settings.candidateWindow)
    .slice(0, settings.maxCandidates);
  return level === 'hard' ? candidates[0].move : randomItem(candidates).move;
}

function moveRecord(
  side: 'player' | 'computer',
  move: { from: string; to: string; san: string; promotion?: string },
  requestId: string | null = null,
) {
  return {
    side,
    from: move.from,
    to: move.to,
    san: move.san,
    promotion: move.promotion ?? null,
    request_id: requestId,
  };
}

function clockPayload(
  row: Record<string, unknown>,
  playerTimeMs = Number(row.player_time_ms ?? 0),
  computerTimeMs = Number(row.computer_time_ms ?? 0),
  turnStartedAt = String(row.turn_started_at ?? new Date().toISOString()),
) {
  return {
    time_control_minutes: Number(row.time_control_minutes ?? 0),
    player_time_ms: Math.max(0, Math.round(playerTimeMs)),
    computer_time_ms: Math.max(0, Math.round(computerTimeMs)),
    turn_started_at: turnStartedAt,
    server_now: new Date().toISOString(),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authorization = req.headers.get('Authorization') || '';

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) {
      return reply({ error: 'Authentication required' }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    const user = authData?.user;
    if (authError || !user) return reply({ error: 'Authentication required' }, 401);

    const { data: player, error: playerError } = await admin
      .from('players')
      .select('id,name,rating,status')
      .eq('auth_user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (playerError || !player) {
      if (playerError) console.error('player lookup failed', playerError.message);
      return reply({ error: 'Player profile required' }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return reply({ error: 'Invalid request' }, 400);
    }

    const action = String(body.action ?? '');
    const gameSelect = 'id,level,fen,moves,status,result,time_control_minutes,player_time_ms,computer_time_ms,turn_started_at';

    async function getGame(gameId: string) {
      const { data, error } = await admin
        .from('computer_games')
        .select(gameSelect)
        .eq('id', gameId)
        .eq('player_id', player.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    }

    async function settle(
      gameId: string,
      result: GameResult,
      fen: string,
      moves: unknown[],
      clocks?: { playerTimeMs?: number; computerTimeMs?: number; turnStartedAt?: string },
    ) {
      const nowIso = new Date().toISOString();
      const update: Record<string, unknown> = {
        fen,
        moves,
        status: 'finished',
        result,
        finished_at: nowIso,
        updated_at: nowIso,
      };
      if (clocks?.playerTimeMs !== undefined) update.player_time_ms = Math.max(0, Math.round(clocks.playerTimeMs));
      if (clocks?.computerTimeMs !== undefined) update.computer_time_ms = Math.max(0, Math.round(clocks.computerTimeMs));
      if (clocks?.turnStartedAt) update.turn_started_at = clocks.turnStartedAt;

      const { error: updateError } = await admin
        .from('computer_games')
        .update(update)
        .eq('id', gameId)
        .eq('player_id', player.id)
        .eq('status', 'active');
      if (updateError) throw updateError;

      const { data: ratingData, error: ratingError } = await admin.rpc('apply_computer_game_rating', {
        p_game_id: gameId,
      });
      if (ratingError) throw ratingError;
      return Array.isArray(ratingData) ? ratingData[0] ?? null : ratingData;
    }

    async function settledRating(gameId: string) {
      const { data, error } = await admin.rpc('apply_computer_game_rating', { p_game_id: gameId });
      if (error) throw error;
      return Array.isArray(data) ? data[0] ?? null : data;
    }

    if (action === 'start') {
      const level = body.level;
      const minutes = Number(body.minutes);
      if (!isLevel(level)) return reply({ error: 'Invalid level' }, 400);
      if (!isTimeControl(minutes)) return reply({ error: 'Invalid time control' }, 400);

      const { data: abandoned, error: abandonedError } = await admin
        .from('computer_games')
        .select(gameSelect)
        .eq('player_id', player.id)
        .eq('status', 'active');
      if (abandonedError) throw abandonedError;

      for (const oldGame of abandoned ?? []) {
        await settle(oldGame.id, 'loss', oldGame.fen, Array.isArray(oldGame.moves) ? oldGame.moves : [], {
          playerTimeMs: Number(oldGame.player_time_ms ?? 0),
          computerTimeMs: Number(oldGame.computer_time_ms ?? 0),
          turnStartedAt: String(oldGame.turn_started_at ?? new Date().toISOString()),
        });
      }

      const initialMs = minutes * 60_000;
      const startedAt = new Date().toISOString();
      const chess = new Chess();
      const { data: created, error: createError } = await admin
        .from('computer_games')
        .insert({
          player_id: player.id,
          level,
          fen: chess.fen(),
          moves: [],
          status: 'active',
          time_control_minutes: minutes,
          player_time_ms: initialMs,
          computer_time_ms: initialMs,
          turn_started_at: startedAt,
        })
        .select(gameSelect)
        .single();
      if (createError || !created) throw createError ?? new Error('computer game not created');

      const { data: refreshedPlayer } = await admin
        .from('players')
        .select('name,rating')
        .eq('id', player.id)
        .single();

      return reply({
        game_id: created.id,
        level: created.level,
        points: LEVEL_POINTS[level],
        fen: created.fen,
        status: 'active',
        player_name: refreshedPlayer?.name ?? player.name,
        rating: refreshedPlayer?.rating ?? player.rating,
        ...clockPayload(created),
      });
    }

    if (action === 'state') {
      const gameId = String(body.game_id ?? '');
      if (!gameId) return reply({ error: 'Game id required' }, 400);
      const row = await getGame(gameId);
      if (!row) return reply({ error: 'Computer game not found' }, 404);

      if (row.status === 'finished' && row.result) {
        return reply({
          game_id: row.id,
          fen: row.fen,
          status: row.status,
          result: row.result,
          rating: await settledRating(row.id),
          ...clockPayload(row),
        });
      }

      if (row.status !== 'active') {
        return reply({ game_id: row.id, fen: row.fen, status: row.status, result: row.result, ...clockPayload(row) });
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

    if (action === 'move') {
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
        return reply({
          game_id: row.id,
          fen: row.fen,
          status: row.status,
          result: row.result,
          rating: row.status === 'finished' && row.result ? await settledRating(row.id) : null,
          ...clockPayload(row),
        });
      }

      if (row.status !== 'active') return reply({ error: 'Computer game is finished' }, 409);
      if (!isLevel(row.level)) return reply({ error: 'Invalid stored level' }, 500);
      if (!isTimeControl(row.time_control_minutes)) return reply({ error: 'Invalid stored time control' }, 500);

      const receivedAt = Date.now();
      const playerTimeMs = Math.max(0, Number(row.player_time_ms) - elapsedMs(row.turn_started_at, receivedAt));
      const computerTimeBefore = Math.max(0, Number(row.computer_time_ms));
      const playerTurnStartedAt = new Date(receivedAt).toISOString();

      if (playerTimeMs <= 0) {
        const rating = await settle(row.id, 'loss', row.fen, Array.isArray(row.moves) ? row.moves : [], {
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
      if (chess.turn() !== 'w') return reply({ error: 'Not player turn' }, 409);

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

      const moves = Array.isArray(row.moves) ? [...row.moves] : [];
      moves.push(moveRecord('player', playerMove, moveId || null));

      let result = positionResult(chess);
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

      const computerStartedAt = Date.now();
      const selected = chooseComputerMove(chess, row.level);
      const searchElapsed = Math.max(0, Date.now() - computerStartedAt);
      const waitMs = Math.max(0, MIN_THINK_MS[row.level] - searchElapsed);
      if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
      const computerElapsed = Math.max(1, Date.now() - computerStartedAt);
      const computerTimeMs = Math.max(0, computerTimeBefore - computerElapsed);

      if (computerTimeMs <= 0) {
        const stoppedAt = new Date().toISOString();
        const rating = await settle(row.id, 'win', chess.fen(), moves, {
          playerTimeMs,
          computerTimeMs: 0,
          turnStartedAt: stoppedAt,
        });
        return reply({
          game_id: row.id,
          fen: chess.fen(),
          status: 'finished',
          result: 'win',
          rating,
          ...clockPayload(row, playerTimeMs, 0, stoppedAt),
        });
      }

      if (!selected) return reply({ error: 'Computer has no legal move' }, 500);
      const computerMove = chess.move({ from: selected.from, to: selected.to, promotion: selected.promotion || 'q' });
      if (!computerMove) return reply({ error: 'Computer selected an invalid move' }, 500);
      moves.push(moveRecord('computer', computerMove));

      result = positionResult(chess);
      const nextTurnStartedAt = new Date().toISOString();
      if (result) {
        const rating = await settle(row.id, result, chess.fen(), moves, {
          playerTimeMs,
          computerTimeMs,
          turnStartedAt: nextTurnStartedAt,
        });
        return reply({
          game_id: row.id,
          fen: chess.fen(),
          computer_move: moveRecord('computer', computerMove),
          status: 'finished',
          result,
          rating,
          ...clockPayload(row, playerTimeMs, computerTimeMs, nextTurnStartedAt),
        });
      }

      const { error: saveError } = await admin
        .from('computer_games')
        .update({
          fen: chess.fen(),
          moves,
          player_time_ms: Math.round(playerTimeMs),
          computer_time_ms: Math.round(computerTimeMs),
          turn_started_at: nextTurnStartedAt,
          updated_at: nextTurnStartedAt,
        })
        .eq('id', row.id)
        .eq('player_id', player.id)
        .eq('status', 'active');
      if (saveError) throw saveError;

      return reply({
        game_id: row.id,
        fen: chess.fen(),
        computer_move: moveRecord('computer', computerMove),
        status: 'active',
        result: null,
        ...clockPayload(row, playerTimeMs, computerTimeMs, nextTurnStartedAt),
      });
    }

    if (action === 'timeout') {
      const gameId = String(body.game_id ?? '');
      if (!gameId) return reply({ error: 'Game id required' }, 400);
      const row = await getGame(gameId);
      if (!row) return reply({ error: 'Computer game not found' }, 404);

      if (row.status !== 'active') {
        return reply({
          game_id: row.id,
          fen: row.fen,
          status: row.status,
          result: row.result,
          rating: row.status === 'finished' && row.result ? await settledRating(row.id) : null,
          ...clockPayload(row),
        });
      }

      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const playerTimeMs = Math.max(0, Number(row.player_time_ms) - elapsedMs(row.turn_started_at, nowMs));
      const computerTimeMs = Math.max(0, Number(row.computer_time_ms));

      if (playerTimeMs > 0) {
        return reply({ game_id: row.id, fen: row.fen, status: 'active', result: null, ...clockPayload(row) });
      }

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

    if (action === 'resign') {
      const gameId = String(body.game_id ?? '');
      if (!gameId) return reply({ error: 'Game id required' }, 400);
      const row = await getGame(gameId);
      if (!row) return reply({ error: 'Computer game not found' }, 404);

      if (row.status !== 'active') {
        return reply({
          game_id: row.id,
          fen: row.fen,
          status: row.status,
          result: row.result,
          rating: row.status === 'finished' && row.result ? await settledRating(row.id) : null,
          ...clockPayload(row),
        });
      }

      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const playerTimeMs = Math.max(0, Number(row.player_time_ms) - elapsedMs(row.turn_started_at, nowMs));
      const computerTimeMs = Math.max(0, Number(row.computer_time_ms));
      const rating = await settle(row.id, 'loss', row.fen, Array.isArray(row.moves) ? row.moves : [], {
        playerTimeMs,
        computerTimeMs,
        turnStartedAt: nowIso,
      });
      return reply({
        game_id: row.id,
        fen: row.fen,
        status: 'finished',
        result: 'loss',
        rating,
        ...clockPayload(row, playerTimeMs, computerTimeMs, nowIso),
      });
    }

    return reply({ error: 'Unknown action' }, 400);
  } catch (error) {
    console.error('computer-game error', error);
    return reply({ error: 'Computer game request failed' }, 500);
  }
});