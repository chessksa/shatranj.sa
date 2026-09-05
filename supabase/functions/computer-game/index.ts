import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { Chess } from 'npm:chess.js@1.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8',
};

const LEVEL_POINTS = { easy: 5, medium: 10, hard: 20 } as const;
type Level = keyof typeof LEVEL_POINTS;
type GameResult = 'win' | 'loss' | 'draw';

const PIECE_VALUE: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
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

function positionResult(chess: Chess): GameResult | null {
  if (chess.isCheckmate()) {
    return chess.turn() === 'b' ? 'win' : 'loss';
  }
  if (chess.isDraw()) return 'draw';
  return null;
}

function evaluate(chess: Chess): number {
  if (chess.isCheckmate()) return chess.turn() === 'w' ? 100000 : -100000;
  if (chess.isDraw()) return 0;

  let score = 0;
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece) continue;
      const value = PIECE_VALUE[piece.type] ?? 0;
      score += piece.color === 'b' ? value : -value;
    }
  }
  const mobility = chess.moves().length;
  score += (chess.turn() === 'b' ? mobility : -mobility) * 2;
  if (chess.inCheck()) score += chess.turn() === 'w' ? 35 : -35;
  return score;
}

function minimax(chess: Chess, depth: number, alpha: number, beta: number): number {
  if (depth <= 0 || chess.isGameOver()) return evaluate(chess);
  const moves = chess.moves({ verbose: true });
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
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;
  if (level === 'easy') return randomItem(moves);

  let bestScore = -Infinity;
  let bestMoves: typeof moves = [];
  const depth = level === 'hard' ? 2 : 0;

  for (const move of moves) {
    chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
    let score = depth > 0 ? minimax(chess, depth, -Infinity, Infinity) : evaluate(chess);
    if (move.captured) score += (PIECE_VALUE[move.captured] ?? 0) * 0.15;
    if (move.san.includes('+')) score += 18;
    chess.undo();

    if (score > bestScore + 0.01) {
      bestScore = score;
      bestMoves = [move];
    } else if (Math.abs(score - bestScore) <= 0.01) {
      bestMoves.push(move);
    }
  }

  return randomItem(bestMoves.length ? bestMoves : moves);
}

function moveRecord(side: 'player' | 'computer', move: { from: string; to: string; san: string; promotion?: string }) {
  return {
    side,
    from: move.from,
    to: move.to,
    san: move.san,
    promotion: move.promotion ?? null,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);

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

  async function settle(gameId: string, result: GameResult, fen: string, moves: unknown[]) {
    const { error: updateError } = await admin
      .from('computer_games')
      .update({
        fen,
        moves,
        status: 'finished',
        result,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
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

  if (action === 'start') {
    const level = body.level;
    if (!isLevel(level)) return reply({ error: 'Invalid level' }, 400);

    const { data: abandoned, error: abandonedError } = await admin
      .from('computer_games')
      .select('id,fen,moves')
      .eq('player_id', player.id)
      .eq('status', 'active');
    if (abandonedError) throw abandonedError;

    for (const oldGame of abandoned ?? []) {
      await settle(oldGame.id, 'loss', oldGame.fen, Array.isArray(oldGame.moves) ? oldGame.moves : []);
    }

    const chess = new Chess();
    const { data: created, error: createError } = await admin
      .from('computer_games')
      .insert({
        player_id: player.id,
        level,
        fen: chess.fen(),
        moves: [],
        status: 'active',
      })
      .select('id,level,fen')
      .single();

    if (createError || !created) throw createError ?? new Error('computer game not created');
    return reply({
      game_id: created.id,
      level: created.level,
      points: LEVEL_POINTS[level],
      fen: created.fen,
      status: 'active',
      player_name: player.name,
      rating: player.rating,
    });
  }

  if (action === 'move') {
    const gameId = String(body.game_id ?? '');
    const from = String(body.from ?? '');
    const to = String(body.to ?? '');
    const promotion = String(body.promotion ?? 'q').toLowerCase();
    if (!gameId || !/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) {
      return reply({ error: 'Invalid move' }, 400);
    }

    const { data: row, error: gameError } = await admin
      .from('computer_games')
      .select('id,level,fen,moves,status,result')
      .eq('id', gameId)
      .eq('player_id', player.id)
      .maybeSingle();

    if (gameError || !row) return reply({ error: 'Computer game not found' }, 404);
    if (row.status !== 'active') return reply({ error: 'Computer game is finished' }, 409);
    if (!isLevel(row.level)) return reply({ error: 'Invalid stored level' }, 500);

    const chess = new Chess(row.fen);
    if (chess.turn() !== 'w') return reply({ error: 'Not player turn' }, 409);

    let playerMove;
    try {
      playerMove = chess.move({ from, to, promotion: ['q','r','b','n'].includes(promotion) ? promotion : 'q' });
    } catch {
      return reply({ error: 'Illegal move' }, 400);
    }
    if (!playerMove) return reply({ error: 'Illegal move' }, 400);

    const moves = Array.isArray(row.moves) ? [...row.moves] : [];
    moves.push(moveRecord('player', playerMove));

    let result = positionResult(chess);
    if (result) {
      const rating = await settle(row.id, result, chess.fen(), moves);
      return reply({
        game_id: row.id,
        fen: chess.fen(),
        status: 'finished',
        result,
        rating,
      });
    }

    const selected = chooseComputerMove(chess, row.level);
    if (!selected) return reply({ error: 'Computer has no legal move' }, 500);
    const computerMove = chess.move({
      from: selected.from,
      to: selected.to,
      promotion: selected.promotion || 'q',
    });
    moves.push(moveRecord('computer', computerMove));

    result = positionResult(chess);
    if (result) {
      const rating = await settle(row.id, result, chess.fen(), moves);
      return reply({
        game_id: row.id,
        fen: chess.fen(),
        computer_move: moveRecord('computer', computerMove),
        status: 'finished',
        result,
        rating,
      });
    }

    const { error: saveError } = await admin
      .from('computer_games')
      .update({ fen: chess.fen(), moves, updated_at: new Date().toISOString() })
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
    });
  }

  if (action === 'resign') {
    const gameId = String(body.game_id ?? '');
    if (!gameId) return reply({ error: 'Game id required' }, 400);

    const { data: row, error: gameError } = await admin
      .from('computer_games')
      .select('id,fen,moves,status')
      .eq('id', gameId)
      .eq('player_id', player.id)
      .maybeSingle();
    if (gameError || !row) return reply({ error: 'Computer game not found' }, 404);

    if (row.status !== 'active') {
      const { data: settled } = await admin.rpc('apply_computer_game_rating', { p_game_id: row.id });
      return reply({ status: row.status, rating: Array.isArray(settled) ? settled[0] ?? null : settled });
    }

    const rating = await settle(row.id, 'loss', row.fen, Array.isArray(row.moves) ? row.moves : []);
    return reply({ game_id: row.id, status: 'finished', result: 'loss', rating });
  }

  return reply({ error: 'Unknown action' }, 400);
});
