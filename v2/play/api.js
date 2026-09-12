let cachedClient = null;

function config() {
  const value = window.SHATRANJ_CONFIG?.supabase;
  if (!value?.enabled || !value?.url || !value?.anonKey) {
    throw new Error('إعدادات الاتصال غير مكتملة');
  }
  return value;
}

export function supabaseClient() {
  if (cachedClient) return cachedClient;
  if (!window.supabase?.createClient) throw new Error('تعذر تحميل خدمة الاتصال');
  const value = config();
  cachedClient = window.supabase.createClient(value.url, value.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return cachedClient;
}

function firstRow(data) {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

function throwIfError(error, fallback) {
  if (!error) return;
  const message = error.message || fallback;
  const wrapped = new Error(message);
  wrapped.cause = error;
  throw wrapped;
}

export async function getSession() {
  const { data, error } = await supabaseClient().auth.getSession();
  throwIfError(error, 'تعذر التحقق من تسجيل الدخول');
  return data?.session ?? null;
}

export async function getCurrentPlayer() {
  const client = supabaseClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  throwIfError(authError, 'تعذر التحقق من تسجيل الدخول');
  const user = authData?.user;
  if (!user) return null;
  const { data, error } = await client
    .from('players')
    .select('id,name,rating,country,city,status,is_synthetic,auth_user_id')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  throwIfError(error, 'تعذر تحميل بيانات اللاعب');
  return data ?? null;
}

export async function startMatchmaking(minutes) {
  const { data, error } = await supabaseClient().rpc('start_v2_matchmaking', { p_minutes: Number(minutes) });
  throwIfError(error, 'تعذر بدء البحث');
  return firstRow(data);
}

export async function pollMatchmaking() {
  const { data, error } = await supabaseClient().rpc('poll_v2_matchmaking');
  throwIfError(error, 'تعذر متابعة البحث');
  return firstRow(data);
}

export async function cancelMatchmaking() {
  const { data, error } = await supabaseClient().rpc('cancel_v2_matchmaking');
  throwIfError(error, 'تعذر إلغاء البحث');
  return Boolean(data);
}

export async function getGameState(gameId) {
  const { data, error } = await supabaseClient().rpc('get_v2_game_state', { p_game_id: gameId });
  throwIfError(error, 'تعذر تحميل المباراة');
  return firstRow(data);
}

export async function getGameMoves(gameId) {
  const { data, error } = await supabaseClient().rpc('get_v2_game_moves', { p_game_id: gameId });
  throwIfError(error, 'تعذر تحميل النقلات');
  return Array.isArray(data) ? data : [];
}

async function invokeGameAction(body) {
  const { data, error } = await supabaseClient().functions.invoke('live-game-v2', { body });
  throwIfError(error, 'تعذر تنفيذ الإجراء');
  if (data?.error) {
    const wrapped = new Error(data.error);
    wrapped.code = data.code;
    throw wrapped;
  }
  return data;
}

export async function submitMove({ gameId, expectedPly, from, to, promotion = null }) {
  return invokeGameAction({ action: 'move', gameId, expectedPly, from, to, promotion });
}

export async function resignGame(gameId) {
  return invokeGameAction({ action: 'resign', gameId });
}

export async function offerDraw(gameId) {
  return invokeGameAction({ action: 'offer_draw', gameId });
}

export async function respondDraw(gameId, accept) {
  return invokeGameAction({ action: 'respond_draw', gameId, accept: Boolean(accept) });
}

export async function graceEnd(gameId) {
  return invokeGameAction({ action: 'grace_end', gameId });
}

export async function timeoutGame(gameId) {
  return invokeGameAction({ action: 'timeout', gameId });
}

export function subscribeGame(gameId, onHint) {
  const client = supabaseClient();
  const channel = client
    .channel(`v2-game:${gameId}:${crypto.randomUUID()}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'v2_games',
      filter: `id=eq.${gameId}`,
    }, () => onHint?.('game'))
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'v2_game_moves',
      filter: `game_id=eq.${gameId}`,
    }, () => onHint?.('move'))
    .subscribe();

  return () => client.removeChannel(channel);
}
