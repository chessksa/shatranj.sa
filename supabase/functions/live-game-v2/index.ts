import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { Chess } from 'npm:chess.js@1.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8',
};

function reply(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: corsHeaders });
}

function asInteger(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function isSquare(value: unknown): value is string {
  return typeof value === 'string' && /^[a-h][1-8]$/.test(value);
}

function validPromotion(value: unknown): value is string | null {
  return value == null || value === '' || ['q', 'r', 'b', 'n'].includes(String(value));
}

function dateMs(value: unknown) {
  const parsed = Date.parse(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function elapsedForTurn(game: Record<string, unknown>, nowMs: number) {
  if (game.status === 'matched') {
    const graceMs = dateMs(game.grace_until);
    if (graceMs == null || nowMs <= graceMs) return 0;
    return Math.max(0, nowMs - graceMs);
  }
  const anchorMs = dateMs(game.clock_anchor_at);
  if (anchorMs == null) return 0;
  return Math.max(0, nowMs - anchorMs);
}

function terminalState(chess: Chess, moverColor: 'w' | 'b') {
  if (chess.isCheckmate()) {
    return {
      result: moverColor === 'w' ? '1-0' : '0-1',
      termination: 'checkmate',
    };
  }
  if (chess.isStalemate()) return { result: '1/2-1/2', termination: 'stalemate' };
  if (chess.isDraw()) return { result: '1/2-1/2', termination: 'draw' };
  return { result: null, termination: null };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = req.headers.get('Authorization') || req.headers.get('authorization') || '';

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
    .select('id,status,is_synthetic')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (playerError || !player || player.is_synthetic || ['banned', 'suspended', 'inactive'].includes(String(player.status ?? ''))) {
    return reply({ error: 'Player profile required' }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply({ error: 'Invalid request' }, 400);
  }

  if (String(body.action ?? '') !== 'move') return reply({ error: 'Unsupported action' }, 400);

  const gameId = typeof body.gameId === 'string' ? body.gameId : '';
  const expectedPly = asInteger(body.expectedPly);
  const from = body.from;
  const to = body.to;
  const promotion = body.promotion == null || body.promotion === '' ? null : String(body.promotion);

  if (!gameId || expectedPly == null || expectedPly < 0 || !isSquare(from) || !isSquare(to) || !validPromotion(promotion)) {
    return reply({ error: 'Invalid move request' }, 400);
  }

  const { data: game, error: gameError } = await admin
    .from('v2_games')
    .select('id,white_player_id,black_player_id,fen,turn,ply,white_ms,black_ms,clock_anchor_at,grace_until,status,result')
    .eq('id', gameId)
    .maybeSingle();

  if (gameError) {
    console.error('V2 game lookup failed', gameError.message);
    return reply({ error: 'Could not load game' }, 500);
  }
  if (!game) return reply({ error: 'Game not found' }, 404);
  if (!['matched', 'active'].includes(game.status)) return reply({ error: 'Game is not active' }, 409);
  if (game.ply !== expectedPly) return reply({ error: 'Game state changed', code: 'stale_state' }, 409);

  const moverColor: 'w' | 'b' | null = game.white_player_id === player.id
    ? 'w'
    : game.black_player_id === player.id
      ? 'b'
      : null;

  if (!moverColor) return reply({ error: 'Game not accessible' }, 403);
  if (game.turn !== moverColor) return reply({ error: 'Not your turn' }, 409);

  const nowMs = Date.now();
  const elapsedMs = elapsedForTurn(game, nowMs);
  let whiteMs = Number(game.white_ms);
  let blackMs = Number(game.black_ms);

  if (moverColor === 'w') whiteMs = Math.max(0, whiteMs - elapsedMs);
  else blackMs = Math.max(0, blackMs - elapsedMs);

  if ((moverColor === 'w' ? whiteMs : blackMs) <= 0) {
    return reply({ error: 'Clock expired', code: 'clock_expired' }, 409);
  }

  let chess: Chess;
  try {
    chess = new Chess(game.fen);
  } catch {
    return reply({ error: 'Invalid authoritative position' }, 500);
  }

  let move;
  try {
    move = chess.move({ from, to, ...(promotion ? { promotion } : {}) });
  } catch {
    return reply({ error: 'Illegal move', code: 'illegal_move' }, 409);
  }
  if (!move) return reply({ error: 'Illegal move', code: 'illegal_move' }, 409);

  const terminal = terminalState(chess, moverColor);
  const { data: committedData, error: commitError } = await admin.rpc('commit_v2_move_server', {
    game_id: gameId,
    mover_player_id: player.id,
    expected_ply: expectedPly,
    from_square: from,
    to_square: to,
    promotion,
    san_value: move.san,
    fen_value: chess.fen(),
    next_turn: chess.turn(),
    white_ms_value: Math.round(whiteMs),
    black_ms_value: Math.round(blackMs),
    result_value: terminal.result,
    termination_value: terminal.termination,
  });

  if (commitError) {
    const stale = /stale_game_version|wrong_turn|game_not_active/i.test(commitError.message ?? '');
    console.error('V2 move commit failed', commitError.message);
    return reply({ error: stale ? 'Game state changed' : 'Could not save move', code: stale ? 'stale_state' : 'commit_failed' }, stale ? 409 : 500);
  }

  const committed = Array.isArray(committedData) ? committedData[0] ?? null : committedData;
  return reply({ game: committed, serverNow: new Date(nowMs).toISOString() });
});
