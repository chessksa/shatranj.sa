# Full Platform Parity Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Shatranj V2 from live play into a complete Arabic-first chess platform with social, puzzles, learning, analysis, clubs, notifications, statistics, correspondence play, variants, and administration foundations.

**Architecture:** Keep GitHub Pages as the static frontend and Supabase as the authoritative backend. Add focused V2 feature modules under `v2/` and dedicated public pages; competitive writes and ownership-sensitive actions go through RLS/RPC/Edge Functions, while read-heavy educational and analytical features remain client-side where safe. Preserve the existing petrol/gold site palette and the existing board-piece assets while reusing the shared V2 shell.

**Tech Stack:** HTML/CSS/ES modules, Supabase Auth/PostgreSQL/RLS/RPC/Realtime, chess.js 1.4.0, existing Stockfish 18 browser build, existing Shatranj board assets.

**Spec:** `docs/superpowers/specs/2026-09-12-chesscom-parity-v2-design.md`

## Global Constraints

- Arabic RTL is first-class across desktop and mobile.
- Keep the existing petrol/gold site identity; feature pages may change layout but not the core site palette.
- Public UI uses the term `النقاط` for player rating where previously approved.
- Server-authoritative competitive state; never trust client-submitted ratings or results.
- Reuse `players.auth_user_id = auth.uid()` as the authenticated player ownership boundary.
- Preserve current accounts, player records, tournaments, published URLs, and approved chess piece assets.
- Every new public table uses RLS.
- Every destructive or moderation action must be auditable or server-authorized.

---

### Task 1: Expansion database foundation

**Files:**
- Create: `supabase/migrations/20260912_full_platform_phase2.sql`
- Test: `tests/test_full_platform_phase2_schema.py`

**Interfaces:**
- Consumes: `players(id, auth_user_id)`, `v2_games(id)`.
- Produces: `v2_friendships`, `v2_blocks`, `v2_challenges`, `v2_notifications`, `v2_clubs`, `v2_club_members`, `v2_messages`, `v2_puzzles`, `v2_puzzle_attempts`, `v2_lessons`, `v2_lesson_progress`, `v2_achievements`, `v2_user_achievements`, `v2_correspondence_games` and helper RPCs.

- [ ] **Step 1:** Add a schema contract test asserting all tables, RLS statements, ownership helper, and indexes exist in the migration text.
- [ ] **Step 2:** Run `python tests/test_full_platform_phase2_schema.py`; expected FAIL because migration does not exist.
- [ ] **Step 3:** Write the migration with foreign keys, checks, unique constraints, indexes, RLS, and authenticated-player policies.
- [ ] **Step 4:** Run the schema test; expected PASS.
- [ ] **Step 5:** Apply the migration through Supabase and verify security/performance advisors.

### Task 2: Shared platform API and expanded navigation

**Files:**
- Modify: `v2/site/nav.mjs`
- Create: `v2/platform/api.mjs`
- Create: `v2/platform/page.css`
- Test: `tests/v2-platform-nav.test.mjs`

**Interfaces:**
- Produces: `getSessionPlayer()`, `rpc(name,args)`, `query(table)`, and navigation entries for puzzles, learn, analysis, clubs, community, stats and notifications.

- [ ] **Step 1:** Add a failing test for the new navigation targets and platform API exports.
- [ ] **Step 2:** Run `node tests/v2-platform-nav.test.mjs`; expected FAIL.
- [ ] **Step 3:** Implement focused API and shared page styling.
- [ ] **Step 4:** Run the test; expected PASS.

### Task 3: Rated puzzles and daily puzzle

**Files:**
- Create: `puzzles.html`
- Create: `v2/puzzles/app.mjs`
- Create: `v2/puzzles/board.mjs`
- Test: `tests/v2-puzzles.test.mjs`

**Interfaces:**
- Consumes: `v2_puzzles`, `v2_puzzle_attempts`, chess.js.
- Produces: rated puzzle solving, daily puzzle, puzzle rating display, streak/history hooks and custom-theme filters.

- [ ] **Step 1:** Add a failing DOM/source contract test for puzzle modes and attempt submission.
- [ ] **Step 2:** Run the test; expected FAIL.
- [ ] **Step 3:** Implement puzzle board, move validation and result persistence through an RPC.
- [ ] **Step 4:** Run the test; expected PASS.

### Task 4: Analysis and Game Review foundation

**Files:**
- Create: `analysis.html`
- Create: `v2/analysis/app.mjs`
- Create: `v2/analysis/engine.mjs`
- Test: `tests/v2-analysis.test.mjs`

**Interfaces:**
- Consumes: FEN/PGN, existing Stockfish 18 worker assets, chess.js.
- Produces: free-board FEN/PGN analysis, evaluation, PV, best move, game navigation and local move classification.

- [ ] **Step 1:** Add a failing test for FEN/PGN controls, Stockfish adapter, evaluation and review hooks.
- [ ] **Step 2:** Run the test; expected FAIL.
- [ ] **Step 3:** Implement the analysis page and engine adapter without changing multiplayer authority.
- [ ] **Step 4:** Run the test; expected PASS.

### Task 5: Friends, challenges and notifications

**Files:**
- Create: `community.html`
- Create: `notifications.html`
- Create: `v2/social/app.mjs`
- Test: `tests/v2-social.test.mjs`

**Interfaces:**
- Consumes: friendship/challenge/block/notification tables and RPCs.
- Produces: player search, friend request/accept/remove, block, direct challenge, notification read state.

- [ ] **Step 1:** Add failing source-contract tests for friend, challenge, block and notification actions.
- [ ] **Step 2:** Run tests; expected FAIL.
- [ ] **Step 3:** Implement views and RPC calls with blocked-player enforcement.
- [ ] **Step 4:** Run tests; expected PASS.

### Task 6: Clubs and messaging

**Files:**
- Create: `clubs.html`
- Create: `club.html`
- Create: `v2/clubs/app.mjs`
- Test: `tests/v2-clubs.test.mjs`

**Interfaces:**
- Consumes: clubs, club members and messages.
- Produces: create/join club, roster, club discussion, owner/admin/member roles.

- [ ] **Step 1:** Add failing contract tests for club creation, membership and discussion.
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Implement pages and role-aware operations.
- [ ] **Step 4:** Run; expected PASS.

### Task 7: Lessons and training

**Files:**
- Create: `learn.html`
- Create: `train.html`
- Create: `v2/learn/app.mjs`
- Test: `tests/v2-learn.test.mjs`

**Interfaces:**
- Consumes: lessons and lesson progress.
- Produces: course path/library, interactive challenge positions, progress tracking, opening/endgame/tactics training entry points.

- [ ] **Step 1:** Add failing tests for course/library/progress and training modes.
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Implement original Arabic starter lessons and training launchers.
- [ ] **Step 4:** Run; expected PASS.

### Task 8: Stats, insights and achievements

**Files:**
- Create: `stats.html`
- Create: `v2/stats/app.mjs`
- Test: `tests/v2-stats.test.mjs`

**Interfaces:**
- Consumes: players, games, puzzle attempts, rating history, achievements.
- Produces: W/L/D, color performance, rating history, time-control performance, puzzle stats, streaks and achievements.

- [ ] **Step 1:** Add failing tests for stats cards and insight dimensions.
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Implement read-only aggregation views/RPC and UI.
- [ ] **Step 4:** Run; expected PASS.

### Task 9: Correspondence chess and variants foundation

**Files:**
- Create: `daily.html`
- Create: `variants.html`
- Create: `v2/daily/app.mjs`
- Create: `v2/variants/catalog.mjs`
- Test: `tests/v2-daily-variants.test.mjs`

**Interfaces:**
- Produces: Daily/correspondence game challenges with per-move deadlines; Chess960 as the first playable variant; catalog/feature flags for later variants.

- [ ] **Step 1:** Add failing tests for correspondence deadlines and Chess960 catalog.
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Implement correspondence lobby and variant catalog with Chess960 enabled.
- [ ] **Step 4:** Run; expected PASS.

### Task 10: Final integration and verification

**Files:**
- Modify: `v2/site/nav.mjs`, relevant home links, admin navigation where needed.
- Test: all `tests/v2-*`, all `tests/test_v2_*`, and phase-2 schema tests.

- [ ] **Step 1:** Verify no new page points to legacy human-play entry points.
- [ ] **Step 2:** Run the complete V2 test set and record zero failures.
- [ ] **Step 3:** Compare feature branch to `main`; confirm it is not behind.
- [ ] **Step 4:** Open PR, review changed files, merge only after verification, then verify GitHub Pages deployment success.
