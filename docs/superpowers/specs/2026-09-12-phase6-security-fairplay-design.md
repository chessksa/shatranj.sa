# Phase 6 Security & Fair Play Design

## Goal
Harden exposed legacy RPCs, add server-enforced abuse controls, record trustworthy fair-play telemetry, and give admins a review queue without automatic cheating bans.

## Security
- Keep public spectator/profile/read APIs public where intended.
- Remove `anon` EXECUTE from legacy RPCs that require a signed-in player: matchmaking mutations, profile mutations, account-only profile reads, player challenges, and one-time gender mutation.
- Recreate `public.public_players` as a `security_invoker` view so it does not bypass caller RLS/privileges.
- Keep Phase 5 settings/tables RPC-only; no direct client table access.
- Do not change admin authorization semantics in this phase unless an audit finds a concrete bypass.

## Abuse controls
- Add a private rate-limit bucket table and service/authenticated helper functions.
- Enforce server-side limits on live-game moves/actions, variant moves/actions, matchmaking starts, direct messages, challenges, puzzle submissions, and reports.
- Limits return deterministic `rate_limited` errors; no silent drops.

## Fair Play
- Store server-derived move telemetry only: player, game, ply, move timestamp, elapsed turn time, source mode, termination context.
- Compute lightweight risk signals from server facts only (extremely fast repeated moves, very low timing variance across enough plies, excessive action bursts).
- Never auto-ban or auto-deduct rating from heuristic signals.
- Maintain per-player review summaries and queue only when thresholds are crossed; admins make decisions.

## Admin
- Add RPCs for fair-play queue/detail/resolve and expose a compact section in the existing admin dashboard.
- Resolution states: open, cleared, warned, actioned. Every resolution writes audit data.

## Verification
- TDD contract tests for schema/ACL/rate limits/fair-play RPCs.
- PostgreSQL rollback integration tests for limits and telemetry aggregation.
- Regression CI for V2/variants/social APIs.
- Supabase security advisor review after DDL changes.
