# Shatranj V2 — Platform Shell + Live Play Foundation Design

Date: 2026-09-12
Status: Approved first implementation program
Parent architecture: `docs/superpowers/specs/2026-09-12-chesscom-parity-v2-design.md`
Product: شطرنج العرب

## 1. Scope correction

There is no currently functioning production human-vs-human live-play system to migrate.

The repository and database contain previous live-play experiments (`play*.html`, `play-live.js`, `public.live_games`, `private.matchmaking_queue`, and related RPCs), but they are legacy/reference material only. They are not the authoritative foundation for Shatranj V2.

This document supersedes any conflicting parent-spec wording that implies a working human live-play flow must remain available during migration.

Existing valid accounts, player profiles, points, tournament data, computer-play data, and other useful production data remain intact.

## 2. Goal

Deliver the first genuinely playable Shatranj V2 human-vs-human experience with a clean platform shell and an isolated, server-authoritative live-play path.

The first playable slice supports standard chess, authenticated players, automatic matchmaking, 5/10/15-minute games, accurate clocks, legal moves, reconnect, resignation, draw offers, the approved five-second grace-end behavior, and read-only spectating.

## 3. Non-goals for this program

This program does not implement Chess960, daily/correspondence chess, clubs, messaging, puzzles, lessons, premium plans, achievements, or advanced anti-cheat. Those remain later programs in the parent architecture.

The first slice is rated standard chess only. Unrated games and custom increments can be added after the authoritative game path is stable.

## 4. Isolation boundary

V2 live play uses new V2-specific tables, RPCs, route files, and service modules. No new V2 client calls old live-play RPCs.

Legacy tables/functions are left untouched so current unrelated features are not destabilized. They may be removed only in a later cleanup after V2 has proven stable.

Primary new surfaces:

- `play-v2.html`
- `v2/play/play.css`
- `v2/play/app.js`
- `v2/play/api.js`
- `v2/play/clock.js`
- `supabase/migrations/20260912_v2_live_play_foundation.sql`
- `supabase/functions/live-game-v2/index.ts`

## 5. Player identity

Supabase Auth remains the login source. A V2 player is resolved by `public.players.auth_user_id = auth.uid()`.

A player must have an authenticated account and an associated active player row to enter matchmaking.

The existing public player identifier, name, location, and points/rating are reused; V2 does not create duplicate player profiles.

## 6. V2 data model

### `public.v2_games`

One row is the authoritative current state of a live game. It stores:

- game id
- white player id
- black player id
- rated flag
- base time in seconds
- increment in seconds (initially zero)
- authoritative FEN
- side to move
- ply/version number
- white remaining milliseconds
- black remaining milliseconds
- authoritative clock anchor timestamp
- status
- result and termination reason
- grace deadline
- draw-offer owner where relevant
- creation/start/finish timestamps

The database enforces different white/black players and valid state enums.

### `public.v2_game_moves`

Append-only move history:

- game id
- ply
- from square
- to square
- promotion
- SAN
- FEN after move
- mover player id
- remaining clocks after move
- created timestamp

`(game_id, ply)` is unique.

### `private.v2_matchmaking_queue`

One current queue row per player:

- player id
- selected base minutes
- rating snapshot
- join/heartbeat timestamps
- status
- matched game id

Queue rows are not directly readable/writable by ordinary clients.

## 7. Matchmaking contract

The public RPC surface is V2-only:

- `start_v2_matchmaking(p_minutes integer)`
- `poll_v2_matchmaking()`
- `cancel_v2_matchmaking()`

Allowed initial time controls are exactly 5, 10, and 15 minutes with zero increment.

Starting matchmaking is idempotent for one player. The database prevents duplicate active queue entries and prevents a player from being assigned to multiple concurrent V2 games.

Matching is atomic. Two waiting players with the same time control are claimed, colors are assigned once, one game row is created, both queue entries reference it, and the function returns game access to the caller.

The client never creates the game directly.

## 8. Authoritative move validation

The browser never supplies a trusted resulting FEN, SAN, result, winner, or clock value.

`supabase/functions/live-game-v2/index.ts` is the chess-rules boundary. For a move request it:

1. Verifies the authenticated user from the bearer token.
2. Loads the current V2 game and identifies the caller's player/color.
3. Rejects inactive games, wrong turns, stale expected ply values, and expired clocks.
4. Reconstructs the position from authoritative FEN using a pinned chess-rules library.
5. Applies `{from,to,promotion}` and rejects illegal moves.
6. Computes new FEN, SAN, side to move, checkmate/stalemate/draw result, and elapsed clock time.
7. Calls a private/server mutation RPC with the expected current ply so the database commit is optimistic-concurrency safe.
8. Returns the committed authoritative state.

The SQL commit RPC validates caller-independent invariants and rejects stale versions. The Edge Function, not the client, computes chess legality.

## 9. Clock model

Clocks are server-authoritative.

The current player's displayed clock is derived from persisted remaining milliseconds minus elapsed server time from the game clock anchor. The client may animate locally but never settles time itself.

Every accepted move atomically deducts elapsed time from the mover, applies increment (zero initially), stores both remaining clocks, flips the turn, and resets the clock anchor.

Timeout resolution is server-owned and idempotent. Reconnecting clients receive current remaining time from authoritative state; clocks never roll backward because of a browser refresh.

The final minute is displayed in red as previously approved.

## 10. Game lifecycle

Statuses:

- `matched`: players paired, five-second grace window active
- `active`: competitive game underway
- `finished`: terminal result settled
- `cancelled`: ended during grace with no rating impact

The five-second orange `إنهاء` control is available during the grace window. Cancelling in this period ends the game without changing points.

After grace expires, leaving the page does not cancel the game. A player may reconnect to the same active game.

Resignation is server-authoritative. Draw offers record which player offered; only the opponent can accept. Decline/withdraw clears the offer.

## 11. Rating settlement

The first V2 slice uses the project's existing single public points/rating field, starting from the player's current value.

Settlement is server-authoritative, exactly once per rated finished game, and records a history row. Grace-cancelled games never settle rating.

The public product continues to say «النقاط».

## 12. Realtime and reconnect

Database state is authoritative. Clients fetch full state on initial load and reconnect.

For the first slice, `public.v2_games` and `public.v2_game_moves` may use Supabase Realtime Postgres Changes. The migration adds only the public V2 tables to `supabase_realtime`; it does not modify the locked `realtime` schema.

Every realtime event is treated as a hint to refetch authoritative state. Missing or duplicated events therefore cannot corrupt the game.

## 13. Spectator model

Spectators receive a read-only public representation of active/finished games with player public identity, board state, clocks, result, and move history.

Spectators have no mutation RPC permissions.

The later Watch program can consume the same V2 public state instead of creating a second game model.

## 14. UI and route behavior

`play-v2.html` is a fresh route and does not inherit legacy play JavaScript.

Visual constraints:

- Arabic RTL first
- retain the approved petrol/turquoise page family
- retain cream/olive board direction and thin dark square separation
- retain approved chess piece assets; do not replace them
- desktop: board with player/clock panel beside it
- mobile: opponent above board and current player below board
- last minute clock red
- player names link to player profiles
- back returns directly to home without an extra confirmation dialog

From the home page, `العب الآن` ultimately routes directly to `play-v2.html?minutes=10&auto=1` (or the selected quick time control). The play page shows the board immediately while matchmaking occupies the opponent area. There is no intermediate matchmaking page.

Searching uses stable sequential dots and must not resize or shift the board/layout.

## 15. Error behavior

User-facing Arabic errors are short and actionable:

- authentication required
- player profile required
- matchmaking unavailable
- opponent search cancelled
- game state could not be refreshed
- move rejected because state changed; automatically refetch
- connection lost; retry/reconnect without creating another game

Repeated requests must be safe and must not create duplicate games, duplicate moves, duplicate results, or duplicate rating settlement.

## 16. Security

- V2 game/move tables use RLS.
- Ordinary clients cannot directly insert/update/delete competitive rows.
- Matchmaking and game mutation are exposed only through narrowly-scoped RPC/Edge Function interfaces.
- No service-role key is shipped to the browser.
- `auth.uid()` is mapped to `players.auth_user_id` server-side.
- Synthetic players cannot enter human matchmaking.
- Client-provided results, ratings, FEN, SAN, clock values, and player ids are never trusted for competitive mutations.

## 17. Acceptance criteria

The first program is complete when:

1. Two authenticated real players can enter the same 5/10/15-minute queue and receive exactly one V2 game.
2. Colors are assigned once and remain stable on refresh.
3. Illegal moves are rejected server-side.
4. Legal moves update FEN, move history, turn, and clocks atomically.
5. Refresh/reconnect returns the same game and a monotonic clock.
6. Timeout, checkmate, stalemate/draw, resignation, and accepted draw finish only once.
7. Five-second grace cancellation causes no points change.
8. A rated finished game changes points exactly once.
9. A spectator can view but cannot mutate the game.
10. Desktop and mobile use the approved board/piece visual identity.
11. The home Play action switches to V2 only after the new tests and database verification pass.

## 18. Rollout

Implementation remains additive until verification passes. The legacy play files and functions remain in place but are not called by the new V2 route.

The public home route is cut over to V2 only at the end of this program, after backend, move legality, clocks, reconnect, and UI tests pass.