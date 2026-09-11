# Shatranj V2 Shell + Live Play Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first real Shatranj V2 human-vs-human live chess path with an isolated route, atomic matchmaking, server-authoritative chess legality and clocks, reconnect, grace-end, draw/resign, points settlement, and read-only spectating.

**Architecture:** Keep existing accounts/profiles/points and unrelated production data, but do not reuse legacy human-live-play tables or RPCs as the V2 authority. V2 gets new tables/RPCs, a dedicated Edge Function using pinned `chess.js@1.4.0`, and new frontend modules under `v2/play/`; database state is authoritative and realtime events only trigger refetches.

**Tech Stack:** GitHub Pages static HTML/CSS/ES modules, Supabase Auth/Postgres/RLS/RPC/Realtime/Edge Functions, Deno, `chess.js@1.4.0`, Python repository contract tests, Node built-in test runner for pure JS clock/state modules.

**Spec:** `docs/superpowers/specs/2026-09-12-v2-shell-live-play-foundation-design.md`

## Global Constraints

- There is no functioning production human-vs-human play path to preserve; legacy play files/functions are reference only.
- Preserve existing valid Supabase Auth users and `public.players` rows.
- Preserve the public term «النقاط».
- Standard chess only in this program.
- Initial time controls are exactly 5, 10, and 15 minutes with zero increment.
- Initial V2 games are rated.
- Browser input must never be authoritative for FEN, SAN, result, player id, rating, or clock values.
- Keep the approved petrol/turquoise page family, cream/olive board direction, thin dark square separation, and approved piece assets.
- Do not replace approved chess piece assets.
- Desktop uses board plus side player/clock panel; mobile places opponent above the board and current player below.
- Final-minute clocks display red.
- Five-second orange `إنهاء` grace action cancels without points impact.
- Realtime events are hints; every client can recover by refetching authoritative state.
- Do not modify the Supabase `realtime` schema. Only add public V2 tables to the `supabase_realtime` publication when needed.
- Do not ship a Supabase service-role key to the browser.
- Do not cut the home Play route over to V2 until Tasks 1–8 pass verification.

---

### Task 1: Add V2 route contract and static play shell

**Files:**
- Create: `play-v2.html`
- Create: `v2/play/play.css`
- Create: `v2/play/app.js`
- Create: `tests/test_v2_play_shell.py`

**Interfaces:**
- Consumes: existing `config.js`, `config-base.js`, approved assets under `assets/pieces/`.
- Produces: stable DOM ids `v2-board`, `v2-opponent`, `v2-player`, `v2-search-status`, `v2-clock-white`, `v2-clock-black`, `v2-grace-end`, `v2-resign`, `v2-draw`, and ES-module entry `v2/play/app.js`.

- [ ] **Step 1: Write the failing shell contract test**

```python
from pathlib import Path

root = Path(__file__).resolve().parents[1]
html = (root / 'play-v2.html').read_text(encoding='utf-8') if (root / 'play-v2.html').exists() else ''
css = (root / 'v2/play/play.css').read_text(encoding='utf-8') if (root / 'v2/play/play.css').exists() else ''
js = (root / 'v2/play/app.js').read_text(encoding='utf-8') if (root / 'v2/play/app.js').exists() else ''

assert '<html lang="ar" dir="rtl">' in html
for token in ['v2-board','v2-opponent','v2-player','v2-search-status','v2-clock-white','v2-clock-black','v2-grace-end','v2-resign','v2-draw']:
    assert token in html, token
assert 'v2/play/play.css' in html
assert 'type="module"' in html and 'v2/play/app.js' in html
assert 'assets/pieces/' in js
assert '--v2-petrol' in css
assert '--v2-light-square' in css
assert '--v2-dark-square' in css
assert '@media (max-width: 760px)' in css
print('V2 play shell: PASS')
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `python tests/test_v2_play_shell.py`

Expected: failure because `play-v2.html` and V2 assets do not exist.

- [ ] **Step 3: Create the minimal stable shell**

`play-v2.html` must load existing Supabase config before the module and contain the required fixed containers. `v2/play/play.css` must define the approved petrol/cream/olive design tokens and mobile stack. `v2/play/app.js` initially renders the approved starting piece assets into an 8x8 board without calling any legacy play module.

- [ ] **Step 4: Run the shell test**

Run: `python tests/test_v2_play_shell.py`

Expected: `V2 play shell: PASS`.

- [ ] **Step 5: Commit**

```bash
git add play-v2.html v2/play/play.css v2/play/app.js tests/test_v2_play_shell.py
git commit -m "feat: add isolated V2 play shell"
```

### Task 2: Create isolated V2 database foundation

**Files:**
- Create: `supabase/migrations/20260912_v2_live_play_foundation.sql`
- Create: `tests/test_v2_live_schema.py`

**Interfaces:**
- Consumes: `public.players(id, auth_user_id, rating, status, is_synthetic)`.
- Produces: `public.v2_games`, `public.v2_game_moves`, `private.v2_matchmaking_queue`, `private.v2_rating_history`; RPCs `start_v2_matchmaking(integer)`, `poll_v2_matchmaking()`, `cancel_v2_matchmaking()`, `get_v2_game_state(uuid)`, `get_v2_game_moves(uuid)`, plus private commit helpers.

- [ ] **Step 1: Write the failing schema contract test**

```python
from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / 'supabase/migrations/20260912_v2_live_play_foundation.sql'
sql = path.read_text(encoding='utf-8') if path.exists() else ''

for token in [
    'create table public.v2_games',
    'create table public.v2_game_moves',
    'create table private.v2_matchmaking_queue',
    'create table private.v2_rating_history',
    'create or replace function public.start_v2_matchmaking',
    'create or replace function public.poll_v2_matchmaking',
    'create or replace function public.cancel_v2_matchmaking',
    'create or replace function public.get_v2_game_state',
    'create or replace function private.commit_v2_move',
    'enable row level security',
    'supabase_realtime',
]:
    assert token in sql.lower(), token

assert 'auth.uid()' in sql
assert "array[5,10,15]" in sql.replace(' ', '') or 'array[5, 10, 15]' in sql
assert 'is_synthetic' in sql
assert 'service_role' not in sql.lower()
print('V2 live schema contract: PASS')
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `python tests/test_v2_live_schema.py`

Expected: failure because the migration does not exist.

- [ ] **Step 3: Implement additive V2 schema and RLS**

The migration must create:

```sql
create table public.v2_games (
  id uuid primary key default gen_random_uuid(),
  white_player_id uuid not null references public.players(id),
  black_player_id uuid not null references public.players(id),
  rated boolean not null default true,
  base_seconds integer not null check (base_seconds in (300,600,900)),
  increment_seconds integer not null default 0 check (increment_seconds = 0),
  fen text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn text not null default 'w' check (turn in ('w','b')),
  ply integer not null default 0 check (ply >= 0),
  white_ms bigint not null,
  black_ms bigint not null,
  clock_anchor_at timestamptz,
  status text not null default 'matched' check (status in ('matched','active','finished','cancelled')),
  result text check (result in ('1-0','0-1','1/2-1/2') or result is null),
  termination text,
  grace_until timestamptz not null,
  draw_offered_by uuid references public.players(id),
  rating_settled boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  started_at timestamptz,
  finished_at timestamptz,
  check (white_player_id <> black_player_id)
);
```

`v2_game_moves` is append-only with unique `(game_id, ply)`. `private.v2_matchmaking_queue` has `player_id` primary key, selected minutes, rating snapshot, timestamps, queue status and matched game. `private.v2_rating_history` has one row per player/game and unique `(game_id, player_id)`.

Enable RLS on both public tables. Authenticated participants may select their own games; public spectator reads go through explicit RPCs. Direct inserts/updates/deletes from `anon` and `authenticated` are revoked.

- [ ] **Step 4: Implement atomic matchmaking RPCs**

`start_v2_matchmaking` must resolve the caller by `auth.uid()`, reject missing/inactive/synthetic players, reject unsupported minutes, return an existing unfinished V2 game if one already exists, upsert one queue row, lock a compatible waiting opponent with `FOR UPDATE SKIP LOCKED`, create exactly one game, and mark both queue rows matched in the same transaction.

Return shape:

```sql
returns table (
  queue_status text,
  game_id uuid,
  color text,
  opponent_player_id uuid,
  base_seconds integer,
  grace_until timestamptz
)
```

- [ ] **Step 5: Implement participant state RPCs and private commit helper**

`public.get_v2_game_state(uuid)` returns only authoritative fields and public player presentation. `private.commit_v2_move(...)` accepts server-computed FEN/SAN/result/clocks plus `p_expected_ply`; it locks the game row and only commits when the expected ply, turn, status, and mover match the current row.

- [ ] **Step 6: Add publication membership idempotently**

Use a guarded `DO $$` block to add `public.v2_games` and `public.v2_game_moves` to publication `supabase_realtime` only if they are not already members. Do not alter the `realtime` schema.

- [ ] **Step 7: Run schema contract test**

Run: `python tests/test_v2_live_schema.py`

Expected: PASS.

- [ ] **Step 8: Apply the same migration with Supabase migration tooling**

Apply the complete file as migration name `v2_live_play_foundation` to project `zjxkxhsvltihucdacjrv` using `apply_migration`, then verify table/function existence with read-only SQL.

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/20260912_v2_live_play_foundation.sql tests/test_v2_live_schema.py
git commit -m "feat: add V2 live play database foundation"
```

### Task 3: Add server-authoritative chess move Edge Function

**Files:**
- Create: `supabase/functions/live-game-v2/index.ts`
- Create: `supabase/functions/live-game-v2/deno.json`
- Create: `tests/test_v2_edge_function.py`

**Interfaces:**
- Consumes: authenticated bearer token, `public.get_v2_game_state`, private/server `commit_v2_move`, `chess.js@1.4.0`.
- Produces: `POST /functions/v1/live-game-v2` action `move` with request `{action:"move", gameId:string, expectedPly:number, from:string, to:string, promotion?:string}` and response `{game: AuthoritativeGameState}`.

- [ ] **Step 1: Write failing Edge Function contract test**

```python
from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / 'supabase/functions/live-game-v2/index.ts'
text = path.read_text(encoding='utf-8') if path.exists() else ''

for token in [
    'npm:chess.js@1.4.0',
    'authorization',
    'auth.getUser',
    'expectedPly',
    'new Chess(',
    '.move(',
    'commit_v2_move',
]:
    assert token.lower() in text.lower(), token

for forbidden in ['p_new_fen', 'p_san', 'p_result']:
    assert forbidden not in text, forbidden
print('V2 Edge Function contract: PASS')
```

- [ ] **Step 2: Run and verify failure**

Run: `python tests/test_v2_edge_function.py`

Expected: failure because the Edge Function is absent.

- [ ] **Step 3: Implement authentication and participant resolution**

Use the request bearer token to create a user-scoped Supabase client and call `auth.getUser()`. Reject 401 if missing/invalid. Load the game state and reject callers who are not white or black.

- [ ] **Step 4: Implement move validation with chess.js**

Pin:

```ts
import { Chess } from "npm:chess.js@1.4.0";
```

Create `const chess = new Chess(game.fen)`, verify caller color equals `chess.turn()`, call `chess.move({ from, to, promotion })` inside a try/catch, and reject illegal moves with HTTP 409. Compute FEN, SAN, next turn, checkmate/stalemate/insufficient-material/threefold/fifty-move terminal state using chess.js APIs.

- [ ] **Step 5: Compute monotonic authoritative clocks**

Use persisted remaining milliseconds and `clock_anchor_at`; compute elapsed using server time, never client time. If remaining time is <=0, call the timeout settlement path instead of committing the move.

- [ ] **Step 6: Commit using expected ply**

Call the server-only commit RPC with `expectedPly`. A stale response returns 409 so the browser refetches instead of replaying against stale state.

- [ ] **Step 7: Run contract test**

Run: `python tests/test_v2_edge_function.py`

Expected: PASS.

- [ ] **Step 8: Deploy Edge Function using Supabase tooling and smoke-test unauthenticated 401 behavior**

Deploy `live-game-v2`; then invoke without a bearer token and confirm HTTP 401/auth-required behavior.

- [ ] **Step 9: Commit**

```bash
git add supabase/functions/live-game-v2 tests/test_v2_edge_function.py
git commit -m "feat: validate V2 moves server side"
```

### Task 4: Add pure client clock/state modules

**Files:**
- Create: `v2/play/clock.mjs`
- Create: `v2/play/state.mjs`
- Create: `tests/v2-play-clock.test.mjs`

**Interfaces:**
- Produces: `remainingAt(state, nowMs)`, `formatClock(ms)`, `isFinalMinute(ms)`, `sameVersion(a,b)`.

- [ ] **Step 1: Write failing Node tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { remainingAt, formatClock, isFinalMinute } from '../v2/play/clock.mjs';

test('active side decreases while waiting side is stable', () => {
  const state = { status:'active', turn:'w', white_ms:600000, black_ms:600000, clock_anchor_ms:1000000 };
  assert.equal(remainingAt(state, 1002500).white, 597500);
  assert.equal(remainingAt(state, 1002500).black, 600000);
});

test('clock never renders below zero', () => {
  const state = { status:'active', turn:'w', white_ms:1000, black_ms:1000, clock_anchor_ms:0 };
  assert.equal(remainingAt(state, 5000).white, 0);
});

test('final minute begins below sixty seconds', () => {
  assert.equal(isFinalMinute(59999), true);
  assert.equal(isFinalMinute(60000), false);
});

test('formats mm:ss', () => assert.equal(formatClock(305000), '05:05'));
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/v2-play-clock.test.mjs`

Expected: module-not-found failure.

- [ ] **Step 3: Implement pure clock/state helpers**

`remainingAt` clamps to zero and subtracts elapsed only from the active side. No helper mutates server state or invents a result.

- [ ] **Step 4: Run Node tests**

Run: `node --test tests/v2-play-clock.test.mjs`

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add v2/play/clock.mjs v2/play/state.mjs tests/v2-play-clock.test.mjs
git commit -m "feat: add V2 client clock state helpers"
```

### Task 5: Add V2 Supabase API client and reconnect contract

**Files:**
- Create: `v2/play/api.js`
- Create: `tests/test_v2_play_api.py`

**Interfaces:**
- Produces: `startMatchmaking(minutes)`, `pollMatchmaking()`, `cancelMatchmaking()`, `getGameState(gameId)`, `getGameMoves(gameId)`, `submitMove(input)`, `resignGame(gameId)`, `offerDraw(gameId)`, `respondDraw(gameId, accept)`, `graceEnd(gameId)`, `subscribeGame(gameId,onHint)`.

- [ ] **Step 1: Write failing API contract test**

```python
from pathlib import Path
text = Path('v2/play/api.js').read_text(encoding='utf-8') if Path('v2/play/api.js').exists() else ''
for token in [
  'start_v2_matchmaking','poll_v2_matchmaking','cancel_v2_matchmaking',
  'get_v2_game_state','get_v2_game_moves','live-game-v2',
  'subscribeGame','v2_games','v2_game_moves'
]:
    assert token in text, token
assert 'service_role' not in text.lower()
print('V2 play API: PASS')
```

- [ ] **Step 2: Run and verify failure**

Run: `python tests/test_v2_play_api.py`

Expected: failure because API module is absent.

- [ ] **Step 3: Implement API wrapper only against V2 endpoints**

Use `window.supabaseClient`/project-standard client from existing config. No function in this module may call `start_matchmaking`, `submit_live_move`, `live_games`, or other legacy human-play APIs.

- [ ] **Step 4: Implement realtime as refetch hint**

Subscribe to row changes filtered by `id=eq.${gameId}` for `v2_games` and by `game_id=eq.${gameId}` for `v2_game_moves`. The callback only signals the app to call `getGameState`/`getGameMoves` again.

- [ ] **Step 5: Run contract test**

Run: `python tests/test_v2_play_api.py`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add v2/play/api.js tests/test_v2_play_api.py
git commit -m "feat: add V2 live play API client"
```

### Task 6: Implement matchmaking-to-board lifecycle UI

**Files:**
- Modify: `v2/play/app.js`
- Modify: `v2/play/play.css`
- Modify: `play-v2.html`
- Create: `tests/test_v2_matchmaking_ui.py`

**Interfaces:**
- Consumes: Task 5 API functions and Task 4 clock helpers.
- Produces: immediate board/search screen, auto search from `?auto=1&minutes=10`, stable searching dots, player/clock render, reconnect to game from `?game=<uuid>`.

- [ ] **Step 1: Write failing UI contract test**

The test asserts that app code parses `minutes`, only accepts 5/10/15, recognizes `auto=1`, calls `startMatchmaking`, polls without creating duplicate searches, renders `جاري البحث`, and never imports a legacy play script.

- [ ] **Step 2: Run and verify failure**

Run: `python tests/test_v2_matchmaking_ui.py`

Expected: FAIL.

- [ ] **Step 3: Implement immediate board and auto-search**

On authenticated load:

```js
const qs = new URLSearchParams(location.search);
const minutes = [5,10,15].includes(Number(qs.get('minutes'))) ? Number(qs.get('minutes')) : 10;
const auto = qs.get('auto') === '1';
```

Render the board before any network request. If `auto`, start exactly one matchmaking request and poll until matched. Keep the search indicator inside a fixed-height opponent panel so dots do not shift layout.

- [ ] **Step 4: Implement game/reconnect render**

When matched, replace the search content with opponent public identity, keep board dimensions unchanged, put current user in the lower/mobile player row, orient board to the caller's assigned color, start local clock display from authoritative values, and subscribe/refetch.

- [ ] **Step 5: Run UI contract and clock tests**

Run:

```bash
python tests/test_v2_matchmaking_ui.py
node --test tests/v2-play-clock.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add play-v2.html v2/play/app.js v2/play/play.css tests/test_v2_matchmaking_ui.py
git commit -m "feat: connect V2 matchmaking to live board"
```

### Task 7: Add competitive lifecycle actions and points settlement

**Files:**
- Modify: `supabase/migrations/20260912_v2_live_play_foundation.sql` only if still unapplied; otherwise create follow-up migration `supabase/migrations/20260912_v2_live_actions.sql`
- Modify: `supabase/functions/live-game-v2/index.ts`
- Modify: `v2/play/api.js`
- Modify: `v2/play/app.js`
- Create: `tests/test_v2_live_actions.py`

**Interfaces:**
- Produces: server actions `grace_end`, `resign`, `offer_draw`, `respond_draw`, `timeout`; exactly-once `private.settle_v2_rating(game_id)`.

- [ ] **Step 1: Write failing action contract test**

Assert source/migration includes the five action names, five-second grace enforcement using server time, draw-offer owner, `rating_settled`, unique rating history, and no client-provided rating delta.

- [ ] **Step 2: Run and verify failure**

Run: `python tests/test_v2_live_actions.py`

Expected: FAIL.

- [ ] **Step 3: Implement five-second grace end**

Server accepts grace cancellation only when `clock_timestamp() <= grace_until` and caller is a participant. Transition `matched -> cancelled`; set finish metadata; never call rating settlement.

- [ ] **Step 4: Implement activation and resignation**

First accepted legal move transitions `matched -> active` if grace has expired or explicitly preserves the grace deadline while the move is allowed; define one behavior and test it consistently. For this program, **the first legal move immediately ends grace and transitions to `active`**, preventing later no-penalty exit. Resignation sets opponent result and settles once.

- [ ] **Step 5: Implement draw offer/accept/decline**

Only one active offer exists. The offering player cannot accept their own offer. Accepting finishes `1/2-1/2`; declining clears the offer.

- [ ] **Step 6: Implement exactly-once rating settlement**

Use a locked game row plus `rating_settled=false` guard. Initial rule follows the current product decision: winner `+10`, loser `-10`, draw `0`, clamped to a sensible non-negative floor. Update `players.rating`, game counts/wins/draws/losses, write two `private.v2_rating_history` rows, then set `rating_settled=true` in the same transaction.

- [ ] **Step 7: Implement timeout settlement**

Server computes timeout from authoritative clock anchor. Repeated timeout requests return the already-finished state without a second rating change.

- [ ] **Step 8: Wire UI buttons**

Grace button is orange and shows remaining whole seconds, disappears at expiry or first move. Resign and draw call V2 server actions and then refetch.

- [ ] **Step 9: Run action tests and prior tests**

Run:

```bash
python tests/test_v2_live_actions.py
python tests/test_v2_play_api.py
node --test tests/v2-play-clock.test.mjs
```

Expected: PASS.

- [ ] **Step 10: Apply follow-up migration if required and deploy updated Edge Function**

Use Supabase migration/deploy tools; verify action RPC/function signatures with read-only SQL.

- [ ] **Step 11: Commit**

```bash
git add supabase/migrations supabase/functions/live-game-v2 v2/play/api.js v2/play/app.js tests/test_v2_live_actions.py
git commit -m "feat: add V2 game lifecycle and points settlement"
```

### Task 8: Add spectator read model and security regression checks

**Files:**
- Create or modify migration: `supabase/migrations/20260912_v2_live_spectator.sql`
- Create: `tests/test_v2_spectator_security.py`

**Interfaces:**
- Produces: `public.get_v2_spectator_game(uuid)` and `public.get_v2_spectator_moves(uuid)` with no mutation capability.

- [ ] **Step 1: Write failing security contract test**

Assert spectator RPCs exist, mutation privileges are revoked from anon/authenticated table writes, participant-only state RPC uses `auth.uid()`, and spectator output does not expose private auth ids/mobile/email/seat secrets.

- [ ] **Step 2: Run and verify failure**

Run: `python tests/test_v2_spectator_security.py`

Expected: FAIL.

- [ ] **Step 3: Implement public read-only spectator RPCs**

Return game id, public player ids/names/country/city where already public, ratings, FEN, turn, authoritative clocks/anchor, status/result/termination, and move list. No direct write grants.

- [ ] **Step 4: Apply migration and verify permissions**

Use Supabase migration tooling, then query `information_schema`/`pg_proc`/ACL metadata to confirm RPCs exist and ordinary roles lack table write privileges.

- [ ] **Step 5: Run security test**

Run: `python tests/test_v2_spectator_security.py`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260912_v2_live_spectator.sql tests/test_v2_spectator_security.py
git commit -m "feat: add read-only V2 spectator model"
```

### Task 9: Cut the home Play entry to V2 only after verification

**Files:**
- Modify: `index-app.html`
- Modify only where necessary: `index.html`, `profile.html`, `profile.js`, `profile-section.js`, `site-notifications.js`
- Create: `tests/test_v2_play_cutover.py`

**Interfaces:**
- Produces: primary home `العب الآن` route to `play-v2.html?minutes=10&auto=1`; quick-control routes use 5/10/15; legacy routes remain files but are no longer primary human-play entry points.

- [ ] **Step 1: Write failing cutover test**

Test must assert the main signed-in Play action points to V2 auto-search, old human-play routes are not used by the primary home CTA, and computer-play routes remain unchanged.

- [ ] **Step 2: Run and verify failure**

Run: `python tests/test_v2_play_cutover.py`

Expected: FAIL before cutover.

- [ ] **Step 3: Update only human-play entry links**

Use:

```text
play-v2.html?minutes=10&auto=1
```

for the default main action, and corresponding 5/15 minute query values for quick controls. Do not redirect computer play to V2 human matchmaking.

- [ ] **Step 4: Run V2 and relevant home regression tests**

Run:

```bash
python tests/test_v2_play_cutover.py
python tests/test_v2_play_shell.py
python tests/test_v2_matchmaking_ui.py
python tests/test_home_computer_button_label.py
python tests/test_arab_identity.py
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index-app.html index.html profile.html profile.js profile-section.js site-notifications.js tests/test_v2_play_cutover.py
git commit -m "feat: route human play to Shatranj V2"
```

### Task 10: Final verification and release evidence

**Files:**
- Create: `docs/v2-live-play-verification.md`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: reproducible verification record with commit SHAs, database migration versions, Edge Function deployment status, and test outputs.

- [ ] **Step 1: Run all V2 repository tests**

```bash
python tests/test_v2_play_shell.py
python tests/test_v2_live_schema.py
python tests/test_v2_edge_function.py
node --test tests/v2-play-clock.test.mjs
python tests/test_v2_play_api.py
python tests/test_v2_matchmaking_ui.py
python tests/test_v2_live_actions.py
python tests/test_v2_spectator_security.py
python tests/test_v2_play_cutover.py
```

Expected: all PASS.

- [ ] **Step 2: Run critical existing regressions**

```bash
python tests/test_arab_identity.py
python tests/test_arab_schema.py
python tests/test_home_computer_button_label.py
python tests/test_player_profile_links.py
python tests/test_tournament_start_engine.py
node --test tests/spectator-clock.test.mjs
```

Expected: all PASS. If a legacy test explicitly requires the old human-play route, classify it as superseded only when the new cutover test covers the same user outcome; do not silently ignore unrelated failures.

- [ ] **Step 3: Verify production database objects**

Read-only checks must confirm:

- V2 tables exist.
- RLS is enabled.
- required RPCs exist.
- V2 games/moves are in `supabase_realtime` publication.
- no ordinary role has direct competitive row mutation grants.

- [ ] **Step 4: Perform two-account live smoke test**

With two authenticated non-synthetic test accounts:

1. Start the same time control.
2. Confirm exactly one game id.
3. Confirm opposite stable colors.
4. Make one legal move and reject one illegal move.
5. Refresh both browsers and confirm same state/clock direction.
6. Test grace cancel on a separate new game and confirm ratings unchanged.
7. Finish a rated game and confirm `+10/-10` only once.
8. Open spectator read and confirm mutation is impossible.

- [ ] **Step 5: Record evidence**

Create `docs/v2-live-play-verification.md` containing exact commands run, PASS outputs, migration versions, deployed function name, and smoke-test results. Do not claim a check passed unless it was actually executed.

- [ ] **Step 6: Commit**

```bash
git add docs/v2-live-play-verification.md
git commit -m "docs: record V2 live play verification"
```
