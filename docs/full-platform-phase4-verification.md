# Full Platform Phase 4 Verification — 2026-09-12

## Scope

Phase 4 completes the advanced-variant slice by adding five server-authoritative modes to the three already shipped in Phase 3.

Supported modes after this phase:

- Chess960
- Three-Check
- King of the Hill
- Crazyhouse
- Atomic
- Antichess
- Horde
- Racing Kings

The approved Shatranj site identity, board themes, and approved piece assets remain unchanged.

## Server rules engine

`advanced-variant-v4` uses `chessops@0.15.1` only inside the Supabase Edge Function. The browser does not import chessops and never decides legal moves, forced captures, Crazyhouse drops/pockets, Atomic explosions, Horde outcomes, Racing Kings outcomes, FEN, game result, clock settlement, or rating deltas.

Production Edge Function verification:

- slug: `advanced-variant-v4`
- status: `ACTIVE`
- version: `1`
- JWT verification: `true`
- deployment SHA-256: `d88f93f78ee65805fa657bd538760e3e74dbf60363f4319500c13602a92b7533`

The successful Supabase deployment also verifies Deno resolution/compilation of the chessops imports used by the function.

## Database verification

Applied production migrations successfully:

- `phase4_advanced_variants`
- `phase4_variant_achievements`

Production introspection confirmed `v3_variant_games`, `v3_variant_queue`, and `v3_variant_ratings` accept exactly the eight supported variant identifiers.

`public.v4_commit_advanced_variant_move_server(...)` permissions were checked explicitly:

- `anon`: no execute
- `authenticated`: no execute
- `service_role`: execute

The commit RPC uses expected-ply locking and existing V3 rating settlement.

## Transactional integration smoke test

A rollback-only PostgreSQL integration test created two temporary players inside an explicit transaction, matched them in rated Atomic, committed a terminal server move, checked rating settlement, and checked queue cleanup.

Observed result:

`PHASE4_DB_INTEGRATION_PASS`

Verified rating result inside the transaction:

- winner: 1510
- loser: 1490

The transaction was rolled back, so no temporary players, queue rows, games, moves, or ratings remain.

## UI verification

The shared `variants.html` page exposes all eight modes. Advanced modes use legal UCI moves returned by `advanced-variant-v4`. Crazyhouse renders server-returned pockets and sends drop notation such as `Q@f7`; the browser does not compute whether a drop is legal.

Insights now reads variant ratings keyed by `(player_id, variant)` and renders independent rating/game-count rows for all eight modes.

## Achievement correction

Phase 4 adds first-game achievements for Crazyhouse, Atomic, Antichess, Horde, and Racing Kings.

During verification a pre-existing issue was found and corrected: `chess960_first` previously matched any finished V3 variant game. The refreshed achievement function now checks each variant identifier explicitly, including Chess960, Three-Check, and King of the Hill.

## CI

Before this verification document was added, the current implementation head passed both required workflows:

- `Phase 4 Verification`: success
- `Phase 3 Verification`: success

The Phase 4 workflow runs Python contracts, Node UI contracts, and frontend syntax checks. CI must be re-run on the final documentation head before merge.

## Security review

Supabase Security Advisor was run after Phase 4 DDL.

Phase 4 introduced no new tables, and no new missing-RLS finding is attributable to this phase. The service-only Phase 4 move-commit function does not appear in the anonymous/authenticated SECURITY DEFINER executable findings, consistent with the explicit ACL check above.

Broader pre-existing project findings remain, including:

- legacy RLS-enabled tables with no policies
- the pre-existing `public.public_players` SECURITY DEFINER view
- legacy SECURITY DEFINER RPC warnings
- leaked-password protection disabled

Reference remediation pages:

- https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Licensing boundary

`chessops` is GPL-3.0-or-later. Phase 4 uses it in the server-side Edge Function only; it is not imported or bundled by the static browser application.

## Explicit verification limit

A real two-account browser smoke test for the five new modes has **not** been performed. Do not represent that test as completed. Server deployment, CI contracts/syntax, production ACL/schema inspection, and rollback-only database integration have been verified.