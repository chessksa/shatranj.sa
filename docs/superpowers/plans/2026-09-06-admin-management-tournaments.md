# Admin Management & Tournaments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** تنفيذ لوحة إدارة كاملة تسمح للمالك بإضافة وحذف اللاعبين وإضافة وإلغاء المشرفين، وتسمح بإنشاء بطولات عامة أو حسب الدولة أو المدينة، مع صلاحيات خادمية آمنة وسجل تدقيق.

**Architecture:** تبقى الواجهة في `admin.html` و`admin.js`. العمليات العادية تتم عبر RPCs في PostgreSQL تتحقق من `auth.uid()` ودور المستخدم ونطاقه. العمليات التي تحتاج Supabase Auth Admin مثل إنشاء المستخدم وحذفه تتم عبر Edge Function محمية بـ JWT وتستخدم `SUPABASE_SERVICE_ROLE_KEY` داخل الخادم فقط. يتم تطوير الجداول الحالية بدل إنشاء نظام موازٍ.

**Tech Stack:** GitHub Pages, JavaScript ES modules, Supabase Auth, PostgreSQL 17, Supabase Edge Functions / Deno 2.1, supabase-js v2.

**Spec:** `docs/superpowers/specs/2026-09-06-admin-management-tournaments-design.md`

## Global Constraints

- مالك واحد بصلاحيات كاملة.
- المشرف لا يستطيع إضافة أو حذف مشرفين ولا تغيير دور المالك.
- دعم نطاقات المشرف: `global`, `country`, `city`.
- حذف اللاعب النهائي للمالك فقط.
- العمليات الحساسة الخاصة بـ Auth لا تنفذ من المتصفح ولا تستخدم `service_role` في الواجهة.
- إضافة `country` تدريجيًا بدون كسر اللاعبين الحاليين.
- البطولات تدعم: عامة، دولة، مدينة داخل دولة.
- كل إجراء إداري حساس يسجل في سجل الإدارة.
- التحقق من الصلاحيات والنطاق يتم خادميًا وليس عبر إخفاء الأزرار فقط.

---

### Task 1: Extend schema, roles, audit and tournament data model

**Files:**
- Create: `supabase/admin-management-v1.sql`
- Modify runtime schema in Supabase project `zjxkxhsvltihucdacjrv`
- Test: SQL assertions executed against the project after DDL

**Interfaces:**
- Produces `private.admin_users(role, scope_type, scope_country, scope_city, is_active, created_by)`.
- Produces `public.players.country`.
- Produces expanded `public.tournaments` fields and `public.tournament_registrations`.
- Produces expanded `private.admin_actions` action types and metadata fields.

- [ ] **Step 1: Inspect existing constraints and dependent objects**

Run SQL against `pg_constraint`, `pg_proc`, and grants to capture current names and dependencies before altering anything.

- [ ] **Step 2: Write schema verification queries that fail before migration**

Verify absence of `players.country`, `tournaments.scope_type`, tournament registrations, and `owner/moderator` role support.

- [ ] **Step 3: Apply additive schema changes**

Add nullable `country` to players. Expand `private.admin_users` from legacy `admin` to `owner|moderator`, add scope fields and active flag, and convert the single existing admin to `owner`. Expand tournaments with scope and registration fields. Create `public.tournament_registrations` with a unique `(tournament_id, player_id)` key and RLS enabled.

- [ ] **Step 4: Expand audit log safely**

Allow action types `player_create`, `player_update`, `player_delete`, `player_ban`, `player_unban`, `rating_change`, `moderator_create`, `moderator_update`, `moderator_remove`, `tournament_create`, `tournament_update`, `tournament_cancel`; add `target_auth_user_id`, `tournament_id`, and JSONB `details` as needed.

- [ ] **Step 5: Verify migration state**

Run SQL assertions for columns, constraints, owner count = 1, RLS enabled on the new registration table, and existing player/game counts unchanged.

- [ ] **Step 6: Commit SQL source file**

Commit `supabase/admin-management-v1.sql` after the live schema verification succeeds.

---

### Task 2: Add secure admin RPC layer

**Files:**
- Append RPC definitions to: `supabase/admin-management-v1.sql`
- Test: SQL calls under authenticated owner/moderator and unauthenticated contexts where possible

**Interfaces:**
- Produces `admin_get_access()` returning role and scope for current `auth.uid()`.
- Produces `admin_create_player_profile(...)` for post-Auth profile creation.
- Produces `admin_delete_player_data(...)` for controlled data cleanup prior to Auth deletion.
- Produces `admin_list_moderators()`, `admin_add_moderator(...)`, `admin_remove_moderator(...)`.
- Produces `admin_list_tournaments()`, `admin_create_tournament(...)`, `admin_update_tournament(...)`, `admin_cancel_tournament(...)`.
- Produces `admin_list_tournament_registrations(p_tournament_id uuid)`.

- [ ] **Step 1: Write authorization helper**

Create a private helper that validates `auth.uid()`, active admin role, and optional scope. Avoid trusting `user_metadata`.

- [ ] **Step 2: Implement owner-only moderator RPCs**

Add/list/remove moderators; prevent changing/removing the owner; log every change.

- [ ] **Step 3: Implement tournament RPCs**

Validate scope combinations: global => no country/city required, country => country required and city null, city => both country and city required. Moderator actions must remain inside assigned scope.

- [ ] **Step 4: Implement player profile create/delete helpers**

Profile create inserts a players row linked to a newly created Auth user. Delete helper removes or anonymizes dependent rows according to foreign-key requirements while retaining audit evidence.

- [ ] **Step 5: Lock down function execution**

For any `SECURITY DEFINER` public RPC: set a fixed `search_path`, revoke `EXECUTE` from `PUBLIC`/`anon`, grant only to `authenticated`, and perform an explicit `auth.uid()` admin check inside the function body.

- [ ] **Step 6: Verify authorization failures and success cases**

Confirm unauthenticated and normal player contexts cannot call admin operations; owner can; moderator cannot add/remove moderators and cannot operate outside scope.

---

### Task 3: Deploy Auth-admin Edge Function

**Files:**
- Create: `supabase/functions/admin-management/index.ts`
- Create: `supabase/functions/admin-management/deno.json`
- Deploy Supabase Edge Function: `admin-management`
- Test: invoke with missing JWT, normal-player JWT, owner JWT, and malformed payloads

**Interfaces:**
- POST JSON `{action:"create_player", email, password, name, country, city, gender?, rating?}`.
- POST JSON `{action:"delete_player", player_id, reason}`.
- Returns JSON `{ok:true,...}` on success and `{ok:false,error}` on failure.

- [ ] **Step 1: Implement JWT and role validation**

Use request bearer JWT plus a user-scoped Supabase client to call `admin_get_access()`. Reject non-owner for delete; allow create only according to the approved role policy.

- [ ] **Step 2: Implement create player**

Use server-only service client `auth.admin.createUser`; then call the protected profile RPC; if profile creation fails, delete the newly created Auth user to avoid orphan accounts.

- [ ] **Step 3: Implement delete player**

Resolve the player/Auth link, call controlled DB cleanup, then call `auth.admin.deleteUser`; reject deleting the owner’s linked identity if ever encountered.

- [ ] **Step 4: Add strict validation and CORS**

Validate email, password length, required name/country/city, rating bounds, and allowed action values. Return only safe error messages to the client.

- [ ] **Step 5: Deploy with `verify_jwt=true`**

Use Supabase-hosted `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; never put the secret in GitHub Pages code.

- [ ] **Step 6: Verify deployed function behavior**

Confirm missing/invalid JWT is rejected, owner operations succeed in controlled test cases, and no service key appears in repository files.

---

### Task 4: Extend admin UI for players, moderators and tournaments

**Files:**
- Modify: `admin.html`
- Modify: `admin.js`
- Test: `tests/admin-management-ui.test.mjs`

**Interfaces:**
- Consumes RPCs and `admin-management` Edge Function from Tasks 2-3.
- Adds views: players create/delete actions, moderators management, tournaments management.

- [ ] **Step 1: Add failing static UI tests**

Assert that `admin.html` contains navigation and form controls for `المشرفون`, `البطولات`, `إضافة لاعب`, and owner-only delete controls; assert `admin.js` references the new RPC/function names.

- [ ] **Step 2: Add owner/moderator-aware navigation**

Load `admin_get_access()` after session validation. Hide owner-only controls for moderators, but still rely on server authorization for enforcement.

- [ ] **Step 3: Add player creation dialog**

Fields: name, email, initial password, country, city, gender, initial points default 1500. Submit to Edge Function with current JWT.

- [ ] **Step 4: Add player deletion flow**

Owner-only button in player details; require reason and a second explicit confirmation; call Edge Function; refresh lists on success.

- [ ] **Step 5: Add moderators view**

List moderators with role and scope. Owner can add a registered user as moderator with global/country/city scope and remove moderator access.

- [ ] **Step 6: Add tournaments view**

Create/edit/cancel tournament with name, scope, country/city, time control, start date, registration window and maximum players. Show registration count.

- [ ] **Step 7: Run UI tests**

Run the repository’s Node tests plus `node --test tests/admin-management-ui.test.mjs` and fix all failures.

---

### Task 5: Security and end-to-end verification

**Files:**
- Modify as needed: `supabase/admin-management-v1.sql`, `admin.html`, `admin.js`, Edge Function source
- Test: database advisors, GitHub source scan, functional RPC/Edge Function checks

**Interfaces:**
- Produces a verified production state with owner/moderator separation and country/city tournaments.

- [ ] **Step 1: Run Supabase security advisors**

Review all critical/high notices. Do not blindly enable RLS on legacy private tables without verifying existing access patterns.

- [ ] **Step 2: Scan repository for secrets**

Confirm there is no service-role key or secret API key in browser code or committed files.

- [ ] **Step 3: Verify owner invariants**

Exactly one active owner; moderator cannot remove/promote owner; moderator-management RPCs reject moderator callers.

- [ ] **Step 4: Verify player lifecycle safely**

Create a dedicated test player, verify Auth + `players` row + country/city, then delete that same test player and verify no orphan Auth/profile remains and existing users are unchanged.

- [ ] **Step 5: Verify tournament scopes**

Create controlled draft test tournaments for global, country and city scopes; verify invalid combinations are rejected; delete/cancel only the test records after checks.

- [ ] **Step 6: Run full repository tests and compare production counts**

Confirm tests pass and core counts for existing players/live games remain consistent except for deliberately created-and-removed test records.

- [ ] **Step 7: Final commit**

Commit verified UI, SQL source, Edge Function source and tests with no unrelated changes.
