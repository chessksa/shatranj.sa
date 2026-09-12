# Phase 5 Core UX Implementation Plan

**Goal:** Ship custom standard matchmaking, safe rematch, enforceable player preferences/privacy, and a signed-in home dashboard.

**Architecture:** Extend the existing V2 queue and challenge system. Keep competitive state in PostgreSQL/Edge Functions. Add a player-owned settings table and a single home-dashboard read RPC. Browser modules remain small and additive.

### Task 1 — Custom matchmaking + rematch backend
- Create `tests/test_v5_matchmaking_rematch.py` first.
- Add migration `supabase/migrations/20260912_phase5_matchmaking_rematch.sql`.
- Extend `private.v2_matchmaking_queue` with `base_seconds`, `increment_seconds`, and `rated` while retaining legacy columns.
- Add `start_v5_matchmaking`, `poll_v5_matchmaking`.
- Add rematch metadata to `v2_challenges` and RPCs `v5_request_rematch`, `v5_get_rematch_state`.
- Redefine challenge acceptance so rematch colors swap deterministically.
- Apply migration and run rollback integration.

### Task 2 — Play UI
- Add `tests/test_v5_play_controls.py` first.
- Extend `play-v2.html` with custom base/increment/rated controls and a rematch button.
- Extend `v2/play/api.js` with V5 matchmaking/rematch calls.
- Extend `v2/play/app.js` so presets remain simple, custom controls are optional, finished games can request/accept rematch, and accepted rematches open directly.
- Preserve approved board layout/assets/colors.

### Task 3 — Preferences/privacy backend + settings UI
- Add `tests/test_v5_preferences.py` first.
- Add `public.v5_player_settings` with RLS and self-only RPCs.
- Enforce challenge/message preferences server-side.
- Suppress ordinary notifications when user disabled them.
- Honor public-profile privacy in the public profile read boundary.
- Expand `settings-v2.html` and add `v5/settings/app.mjs` without replacing existing board settings.

### Task 4 — Home dashboard
- Add `tests/test_v5_home_dashboard.py` first.
- Add `public.v5_home_dashboard()` returning current-user aggregates only.
- Add `v5/home/dashboard.mjs` that mounts a compact dashboard on signed-in home.
- Load it through the existing shell on the home route.

### Task 5 — Release gate
- Add `.github/workflows/phase5-verify.yml`.
- Run Phase 5 contracts + Phase 3/4 regressions where relevant.
- Run Supabase Security Advisor.
- Create `docs/full-platform-phase5-verification.md`.
- Merge only if branch is behind_by=0 and CI succeeds.
- Confirm GitHub Pages build + deploy success.