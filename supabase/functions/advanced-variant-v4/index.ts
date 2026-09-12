import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { defaultPosition, setupPosition } from 'npm:chessops@0.15.1/variant';
import { parseFen, makeFen } from 'npm:chessops@0.15.1/fen';
import { parseUci, makeUci, squareRank } from 'npm:chessops@0.15.1/util';
import { makeSan } from 'npm:chessops@0.15.1/san';
import type { Position } from 'npm:chessops@0.15.1/chess';
import type { Move, Role, Rules } from 'npm:chessops@0.15.1/types';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8',
};
const reply = (payload: Record<string, unknown>, status = 200) => new Response(JSON.stringify(payload), { status, headers: corsHeaders });
const ADVANCED_VARIANTS = ['crazyhouse', 'atomic', 'antichess', 'horde', 'racingkings'] as const;
type AdvancedVariant = typeof ADVANCED_VARIANTS[number];
const isAdvancedVariant = (value: unknown): value is AdvancedVariant => ADVANCED_VARIANTS.includes(String(value) as AdvancedVariant);
const ruleFor = (variant: AdvancedVariant): Rules => variant as Rules;
const turnCode = (turn: 'white' | 'black') => turn === 'white' ? 'w' : 'b';
const dateMs = (value: unknown) => { const parsed = Date.parse(String(value ?? '')); return Number.isFinite(parsed) ? parsed : Date.now(); };

function positionFromFen(variant: AdvancedVariant, fen: string): Position {
  return setupPosition(ruleFor(variant), parseFen(fen).unwrap()).unwrap();
}
function legalMoves(pos: Position): string[] {
  const moves: string[] = []; const ctx = pos.ctx();
  const promotionRoles: Role[] = ['queen', 'knight', 'rook', 'bishop'];
  if (pos.rules === 'antichess') promotionRoles.push('king');
  for (const [from, dests] of pos.allDests(ctx)) for (const to of dests) {
    const promotes = pos.board.pawn.has(from) && (squareRank(to) === 0 || squareRank(to) === 7);
    if (promotes) for (const promotion of promotionRoles) moves.push(makeUci({ from, to, promotion }));
    else moves.push(makeUci({ from, to }));
  }
  if (pos.pockets) {
    const dropDests = pos.dropDests(ctx);
    const roles: Role[] = ['pawn', 'knight', 'bishop', 'rook', 'queen'];
    for (const role of roles) {
      if (pos.pockets[pos.turn][role] <= 0) continue;
      for (const to of dropDests) moves.push(makeUci({ role, to }));
    }
  }
  return [...new Set(moves)];
}
function pocketsFor(pos: Position) {
  if (!pos.pockets) return null;
  const side = (color: 'white' | 'black') => ({ pawn: pos.pockets![color].pawn, knight: pos.pockets![color].knight, bishop: pos.pockets![color].bishop, rook: pos.pockets![color].rook, queen: pos.pockets![color].queen });
  return { white: side('white'), black: side('black') };
}
function resultFor(pos: Position) {
  const outcome = pos.outcome();
  if (!outcome) return { result: null as string | null, termination: null as string | null };
  return { result: outcome.winner === 'white' ? '1-0' : outcome.winner === 'black' ? '0-1' : '1/2-1/2', termination: `variant:${pos.rules}` };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  const url = Deno.env.get('SUPABASE_URL'); const anon = Deno.env.get('SUPABASE_ANON_KEY'); const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = req.headers.get('Authorization') || req.headers.get('authorization') || '';
  if (!url || !anon || !service || !authorization) return reply({ error: 'Authentication required' }, 401);
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData?.user) return reply({ error: 'Authentication required' }, 401);
  const { data: player } = await admin.from('players').select('id,status,is_synthetic').eq('auth_user_id', authData.user.id).maybeSingle();
  if (!player || player.status !== 'active' || player.is_synthetic) return reply({ error: 'Player profile required' }, 403);
  let body: Record<string, unknown>; try { body = await req.json(); } catch { return reply({ error: 'Invalid request' }, 400); }
  const action = String(body.action ?? '');

  async function checkRateLimit(bucket: string, maxHits: number, windowSeconds: number) {
    const { data, error } = await admin.rpc('v6_consume_rate_limit_server', { p_player_id: player.id, p_bucket: bucket, p_max_hits: maxHits, p_window_seconds: windowSeconds });
    if (error) throw error;
    return Array.isArray(data) ? data[0] ?? null : data;
  }
  const loadGame = async (gameId: string) => {
    const { data: game, error } = await admin.from('v3_variant_games').select('*').eq('id', gameId).maybeSingle();
    if (error || !game) throw new Error('game_not_found');
    if (![game.white_player_id, game.black_player_id].includes(player.id)) throw new Error('game_not_accessible');
    if (!isAdvancedVariant(game.variant)) throw new Error('wrong_variant_engine');
    return game;
  };
  const safeState = async (game: Record<string, any>) => {
    const [{ data: white }, { data: black }] = await Promise.all([
      admin.from('players').select('name').eq('id', game.white_player_id).maybeSingle(),
      admin.from('players').select('name').eq('id', game.black_player_id).maybeSingle(),
    ]);
    const pos = positionFromFen(game.variant as AdvancedVariant, game.fen);
    return { game: { game_id: game.id, variant: game.variant, fen: game.fen, turn: game.turn, ply: game.ply, white_player_id: game.white_player_id, white_name: white?.name || 'الأبيض', black_player_id: game.black_player_id, black_name: black?.name || 'الأسود', my_color: game.white_player_id === player.id ? 'w' : 'b', base_seconds: game.base_seconds, increment_seconds: game.increment_seconds, white_ms: game.white_ms, black_ms: game.black_ms, clock_anchor_at: game.clock_anchor_at, draw_offered_by: game.draw_offered_by, status: game.status, result: game.result, termination: game.termination, rated: game.rated, created_at: game.created_at }, legalMoves: game.status === 'active' ? legalMoves(pos) : [], pockets: pocketsFor(pos), serverNow: new Date().toISOString() };
  };

  if (action === 'queue') {
    const variant = String(body.variant ?? ''); if (!isAdvancedVariant(variant)) return reply({ error: 'Unsupported variant' }, 400);
    const baseSeconds = Math.max(30, Math.min(3600, Number(body.baseSeconds) || 600)); const incrementSeconds = Math.max(0, Math.min(60, Number(body.incrementSeconds) || 0)); const rated = Boolean(body.rated);
    const start = defaultPosition(ruleFor(variant)); const startFen = makeFen(start.toSetup());
    const { data, error } = await admin.rpc('v3_queue_variant_server', { p_player_id: player.id, p_variant: variant, p_base_seconds: baseSeconds, p_increment_seconds: incrementSeconds, p_rated: rated, p_start_index: 0, p_start_fen: startFen });
    if (error) return reply({ error: 'تعذر بدء البحث', code: error.message }, 409);
    const game = Array.isArray(data) ? data[0] ?? null : data;
    if (!game) return reply({ waiting: true, game: null, serverNow: new Date().toISOString() });
    if (!isAdvancedVariant(game.variant)) return reply({ error: 'لديك مباراة نمط أخرى جارية', gameId: game.id }, 409);
    return reply({ waiting: false, ...(await safeState(game)) });
  }
  if (action === 'cancel_queue') {
    const { data, error } = await userClient.rpc('v3_cancel_variant_queue'); if (error) return reply({ error: 'تعذر إلغاء البحث' }, 409); return reply({ cancelled: Boolean(data) });
  }

  const gameId = typeof body.gameId === 'string' ? body.gameId : ''; if (!gameId) return reply({ error: 'Game required' }, 400);
  let game: Record<string, any>; try { game = await loadGame(gameId); } catch (error) { const code = error instanceof Error ? error.message : 'game_not_found'; return reply({ error: code }, code === 'game_not_accessible' ? 403 : 404); }
  if (action === 'state') return reply(await safeState(game));
  if (['resign', 'offer_draw', 'respond_draw', 'timeout'].includes(action)) {
    try { const rate = await checkRateLimit('variant_action', 30, 60); if (rate?.allowed === false) return reply({ error: 'Too many requests', code: 'rate_limited', retryAfterMs: rate.retry_after_ms }, 429); }
    catch (error) { console.error('Variant rate limit failed', error); return reply({ error: 'Rate limit unavailable' }, 503); }
    const { data, error } = await admin.rpc('v3_variant_action_server', { p_game_id: gameId, p_player_id: player.id, p_action: action, p_accept: action === 'respond_draw' ? Boolean(body.accept) : null });
    if (error) return reply({ error: 'تعذر تنفيذ الإجراء', code: error.message }, 409); return reply({ ...(await safeState(data)), serverNow: new Date().toISOString() });
  }
  if (action !== 'move') return reply({ error: 'Unsupported action' }, 400);
  if (game.status !== 'active') return reply({ error: 'Game is not active' }, 409);
  const expectedPly = Number(body.expectedPly); const uci = typeof body.uci === 'string' ? body.uci.trim() : '';
  if (!Number.isInteger(expectedPly) || expectedPly < 0 || game.ply !== expectedPly || !uci) return reply({ error: 'Game state changed', code: 'stale_state' }, 409);
  try { const rate = await checkRateLimit('variant_move', 12, 2); if (rate?.allowed === false) return reply({ error: 'Too many requests', code: 'rate_limited', retryAfterMs: rate.retry_after_ms }, 429); }
  catch (error) { console.error('Variant rate limit failed', error); return reply({ error: 'Rate limit unavailable' }, 503); }
  const mover = game.white_player_id === player.id ? 'w' : 'b'; if (game.turn !== mover) return reply({ error: 'Not your turn' }, 409);

  const now = Date.now(); const elapsed = Math.max(0, now - dateMs(game.clock_anchor_at));
  let whiteMs = Number(game.white_ms), blackMs = Number(game.black_ms); if (mover === 'w') whiteMs = Math.max(0, whiteMs - elapsed); else blackMs = Math.max(0, blackMs - elapsed);
  if ((mover === 'w' ? whiteMs : blackMs) <= 0) { const timed = await admin.rpc('v3_variant_action_server', { p_game_id: gameId, p_player_id: player.id, p_action: 'timeout', p_accept: null }); return reply({ game: timed.data ?? game, error: timed.error ? 'Clock expired' : undefined }, 409); }

  let pos: Position; let move: Move | undefined;
  try { pos = positionFromFen(game.variant as AdvancedVariant, game.fen); move = parseUci(uci); } catch { return reply({ error: 'Invalid authoritative position' }, 500); }
  if (!move || !pos.isLegal(move)) return reply({ error: 'Illegal move', code: 'illegal_move' }, 409);
  const san = makeSan(pos, move); pos.play(move); const newFen = makeFen(pos.toSetup());
  const incrementMs = Number(game.increment_seconds || 0) * 1000; if (mover === 'w') whiteMs += incrementMs; else blackMs += incrementMs;
  const { result, termination } = resultFor(pos); const finalUci = makeUci(move);
  const { data: committed, error: commitError } = await admin.rpc('v4_commit_advanced_variant_move_server', { p_game_id: gameId, p_player_id: player.id, p_expected_ply: expectedPly, p_san: san, p_uci: finalUci, p_fen: newFen, p_next_turn: turnCode(pos.turn), p_white_ms: Math.round(whiteMs), p_black_ms: Math.round(blackMs), p_result: result, p_termination: termination });
  if (commitError) return reply({ error: 'Game state changed', code: commitError.message }, 409);
  const telemetry = await admin.rpc('v6_record_move_event_server', { p_source_type: game.variant, p_game_id: gameId, p_player_id: player.id, p_ply: expectedPly + 1, p_move_uci: finalUci, p_san: san, p_server_move_ms: Math.round(elapsed), p_remaining_ms: Math.round(mover === 'w' ? whiteMs : blackMs), p_rated: Boolean(game.rated) });
  if (telemetry.error) console.error('Fair Play telemetry failed', telemetry.error.message);
  return reply(await safeState(committed));
});
