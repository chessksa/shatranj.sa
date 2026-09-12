# Phase 6 Security & Fair Play Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden legacy APIs, add server-side abuse limits and trustworthy fair-play review tooling without automatic cheating bans.

**Architecture:** PostgreSQL owns ACLs, rate-limit buckets, telemetry, risk aggregation, and review state. Existing Edge Functions remain authoritative for chess legality and call server RPCs for limits/telemetry. Admin UI reads only admin-checked RPCs.

**Tech Stack:** Supabase PostgreSQL/RLS/RPC, Supabase Edge Functions (Deno/TypeScript), GitHub Pages frontend, Python/Node contract tests.

**Spec:** `docs/superpowers/specs/2026-09-12-phase6-security-fairplay-design.md`

## Global Constraints
- Do not auto-ban players from heuristic fair-play signals.
- Preserve intended anonymous spectator/public-profile access.
- All write-side security helpers must be inaccessible to `anon`.
- Keep approved board/piece/UI styling unchanged.

---

### Task 1: Legacy API hardening
**Files:**
- Create: `supabase/migrations/20260912_phase6_security_hardening.sql`
- Test: `tests/test_v6_security_hardening.py`

**Interfaces:**
- Produces signed-in-only ACLs for legacy mutation/account RPCs and a `security_invoker` `public_players` view.

- [ ] Write contract tests asserting target functions revoke `anon` and the view uses `security_invoker`.
- [ ] Run tests and verify RED because migration is absent.
- [ ] Add migration with targeted `REVOKE/GRANT` statements and recreate the view safely.
- [ ] Apply migration to Supabase.
- [ ] Re-run tests and verify GREEN.

### Task 2: Rate-limit subsystem
**Files:**
- Create: `supabase/migrations/20260912_phase6_rate_limits.sql`
- Test: `tests/test_v6_rate_limits.py`

**Interfaces:**
- Produces `private.v6_rate_limit_buckets`, `private.v6_take_rate_limit(...)`, `public.v6_take_user_rate_limit(...)`, and `public.v6_take_rate_limit_server(...)`.

- [ ] Write RED contracts for schema, atomic bucket update, deterministic `rate_limited`, and ACLs.
- [ ] Implement migration with fixed-window buckets keyed by player/scope/window.
- [ ] Apply migration and run database rollback integration checks.
- [ ] Verify authenticated helper is signed-in only and server helper is service-role only.

### Task 3: Fair-play telemetry and review queue
**Files:**
- Create: `supabase/migrations/20260912_phase6_fairplay.sql`
- Test: `tests/test_v6_fairplay.py`

**Interfaces:**
- Produces `private.v6_move_telemetry`, `private.v6_fairplay_cases`, server telemetry RPC, and admin list/detail/resolve RPCs.

- [ ] Write RED contracts for telemetry, aggregation thresholds, no automatic punishment, and admin-only resolution.
- [ ] Implement server telemetry recording and risk aggregation using move timing only.
- [ ] Add admin RPCs and audit metadata.
- [ ] Apply migration and verify with rollback integration data.

### Task 4: Enforce limits and telemetry in authoritative game paths
**Files:**
- Modify: `supabase/functions/live-game-v2/index.ts`
- Modify: `supabase/functions/variant-game-v3/index.ts`
- Modify: `supabase/functions/standard-variant-v3/index.ts`
- Modify: `supabase/functions/advanced-variant-v4/index.ts`
- Modify: `supabase/functions/daily-game-v2/index.ts`
- Test: `tests/v6-edge-security.test.mjs`

**Interfaces:**
- Consumes server-only rate-limit and telemetry RPCs.
- Produces `429` for abuse and records successful move timing after authoritative commits.

- [ ] Write RED source contracts for rate-limit and telemetry calls in each authoritative function.
- [ ] Add a small helper per function to call the server RPCs.
- [ ] Rate-limit before game mutations; record telemetry only after successful committed moves.
- [ ] Deploy affected Edge Functions with JWT verification enabled.
- [ ] Verify all functions remain ACTIVE.

### Task 5: Social/report limits
**Files:**
- Create: `supabase/migrations/20260912_phase6_social_limits.sql`
- Test: `tests/test_v6_social_limits.py`

**Interfaces:**
- Wraps/updates message, challenge, report, puzzle-attempt, and matchmaking RPCs with `v6_take_user_rate_limit`.

- [ ] Write RED contracts for each protected action.
- [ ] Redefine existing RPCs minimally, preserving signatures/behavior while adding limits.
- [ ] Apply migration and verify permissions remain authenticated-only.

### Task 6: Admin fair-play UI
**Files:**
- Modify: `admin.html`
- Create: `v2/admin/fairplay-v6.mjs`
- Test: `tests/v6-admin-fairplay.test.mjs`

**Interfaces:**
- Consumes admin fair-play RPCs and exposes queue/detail/resolve actions.

- [ ] Write RED UI contract.
- [ ] Add compact admin section using existing palette/layout.
- [ ] Add status filters, evidence summary, and resolve actions.
- [ ] Run Node syntax/contracts.

### Task 7: Release gate
**Files:**
- Create: `.github/workflows/phase6-verify.yml`
- Create: `docs/superpowers/verification/2026-09-12-phase6.md`

- [ ] Run all Phase 6 Python/Node tests plus V2/Phase3/Phase5 regression suites.
- [ ] Run Supabase security advisor and record remaining pre-existing warnings separately.
- [ ] Run PostgreSQL rollback integration test for rate-limit exhaustion and fair-play case creation.
- [ ] Compare branch to `main` and review changed files.
- [ ] Open PR only on green head; merge only after PR checks pass.
