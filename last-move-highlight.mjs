const COMPUTER_REQUEST_TIMEOUT_MS = 4500;
const COMPUTER_STATE_REQUEST_TIMEOUT_MS = 2500;
const COMPUTER_STATE_POLL_MS = 550;
const COMPUTER_STATE_ATTEMPTS = 7;
const COMPUTER_NETWORK_GUARD_KEY = '__shatranjComputerGameNetworkGuardV1';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withFiniteTimeout(promise, ms, label = 'computer request') {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timeout`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function computerGameUrl(input) {
  try {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.href;
    if (input && typeof input.url === 'string') return input.url;
  } catch (_error) {
    return '';
  }
  return '';
}

function isComputerGameEndpoint(url) {
  return /\/functions\/v1\/computer-game(?:[/?#]|$)/.test(String(url || ''));
}

async function requestPayload(input, init) {
  const body = init?.body;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (_error) {
      return null;
    }
  }
  try {
    if (typeof Request === 'function' && input instanceof Request) {
      const text = await input.clone().text();
      return text ? JSON.parse(text) : null;
    }
  } catch (_error) {
    return null;
  }
  return null;
}

function copyRequestHeaders(input, init) {
  const headers = new Headers();
  try {
    if (typeof Request === 'function' && input instanceof Request) {
      input.headers.forEach((value, key) => headers.set(key, value));
    }
  } catch (_error) {
    // Keep any headers supplied in init even if Request inspection fails.
  }
  try {
    new Headers(init?.headers || {}).forEach((value, key) => headers.set(key, value));
  } catch (_error) {
    // Ignore malformed optional headers; the primary request remains untouched.
  }
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  return headers;
}

async function watchComputerMoveState(originalFetch, url, headers, gameId, moveId) {
  await sleep(450);
  for (let attempt = 0; attempt < COMPUTER_STATE_ATTEMPTS; attempt += 1) {
    try {
      const stateResponse = await withFiniteTimeout(
        originalFetch(url, {
          method: 'POST',
          headers,
          cache: 'no-store',
          body: JSON.stringify({ action: 'state', game_id: gameId })
        }),
        COMPUTER_STATE_REQUEST_TIMEOUT_MS,
        'computer recovery state'
      );
      if (stateResponse?.ok) {
        const data = await stateResponse.clone().json().catch(() => null);
        if (data?.last_player_request_id === moveId) {
          return stateResponse;
        }
      }
    } catch (_error) {
      // A single failed poll is not fatal; the next poll may recover the saved move.
    }
    if (attempt + 1 < COMPUTER_STATE_ATTEMPTS) await sleep(COMPUTER_STATE_POLL_MS);
  }
  throw new Error('computer move recovery timeout');
}

export function installComputerGameNetworkGuard() {
  if (typeof globalThis.fetch !== 'function') return false;
  if (globalThis[COMPUTER_NETWORK_GUARD_KEY]) return true;

  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis[COMPUTER_NETWORK_GUARD_KEY] = true;

  globalThis.fetch = async function guardedComputerFetch(input, init = undefined) {
    const url = computerGameUrl(input);
    if (!isComputerGameEndpoint(url)) return originalFetch(input, init);

    const payload = await requestPayload(input, init);
    const action = String(payload?.action || '');
    const primary = withFiniteTimeout(
      originalFetch(input, init),
      COMPUTER_REQUEST_TIMEOUT_MS,
      `computer ${action || 'request'}`
    );

    if (action === 'move' && payload?.game_id && payload?.move_id) {
      const headers = copyRequestHeaders(input, init);
      const watchdog = watchComputerMoveState(
        originalFetch,
        url,
        headers,
        String(payload.game_id),
        String(payload.move_id)
      );
      return Promise.race([primary, watchdog]);
    }

    return primary;
  };
  return true;
}

installComputerGameNetworkGuard();

export function fenPositionKey(fen) {
  return String(fen || '').trim().split(/\s+/).slice(0, 3).join(' ');
}

export function latestMoveFromServerMoves(moves) {
  if (!Array.isArray(moves) || moves.length === 0) return null;
  const move = moves[moves.length - 1];
  const isSquare = (value) => /^[a-h][1-8]$/.test(String(value || ''));
  if (!isSquare(move?.from) || !isSquare(move?.to)) return null;
  return { from: move.from, to: move.to };
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
