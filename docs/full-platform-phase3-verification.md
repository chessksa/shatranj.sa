# Full Platform Phase 3 Verification — 2026-09-12

## Scope verified

Phase 3 adds Chess960, Three-Check, King of the Hill, Puzzle Battle, Arena/Swiss tournament formats, deeper Game Review persistence, activity streaks/achievements, and unified moderation support.

## Database and server verification

Applied production migrations successfully:

- `full_platform_phase3_variants`
- `full_platform_phase3_variants_server`
- `full_platform_phase3_variants_actions_fix`
- `full_platform_phase3_variant_reads`
- `full_platform_phase3_puzzle_battle`
- `full_platform_phase3_puzzle_battle_rls_fix`
- `full_platform_phase3_tournaments`
- `full_platform_phase3_platform`
- `full_platform_phase3_standard_variants`
- `full_platform_phase3_hardening`

Production introspection confirmed the three allowed variant values on games, queue, and ratings: `chess960`, `threecheck`, `kingofthehill`. Three-Check counters are constrained to 0–3.

Production Edge Functions:

- `live-game-v2` — ACTIVE v2, JWT required
- `daily-game-v2` — ACTIVE v1, JWT required
- `variant-game-v3` — ACTIVE v1, JWT required
- `standard-variant-v3` — ACTIVE v1, JWT required

## Transactional integration tests

All test rows were created inside explicit PostgreSQL transactions and rolled back.

Passed:

- `PHASE3_SERVER_INTEGRATION_PASS`
  - two-player Three-Check matchmaking
  - queue cleanup after match
  - zero-initialized check counters
  - four-player Swiss tournament start
  - two Round 1 Swiss matches
  - four score rows

- `PHASE3_TERMINAL_INTEGRATION_PASS`
  - terminal Three-Check server commit
  - variant rating settlement for both players
  - automatic Three-Check achievement award
  - Arena start, timer, and score rows
  - Puzzle Battle finalization
  - Puzzle Battle winner assignment and rating settlement

## Frontend syntax verification

Fresh `node --check` passed for the current Phase 3 versions of:

- `v3/variants/app.mjs`
- `v2/stats/app.mjs`
- `v2/site/shell.mjs`

Result: `PHASE3_FRONTEND_SYNTAX_PASS`.

The deployed Edge Functions also compiled successfully during Supabase deployment.

## Security review

Supabase Security Advisor was run after Phase 3 DDL.

- Phase 3 gameplay tables did not introduce missing-RLS findings.
- `v3_moderation_actions` now has an explicit deny-direct-read RLS policy and remains accessible only through guarded administration RPCs.
- Existing project-wide advisor findings remain outside this Phase 3 scope, including the pre-existing `public.public_players` SECURITY DEFINER view, legacy SECURITY DEFINER RPC warnings, and leaked-password protection being disabled.

Reference remediation pages:

- RLS policy lint: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- SECURITY DEFINER view lint: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view
- Anonymous SECURITY DEFINER RPC lint: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- Authenticated SECURITY DEFINER RPC lint: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- Leaked password protection: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Known verification limit

A real two-account browser smoke test has **not** been performed. Do not represent it as completed. The server-side transactional tests above cover matchmaking and settlement without leaving synthetic accounts or test data in production.

## Explicitly not included

Atomic and Crazyhouse are not included in this merge because they require dedicated legal-move engines. They must not be exposed as working modes until their server-authoritative rules are implemented and tested.
