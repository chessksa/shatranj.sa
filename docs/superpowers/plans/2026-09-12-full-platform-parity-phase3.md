# Shatranj Full Platform Parity Phase 3 Implementation Plan

**Goal:** Close the remaining functional gaps after Phase 2 without destabilizing V2 live play or the existing tournament engine.

**Scope:** playable Chess960, Puzzle Battle, Arena/Swiss tournament upgrades, deeper Game Review, achievements/streaks, moderation/admin integration, and final homepage/navigation integration. Preserve the current petrol/turquoise/gold site identity and approved board/piece assets.

## Architecture rules

- Extend existing V2 modules; do not replace working live play, Daily, puzzles, social, clubs, stats, or tournaments blindly.
- Competitive state is server-authoritative. Clients may render optimistically only where correctness is unaffected.
- New tables and RPCs use RLS, ownership checks, idempotency, and explicit execution grants.
- No unsupported variant is shown as playable. Chess960 ships first with complete legal castling rules; other variants remain disabled until a verified rules engine exists.
- Reuse the existing tournament engine and data. Arena/Swiss are format layers, not a second unrelated tournament product.
- Game Review uses our own evaluation thresholds and accuracy model; do not copy proprietary formulas.
- Every migration is followed by security-advisor review and SQL smoke checks.

## Task 1 — Baseline and schema inspection

**Inspect:** current tournament, puzzle, achievement, report, live-game and profile tables/RPCs.

**Tests:** add `tests/test_full_platform_phase3_schema.py` describing required Phase 3 contracts before migrations are written.

## Task 2 — Chess960 server-authoritative play

**Files:**
- `supabase/migrations/20260912_full_platform_phase3_variants.sql`
- `supabase/functions/variant-game-v3/index.ts`
- `supabase/functions/variant-game-v3/deno.json`
- `variants.html`
- `v3/variants/app.mjs`
- `v3/variants/board.mjs`
- `tests/test_v3_variant_schema.py`
- `tests/test_v3_variant_edge_function.py`
- `tests/v3-variants.test.mjs`

**Implementation:**
- Add variant game/move/challenge records isolated from `v2_games`.
- Initially enable `chess960` only.
- Generate valid Chess960 starting positions with bishops on opposite colors, king between rooks, and authoritative castling state.
- Validate every move server-side, including Chess960 castling semantics; persist exactly one committed move per expected ply.
- Add matchmaking/challenge hooks and spectator-safe reads.

## Task 3 — Puzzle Battle

**Files:**
- `supabase/migrations/20260912_full_platform_phase3_puzzle_battle.sql`
- `puzzle-battle.html`
- `v3/puzzles/battle.mjs`
- `tests/test_v3_puzzle_battle_schema.py`
- `tests/v3-puzzle-battle.test.mjs`

**Implementation:**
- Two-player battle with one deterministic puzzle sequence, three-minute server clock, score, solved/failed state, and idempotent answer submission.
- Matchmaking and direct challenge entry points.
- Battle result and optional battle rating/history.
- Integrate from `puzzles.html`.

## Task 4 — Arena and Swiss tournament formats

**Files:**
- `supabase/migrations/20260912_full_platform_phase3_tournaments.sql`
- existing tournament engine files where extension is safe
- `v3/tournaments/formats.mjs`
- `tests/test_v3_tournament_formats.py`
- `tests/v3-tournament-formats.test.mjs`

**Implementation:**
- Extend current tournaments with an explicit `format` and format-specific settings.
- Arena: rolling pairings, score accumulation, standings, no duplicate simultaneous pairing.
- Swiss: round-based pairings, repeat-opponent avoidance when possible, byes, standings and tie-break data.
- Preserve current registrations/matches/results and existing tournament URLs.

## Task 5 — Deeper Game Review

**Files:**
- `supabase/migrations/20260912_full_platform_phase3_reviews.sql`
- `v2/analysis/engine.mjs`
- `v2/analysis/app.mjs`
- `tests/v3-game-review.test.mjs`

**Implementation:**
- Per-move before/after evaluations, best line, best move, evaluation loss, critical moments, phase summary and player accuracy estimate.
- Persist completed reviews for the owning players; analysis remains readable without mutating authoritative game state.
- Use Stockfish 18 already vendored in the repository.

## Task 6 — Achievements and streaks

**Files:**
- `supabase/migrations/20260912_full_platform_phase3_achievements.sql`
- `v3/achievements/app.mjs`
- `tests/test_v3_achievements.py`

**Implementation:**
- Daily activity streak, puzzle streak, first win, game milestones, tournament milestones, lesson milestones and social milestones.
- Idempotent award RPC and a public-safe achievement summary.
- Surface in stats/profile without affecting competitive rating.

## Task 7 — Moderation and admin

**Files:**
- `supabase/migrations/20260912_full_platform_phase3_moderation.sql`
- extend `supabase/functions/admin-management/index.ts`
- `v3/admin/moderation.mjs`
- existing `admin.html` / `admin.js` where appropriate
- `tests/test_v3_moderation.py`

**Implementation:**
- Unified reports queue for players/messages/clubs/games.
- Admin-only actions: dismiss, warn, remove content, suspend/ban where already supported.
- Immutable moderation audit trail.
- Server-side role check for every mutation.

## Task 8 — Final platform integration

**Files:**
- `v2/site/nav.mjs`
- `v2/site/shell.mjs`
- `v2/site/shell.css`
- `index.html` / shared homepage integration
- relevant feature pages
- `tests/v3-platform-integration.test.mjs`

**Implementation:**
- Add Variants and Puzzle Battle to desktop/mobile navigation.
- Add dashboard cards for pending challenges, Daily moves, puzzle/battle entry, tournament events, notifications and recent analysis.
- Keep the old site color identity intact.
- Cache-bust the runtime loader when shared shell assets change.

## Verification and release

1. Run/inspect all new contract tests and existing V2 live-play/clock/navigation tests.
2. Execute SQL smoke checks after migrations and run Supabase security advisors.
3. Verify deployed Edge Functions are ACTIVE with JWT verification.
4. Compare Phase 3 branch against `main`; require `behind_by = 0` before merge.
5. Review changed files and security-sensitive diffs.
6. Merge through PR only after verification.
7. Confirm GitHub Pages deployment is successful for the merge commit and verify key public pages.
