# Admin Management & Tournaments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the admin panel with owner/moderator roles, player creation/deletion, scoped moderation, and tournaments by country/city.

**Architecture:** Keep browser access limited to authenticated RPCs and a JWT-protected Edge Function for Supabase Auth administration. Store authorization in private.admin_users, enforce moderator scope on the server, and extend existing tournament/player tables rather than building parallel systems.

**Tech Stack:** GitHub Pages, vanilla JavaScript, Supabase Postgres/Auth/Edge Functions, Python static tests, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-06-admin-management-tournaments-design.md`

## Global Constraints

- Owner has full administrative control.
- Moderators cannot add/remove moderators or alter the owner.
- Moderator scope is global, country, or city.
- Auth create/delete operations run only in a JWT-protected Edge Function with service-role access server-side.
- Existing players and game records must be preserved.
- Admin actions must be auditable.

---

### Task 1: Database authorization and geography

**Files:**
- Database schema in Supabase project

**Interfaces:**
- Produces `admin_get_access`, scoped admin checks, `players.country`, expanded `private.admin_users`.

- [x] Extend admin roles to owner/moderator with scope fields.
- [x] Migrate the existing admin to owner.
- [x] Add player country data without deleting existing players.
- [x] Verify exactly one active owner exists.

### Task 2: Player administration

**Files:**
- Supabase RPCs
- `supabase/functions/admin-management/index.ts`

**Interfaces:**
- Produces player list/detail/update/rating/ban/unban RPCs and Edge actions `create_player` / `delete_player`.

- [x] Add scoped player RPCs.
- [x] Add arbitrary rating update with audit trail.
- [x] Add owner-only player creation/deletion paths.
- [x] Preserve historical game records during deletion.

### Task 3: Moderator administration

**Files:**
- Supabase RPCs

**Interfaces:**
- Produces `admin_list_moderators`, `admin_add_moderator`, `admin_remove_moderator`.

- [x] Add owner-only moderator management.
- [x] Enforce global/country/city scope.
- [x] Audit moderator changes.

### Task 4: Tournament administration

**Files:**
- Supabase RPCs and tournament tables

**Interfaces:**
- Produces tournament create/update/cancel/list and registration listing.

- [x] Extend tournaments with scope type and country/city.
- [x] Add tournament registrations with RLS.
- [x] Add scoped tournament management RPCs.
- [x] Enforce player geography when registering.

### Task 5: Admin UI

**Files:**
- Modify: `admin.js`
- Test: `tests/test_admin_management_ui.py`

**Interfaces:**
- Consumes admin RPCs and the `admin-management` Edge Function.

- [x] Add owner-only player creation/deletion controls.
- [x] Add player editing and direct rating control.
- [x] Add moderator management UI.
- [x] Add tournament management UI with country/city selectors.
- [x] Hide owner-only controls from moderators.

### Task 6: Verification

**Files:**
- `.github/workflows/verify-admin.yml`

- [x] Run `node --check admin.js`.
- [x] Run `python -m pytest -q tests/test_admin_management_ui.py`.
- [x] Verify Edge Function is ACTIVE with JWT verification enabled.
- [x] Verify new and legacy admin RPCs are not executable by `anon`.
- [x] Verify existing player/game counts remain intact apart from normal live-site activity.

**Verification note:** The repository-wide historical test suite currently contains unrelated stale failures for old home/play assets and cache-version expectations. Admin-specific verification is green and JavaScript syntax passes.
