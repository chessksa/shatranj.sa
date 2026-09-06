# Tournament Start Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make tournaments start automatically or manually, freeze entrants, generate a knockout bracket, create live games, expose each player's match entry, and advance winners automatically.

**Architecture:** Keep tournament orchestration in Postgres so scheduled starts and winner advancement do not depend on an open browser. Store bracket state and encrypted live-game seat keys in `private.tournament_matches`; expose only scoped RPCs for admins, participants, and public bracket reads. Reuse the existing `live_games`/`private.live_game_players` engine and the existing `play-v10.html?game=` route.

**Tech Stack:** Supabase Postgres, pg_cron, pgcrypto, Supabase RPC, vanilla JS, GitHub Pages.

**Spec:** Approved conversation design on 2026-09-07: fixed/open capacity, scheduled start, manual admin start, random knockout draw, byes for uneven brackets, automatic advancement, draw rematch, existing board UI.

## Global Constraints

- Do not redesign the approved chess board or pieces.
- Fixed tournaments auto-start only when the configured capacity is full; admin may manually force start with at least 2 registered players.
- Open tournaments auto-start at `starts_at` with all registered players, minimum 2.
- Starting freezes registration by changing tournament status to `running`.
- Drawn knockout games create a rematch between the same players; no player advances on a draw.
- Tournament live-game seat keys remain encrypted at rest and are returned only to the authenticated participant.
- Automatic scheduling uses the already-installed `pg_cron` extension.

---

### Task 1: Regression contract

**Files:**
- Create: `tests/test_tournament_start_engine.py`
- Create: `.github/workflows/verify-tournament-start-engine.yml`

**Interfaces:**
- Consumes: current tournament/admin/public UI files.
- Produces: a failing contract before implementation and a green contract afterward.

- [ ] Write assertions for schema/function names, cron job, admin start button, bracket rendering, match access, and sessionStorage handoff.
- [ ] Run the workflow and confirm it fails before implementation.

### Task 2: Database tournament engine

**Files:**
- Create: `supabase/migrations/20260907010000_tournament_start_engine.sql`

**Interfaces:**
- Produces: `private.tournament_matches`, `private.start_tournament_core(uuid,boolean)`, `private.create_tournament_live_game(uuid)`, `private.advance_tournament_match(uuid,uuid)`, `private.process_tournament_live_game()`, `private.start_due_tournaments()`, `public.admin_start_tournament(uuid)`, `public.get_tournament_bracket(uuid)`, `public.get_my_tournament_match_access(uuid)`, `public.get_my_active_tournament_matches()`.

- [ ] Add the private bracket table with encrypted seat-key fields, unique round/match slots, and RLS/privilege protection.
- [ ] Add core bracket construction using randomized registered participants and next-power-of-two slots.
- [ ] Auto-advance byes and create live games only when both players are present.
- [ ] Reuse `live_games` and `private.live_game_players`, with tournament games unrated (`rating_step=0`).
- [ ] Add trigger handling decisive results; create rematch for `1/2-1/2`.
- [ ] Finish the tournament when the final match obtains a winner.
- [ ] Add authenticated/public RPCs with strict participant/admin authorization.
- [ ] Schedule `private.start_due_tournaments()` every minute with pg_cron.
- [ ] Apply migration to the live Supabase project and verify functions/table/cron exist.

### Task 3: Admin manual start

**Files:**
- Modify: `admin.js`

**Interfaces:**
- Consumes: `public.admin_start_tournament(uuid)`.
- Produces: `data-action="startTournament"` button for open tournaments and `startTournamentNow(id)`.

- [ ] Add `ابدأ البطولة الآن` beside edit/cancel for open tournaments.
- [ ] Call the admin RPC, show a useful error for fewer than two registrants, and reload tournaments after success.

### Task 4: Public bracket and game entry

**Files:**
- Modify: `tournaments.html`

**Interfaces:**
- Consumes: `get_tournament_bracket`, `get_my_active_tournament_matches`, `get_my_tournament_match_access`.
- Produces: bracket rows/cards and `دخول المباراة` action that stores existing live-game session keys then redirects to `play-v10.html?game=<uuid>`.

- [ ] Render bracket beneath tournament details when status is running/finished.
- [ ] Mark current player's active match and expose the game-entry button only to its participant.
- [ ] On click, fetch access, populate `shatranj_live_game_*` sessionStorage keys, and navigate to the existing play page.
- [ ] Refresh bracket after registration/status changes without altering the approved visual identity.

### Task 5: Verification

**Files:**
- Test: `tests/test_tournament_start_engine.py`

- [ ] Run the GitHub verification workflow and confirm green.
- [ ] Query Supabase for the cron job and newly created functions.
- [ ] Execute a transaction-based database smoke test with a temporary tournament where possible; roll it back.
- [ ] Verify the exact final GitHub Pages deployment succeeds before reporting completion.
