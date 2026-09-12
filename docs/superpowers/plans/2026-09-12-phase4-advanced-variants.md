# Phase 4 Advanced Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add server-authoritative Crazyhouse, Atomic, Antichess, Horde, and Racing Kings to the existing V3 variants system.

**Architecture:** Reuse V3 variant games, queue, ratings, actions, clocks, and UI. Add one schema extension and one JWT-protected `advanced-variant-v4` Edge Function powered by server-side chessops 0.15.1. The browser consumes authoritative FEN plus legal UCI moves and never computes trusted variant legality or outcomes.

**Tech Stack:** GitHub Pages, Supabase PostgreSQL/RLS/RPC, Supabase Edge Functions/Deno, `chessops@0.15.1`, vanilla browser ES modules.

**Spec:** `docs/superpowers/specs/2026-09-12-phase4-advanced-variants-design.md`

## Global Constraints

- Preserve the existing petrol/turquoise/gold site identity and approved piece assets.
- Preserve Chess960, Three-Check, King of the Hill, V2 live play, Daily, Puzzle Battle, and tournaments.
- Direct competitive writes remain revoked from browser roles.
- Server computes legality, FEN, result, clock settlement, and rating changes.
- Five new modes are not exposed on `main` until CI and deployment verification pass.

---

### Task 1: Schema contracts and variant extension

**Files:**
- Create: `tests/test_v4_advanced_variants.py`
- Create: `supabase/migrations/20260912_phase4_advanced_variants.sql`

**Interfaces:**
- Consumes existing `public.v3_variant_games`, `public.v3_variant_queue`, `public.v3_variant_ratings`, `public.v3_queue_variant_server`, `public.v3_variant_action_server`.
- Produces eight allowed variant identifiers and `public.v4_commit_advanced_variant_move_server(...)`.

- [ ] Write a failing contract test requiring `crazyhouse`, `atomic`, `antichess`, `horde`, and `racingkings` in all three V3 variant constraints and requiring a service-only move commit RPC.
- [ ] Run the test and confirm failure because the migration does not exist.
- [ ] Add the migration: replace variant check constraints, extend queue validation, add service-only move commit RPC with expected-ply locking and existing rating settlement.
- [ ] Apply migration to Supabase and inspect constraints/ACLs.
- [ ] Run the contract test and confirm pass.

### Task 2: Server-authoritative advanced variant engine

**Files:**
- Create: `supabase/functions/advanced-variant-v4/index.ts`
- Create: `tests/test_v4_advanced_variant_edge.py`

**Interfaces:**
- `POST {action:'queue', variant, baseSeconds, incrementSeconds, rated}` returns `{waiting,game,state}`.
- `POST {action:'state', gameId}` returns participant-safe `{game,legalMoves,pockets,serverNow}`.
- `POST {action:'move', gameId, expectedPly, uci}` validates and commits exactly one move.
- Lifecycle actions delegate to `v3_variant_action_server`.

- [ ] Write a failing test requiring `npm:chessops@0.15.1`, `defaultPosition`, `setupPosition`, `parseFen`, `makeFen`, `parseUci`, `isLegal`, `expectedPly`, and `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Run test and confirm failure because the function is missing.
- [ ] Implement engine mapping: `crazyhouse`, `atomic`, `antichess`, `horde`, `racingkings` to chessops rules.
- [ ] Generate initial FEN using chessops default positions.
- [ ] Reconstruct authoritative position from database FEN, parse UCI including drops, validate with `pos.isLegal(move)`, play, derive outcome/FEN, and commit through `v4_commit_advanced_variant_move_server`.
- [ ] Return legal move list and Crazyhouse pockets from server state.
- [ ] Deploy with `verify_jwt=true` and confirm ACTIVE.
- [ ] Run contract test and confirm pass.

### Task 3: Unified eight-mode variants UI

**Files:**
- Modify: `variants.html`
- Modify: `v3/variants/app.mjs`
- Create: `tests/v4-advanced-variants.test.mjs`

**Interfaces:**
- Existing three modes continue using their current Edge Functions.
- Five advanced modes call `advanced-variant-v4`.
- Server-returned `legalMoves` drives targets and move submissions.

- [ ] Write a failing Node contract requiring all eight mode labels, `advanced-variant-v4`, Crazyhouse pocket controls, and no browser `chessops` import.
- [ ] Run test and confirm failure.
- [ ] Add five mode options and concise Arabic descriptions.
- [ ] Refactor move selection so advanced modes use server-provided legal UCI moves.
- [ ] Render Crazyhouse white/black pockets and support legal drops.
- [ ] Keep existing board themes/pieces and existing three-mode behavior unchanged.
- [ ] Run Node contract and `node --check` on the updated module.

### Task 4: Stats, achievements, and navigation integration

**Files:**
- Create: `supabase/migrations/20260912_phase4_variant_achievements.sql`
- Modify: `v2/stats/app.mjs`
- Modify: `v2/site/shell.mjs` only if needed for copy/entry points.
- Create: `tests/test_v4_variant_achievements.py`

**Interfaces:**
- Uses `v3_variant_ratings` keyed by `(player_id,variant)`.
- Extends `v3_refresh_achievements()` idempotently.

- [ ] Write failing contract for first-game achievements in each new mode.
- [ ] Add achievement definitions and refresh rules.
- [ ] Render per-variant ratings/games in Insights without assuming a single variant row.
- [ ] Run contracts and syntax checks.

### Task 5: Release gate

**Files:**
- Modify: `.github/workflows/phase3-verify.yml` or add `phase4-verify.yml`.
- Create: `docs/full-platform-phase4-verification.md`.

- [ ] Add Python/Node/syntax coverage for Phase 4.
- [ ] Run production schema introspection and Supabase Security Advisor.
- [ ] Confirm `advanced-variant-v4` ACTIVE with JWT verification.
- [ ] Run rollback-only PostgreSQL smoke tests for advanced-variant queueing and terminal settlement without persistent test rows.
- [ ] Open PR only when branch is `behind_by=0`.
- [ ] Require successful CI before merge.
- [ ] Merge to `main` and confirm GitHub Pages build and deploy both succeed.