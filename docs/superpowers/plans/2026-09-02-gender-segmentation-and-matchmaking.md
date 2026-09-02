# Gender Segmentation and Matchmaking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add required male/female classification for new players, one-time completion for existing players, all/men/women rankings, gender-aware random matchmaking, and admin gender management without breaking existing accounts or legacy matchmaking calls.

**Architecture:** Make the database change additive: keep existing production RPC signatures alive, add v2 RPCs, and add a nullable `players.gender` plus `matchmaking_queue.gender_scope`. The private matching function becomes preference-aware while legacy `start_matchmaking` explicitly resets scope to `all`, so stale clients remain safe. Frontend pages switch to v2 RPCs only after database verification.

**Tech Stack:** GitHub Pages static HTML/CSS/JavaScript, Supabase Auth/Postgres/RPC/Storage, Supabase JS v2.

**Spec:** `docs/superpowers/specs/2026-09-02-gender-segmentation-and-matchmaking-design.md`

## Global Constraints

- New registration requires exactly `male` or `female`.
- Existing player rows remain valid with `gender IS NULL` until the player completes the field.
- Ordinary players can set gender only once; only admins can correct it later.
- Gender is not added to `get_public_player_profile` and is not displayed prominently on public player pages.
- Ranking scopes are: `all`, `male`, `female` in the UI; the RPC accepts `NULL`, `male`, or `female`.
- Matchmaking scopes are exactly `all` and `same_gender`.
- Friend challenges are unchanged.
- Legacy `claim_player_profile`, `get_my_player_profile`, and `start_matchmaking` remain callable.
- A legacy `start_matchmaking` call always behaves as `all`, even if the same player previously queued with `same_gender`.
- A match is compatible only when both players' preferences are satisfied symmetrically.

---

### Task 1: Add gender data and backward-compatible RPCs

**Files:**
- Database migration via Supabase migration `add_gender_matchmaking_scope`
- Update documentation snapshot: `schema.sql`

**Interfaces:**
- Produces `public.players.gender text NULL CHECK (gender IN ('male','female'))`
- Produces `private.matchmaking_queue.gender_scope text NOT NULL DEFAULT 'all' CHECK (gender_scope IN ('all','same_gender'))`
- Produces `claim_player_profile_v2(p_name text,p_mobile text,p_region text,p_city text,p_category text,p_gender text)`
- Produces `get_my_player_profile_v2()` with existing profile columns plus `gender`
- Produces `set_my_gender_once(p_gender text)` returning the saved gender
- Produces `get_public_ranked_players(p_gender text DEFAULT NULL)` without exposing a gender column

- [ ] **Step 1: Record the pre-migration failing checks**

Run with Supabase SQL:

```sql
select exists (
  select 1 from information_schema.columns
  where table_schema='public' and table_name='players' and column_name='gender'
) as players_gender_exists,
exists (
  select 1 from information_schema.columns
  where table_schema='private' and table_name='matchmaking_queue' and column_name='gender_scope'
) as queue_scope_exists;

select to_regprocedure('public.claim_player_profile_v2(text,text,text,text,text,text)') is not null as claim_v2_exists,
       to_regprocedure('public.get_my_player_profile_v2()') is not null as my_profile_v2_exists,
       to_regprocedure('public.set_my_gender_once(text)') is not null as set_gender_exists,
       to_regprocedure('public.get_public_ranked_players(text)') is not null as ranked_rpc_exists;
```

Expected before migration: all booleans `false`.

- [ ] **Step 2: Apply additive columns and constraints**

Migration SQL starts with:

```sql
alter table public.players
  add column if not exists gender text;

alter table public.players
  drop constraint if exists players_gender_check;
alter table public.players
  add constraint players_gender_check
  check (gender is null or gender in ('male','female'));

alter table private.matchmaking_queue
  add column if not exists gender_scope text not null default 'all';

alter table private.matchmaking_queue
  drop constraint if exists matchmaking_queue_gender_scope_check;
alter table private.matchmaking_queue
  add constraint matchmaking_queue_gender_scope_check
  check (gender_scope in ('all','same_gender'));
```

Do not backfill existing player gender.

- [ ] **Step 3: Create `get_my_player_profile_v2()`**

Use the existing `get_my_player_profile()` query and append `p.gender` to the return table. Keep the old RPC untouched.

- [ ] **Step 4: Create `set_my_gender_once(p_gender text)`**

Implementation requirements:

```sql
if p_gender not in ('male','female') then
  raise exception 'invalid gender';
end if;

update public.players p
set gender=p_gender
where p.auth_user_id=auth.uid()
  and p.gender is null
returning p.gender into v_gender;

if v_gender is null then
  if exists(select 1 from public.players p where p.auth_user_id=auth.uid()) then
    raise exception 'gender already set';
  end if;
  raise exception 'player profile required';
end if;
```

Return `v_gender`.

- [ ] **Step 5: Create `claim_player_profile_v2(...)`**

Start from the current `claim_player_profile` validation and add:

```sql
if p_gender not in ('male','female') then
  raise exception 'invalid gender';
end if;
```

For an existing authenticated player: update name/mobile/region/city/category as before and set `gender = coalesce(p.gender, p_gender)` so this endpoint cannot overwrite an already-set gender.

For a new player insert: include `gender` in the insert.

Return existing profile fields plus `gender`.

- [ ] **Step 6: Create private public-ranking RPC**

Create `get_public_ranked_players(p_gender text default null)` as `SECURITY DEFINER`, validate `p_gender is null or p_gender in ('male','female')`, select only active players, join `username_registry` by `auth_user_id`, filter internally on gender, and order `rating desc, created_at asc`.

Return these fields only:

```text
id, name, username, region, city, category, rating, rating_status,
games_count, wins, draws, losses, created_at
```

Grant execute to `anon` and `authenticated`.

- [ ] **Step 7: Verify additive profile/ranking behavior**

Run:

```sql
select column_name, is_nullable
from information_schema.columns
where table_schema='public' and table_name='players' and column_name='gender';

select column_name, column_default
from information_schema.columns
where table_schema='private' and table_name='matchmaking_queue' and column_name='gender_scope';

select to_regprocedure('public.claim_player_profile(text,text,text,text,text)') is not null as legacy_claim,
       to_regprocedure('public.get_my_player_profile()') is not null as legacy_profile,
       to_regprocedure('public.start_matchmaking(integer)') is not null as legacy_matchmaking,
       to_regprocedure('public.claim_player_profile_v2(text,text,text,text,text,text)') is not null as claim_v2,
       to_regprocedure('public.get_my_player_profile_v2()') is not null as profile_v2,
       to_regprocedure('public.set_my_gender_once(text)') is not null as set_gender,
       to_regprocedure('public.get_public_ranked_players(text)') is not null as ranked_v2;
```

Expected: gender nullable `YES`, queue scope default `'all'`, all legacy and v2 RPC checks `true`.

- [ ] **Step 8: Commit schema snapshot changes**

Update `schema.sql` to document the new columns and additive RPC names without deleting legacy definitions.

---

### Task 2: Make matchmaking gender-aware without breaking legacy clients

**Files:**
- Database migration via the same Supabase migration or a follow-up `gender_aware_matchmaking`
- Modify: `play.html`
- Modify: `play-live.js`

**Interfaces:**
- Produces `start_matchmaking_v2(p_minutes integer,p_gender_scope text default 'all')`
- Existing `start_matchmaking(p_minutes integer)` remains and always queues `gender_scope='all'`
- `private.try_matchmaking(uuid)` enforces symmetric gender-scope compatibility

- [ ] **Step 1: Define the failing compatibility cases before modifying the matcher**

Required truth table:

```text
male/all       + female/all        => compatible
male/same      + female/all        => incompatible
male/all       + female/same       => incompatible
female/same    + female/all        => compatible
female/same    + female/same       => compatible
NULL/all       + female/all        => compatible
NULL/same      + any               => rejected at queue entry
```

- [ ] **Step 2: Modify legacy `start_matchmaking(integer)` safely**

Keep the signature. Add `gender_scope` to insert/upsert and force `'all'` in both branches:

```sql
insert into private.matchmaking_queue(
  player_id,time_control_minutes,rating_snapshot,gender_scope,
  joined_at,last_seen_at,status,matched_game_id,seat_key_cipher,color,updated_at
)
values(
  v_player.id,p_minutes,v_player.rating,'all',
  clock_timestamp(),clock_timestamp(),'waiting',null,null,null,clock_timestamp()
)
on conflict (player_id) do update
set time_control_minutes=excluded.time_control_minutes,
    rating_snapshot=excluded.rating_snapshot,
    gender_scope='all',
    joined_at=excluded.joined_at,
    last_seen_at=excluded.last_seen_at,
    status='waiting',
    matched_game_id=null,
    seat_key_cipher=null,
    color=null,
    updated_at=excluded.updated_at;
```

This explicit reset is mandatory.

- [ ] **Step 3: Create `start_matchmaking_v2(integer,text)`**

Validate minutes in `(3,5,10)` and scope in `('all','same_gender')`. Load the active player row. If scope is `same_gender` and `v_player.gender is null`, raise `gender required for same gender matchmaking`.

Queue the selected scope in insert and conflict-update, then call `private.try_matchmaking(v_player.id)`.

- [ ] **Step 4: Add symmetric candidate filtering in `private.try_matchmaking`**

After joining candidate player `p`, add:

```sql
and (
  me.gender_scope='all'
  or p.gender=me_player.gender
)
and (
  c.gender_scope='all'
  or me_player.gender=p.gender
)
```

Keep every existing time-control, heartbeat, status, rating-window, ordering, lock, game creation, and seat-key rule unchanged.

- [ ] **Step 5: Verify legacy queue reset and matcher definitions**

Inspect function definitions and confirm:

```sql
select pg_get_functiondef('public.start_matchmaking(integer)'::regprocedure);
select pg_get_functiondef('public.start_matchmaking_v2(integer,text)'::regprocedure);
select pg_get_functiondef('private.try_matchmaking(uuid)'::regprocedure);
```

Expected: legacy function writes `'all'`; v2 writes requested scope; matcher contains both symmetric preference clauses.

- [ ] **Step 6: Add search scope to `play.html`**

Inside `#matchmakingSetup`, below player identity and before time buttons, add a compact control:

```html
<div class="match-scope" aria-label="نطاق البحث عن الخصم">
  <button class="scope-option active" type="button" data-match-scope="all">الجميع</button>
  <button class="scope-option" id="sameGenderScope" type="button" data-match-scope="same_gender">نفس الجنس فقط</button>
</div>
<p class="scope-note" id="sameGenderNote" hidden>أكمل اختيار الجنس من حسابك لاستخدام هذا الخيار.</p>
```

Style it using the existing petrol/gold palette; do not change board layout.

- [ ] **Step 7: Switch `play-live.js` to profile v2 and matchmaking v2**

Add `let myProfile = null; let matchmakingScope = 'all';`.

`loadMyProfile()` calls `get_my_player_profile_v2`, stores the row, and disables `#sameGenderScope` when `profile.gender` is null.

Scope buttons update `matchmakingScope` and active state.

`startMatchmaking(minutes)` calls:

```js
supabase.rpc('start_matchmaking_v2', {
  p_minutes: Number(minutes),
  p_gender_scope: matchmakingScope
});
```

If server returns the gender-required error, show: `أكمل اختيار الجنس من حسابك لاستخدام البحث من نفس الجنس.`

Do not alter challenge RPCs.

- [ ] **Step 8: Run JavaScript syntax checks**

Run locally against the fetched files:

```bash
node --check play-live.js
```

Expected: exit code `0`.

---

### Task 3: Add gender to registration, account completion, and rankings

**Files:**
- Modify: `index.html`
- Modify: `profile.html`
- Modify: `profile.js`

**Interfaces:**
- Registration sends `profileData.gender` to `claim_player_profile_v2`
- Profile loads `get_my_player_profile_v2`
- Existing gender-null accounts call `set_my_gender_once`
- Ranking loads `get_public_ranked_players`

- [ ] **Step 1: Add required registration gender selector**

In `#signupForm` add:

```html
<label>
  <span>الجنس</span>
  <select id="signupGender" required>
    <option value="">اختر</option>
    <option value="male">ذكر</option>
    <option value="female">أنثى</option>
  </select>
</label>
```

Before sign-up, reject an empty value with `اختر ذكر أو أنثى.`.

Add to `profileData`:

```js
gender: $('#signupGender').value
```

This keeps the field in `pending_signup_profile` and Auth metadata across email confirmation.

- [ ] **Step 2: Switch profile claiming to v2**

Change `claimOrCreateProfile(profileData)` to call:

```js
supabase.rpc('claim_player_profile_v2', {
  p_name: profileData.name,
  p_mobile: profileData.mobile,
  p_region: profileData.region,
  p_city: profileData.city,
  p_category: profileData.category || 'open',
  p_gender: profileData.gender
});
```

For stale pending metadata that lacks gender, do not call v2 automatically; keep the user signed in and direct them to account completion instead of inventing a gender.

- [ ] **Step 3: Replace public ranking source**

Add a three-way filter next to existing ranking filters:

```html
<select id="genderFilter" aria-label="تصنيف الرجال والنساء">
  <option value="">الكل</option>
  <option value="male">الرجال</option>
  <option value="female">النساء</option>
</select>
```

`loadPlayers()` calls `get_public_ranked_players` with `p_gender: $('#genderFilter').value || null`, then keeps current region/city client filtering and rendering.

Do not query or render a raw gender field.

- [ ] **Step 4: Add one-time gender card to `profile.html`**

Insert directly below the hero and above stats:

```html
<section class="card gender-completion" id="genderCompletion" hidden>
  <div class="card-head"><h2>إكمال بيانات الحساب</h2></div>
  <p>اختر الجنس مرة واحدة لاستخدام خيارات البحث والتصنيف المناسبة.</p>
  <div class="row-actions">
    <button class="btn" type="button" data-set-gender="male">ذكر</button>
    <button class="btn" type="button" data-set-gender="female">أنثى</button>
  </div>
</section>
```

- [ ] **Step 5: Switch `profile.js` to profile v2 and bind one-time save**

`loadBaseProfile()` calls `get_my_player_profile_v2` and toggles `genderCompletion.hidden = Boolean(row.gender)`.

On `[data-set-gender]` click, call:

```js
client.rpc('set_my_gender_once', { p_gender: button.dataset.setGender });
```

On success set `myProfile.gender` and hide the card. On `gender already set`, reload profile and hide the card. Do not add gender to `playerMeta` or public profile.

- [ ] **Step 6: Verify frontend source expectations**

Search the deployed-source files and confirm:

```text
index.html: signupGender, claim_player_profile_v2, get_public_ranked_players, genderFilter
profile.html: genderCompletion
profile.js: get_my_player_profile_v2, set_my_gender_once
```

---

### Task 4: Add admin visibility, filtering, correction, and audit

**Files:**
- Database migration via Supabase
- Modify: `admin.html`
- Modify: `admin.js`

**Interfaces:**
- Produces `admin_list_players_v2(p_search text,p_status text,p_city text,p_gender text)`
- Produces `admin_get_player_v2(p_player_id uuid)`
- Produces `admin_set_player_gender(p_player_id uuid,p_gender text,p_reason text)`
- Adds `gender_change` to allowed `private.admin_actions.action_type`

- [ ] **Step 1: Extend admin audit constraint**

Replace the action-type check with the current values plus `gender_change`:

```sql
check (action_type in (
  'ban','unban','rating_plus_10','rating_minus_10','close_report','gender_change'
))
```

- [ ] **Step 2: Create versioned admin read RPCs**

`admin_list_players_v2` uses `private.require_admin()`, accepts optional `p_gender`, validates it, returns existing list fields plus gender, and filters by gender when supplied.

`admin_get_player_v2` returns the existing player detail plus gender and unchanged last-games JSON.

- [ ] **Step 3: Create `admin_set_player_gender`**

Requirements:

```sql
perform private.require_admin();
if p_gender not in ('male','female') then raise exception 'invalid gender'; end if;
if char_length(btrim(coalesce(p_reason,''))) < 3 then raise exception 'reason required'; end if;

update public.players set gender=p_gender where id=p_player_id;
if not found then raise exception 'player not found'; end if;

insert into private.admin_actions(
  admin_auth_user_id,player_id,action_type,reason
) values (
  auth.uid(),p_player_id,'gender_change',btrim(p_reason)
);
```

Return the saved gender.

- [ ] **Step 4: Add admin gender filter and table/detail field**

`admin.html` player toolbar gets:

```html
<select id="playerGenderFilter" class="field">
  <option value="">كل الجنسين</option>
  <option value="male">ذكر</option>
  <option value="female">أنثى</option>
</select>
```

Add a `الجنس` column in the player table and a gender detail item in the player modal.

- [ ] **Step 5: Switch admin JS reads to v2**

`loadPlayers()` calls `admin_list_players_v2` with `p_gender` from the new filter. `openPlayer()` calls `admin_get_player_v2`.

Map display values with:

```js
const genderLabel = value => value === 'male' ? 'ذكر' : value === 'female' ? 'أنثى' : 'غير محدد';
```

- [ ] **Step 6: Add admin correction action**

In player modal actions add `تعديل الجنس`. The action dialog must require a reason and a selected target gender. Submit calls `admin_set_player_gender` and then reloads the selected player and admin action list.

Add to `actionLabel`:

```js
gender_change: 'تعديل الجنس'
```

- [ ] **Step 7: Verify admin audit**

After a controlled correction in admin testing, run:

```sql
select action_type, reason, player_id, created_at
from private.admin_actions
where action_type='gender_change'
order by created_at desc
limit 5;
```

Expected: one row with non-empty reason for each correction.

---

### Task 5: Deployment and regression verification

**Files:**
- No new feature files; verification only

**Interfaces:**
- Confirms database, frontend, GitHub Pages, legacy compatibility, and privacy acceptance criteria.

- [ ] **Step 1: Verify database constraints and RPC inventory**

Run:

```sql
select gender, count(*) from public.players group by gender order by gender nulls first;
select gender_scope, count(*) from private.matchmaking_queue group by gender_scope order by gender_scope;

select proname, pg_get_function_identity_arguments(oid)
from pg_proc
where pronamespace in ('public'::regnamespace,'private'::regnamespace)
  and proname in (
    'claim_player_profile','claim_player_profile_v2',
    'get_my_player_profile','get_my_player_profile_v2','set_my_gender_once',
    'get_public_ranked_players','start_matchmaking','start_matchmaking_v2',
    'try_matchmaking','admin_list_players_v2','admin_get_player_v2','admin_set_player_gender'
  )
order by proname;
```

- [ ] **Step 2: Verify privacy**

Inspect `get_public_player_profile` definition and ensure its return columns still do not include gender. Inspect `get_public_ranked_players` and ensure it does not return mobile, auth IDs, or raw gender.

- [ ] **Step 3: Verify legacy matchmaking semantics**

Inspect `start_matchmaking(integer)` and confirm every insert/upsert path sets `gender_scope='all'`.

- [ ] **Step 4: Verify UI manually on desktop and mobile**

Checklist:

```text
New signup: gender required.
Existing gender-null account: account opens; one-time gender card appears.
After one-time save: card disappears after reload.
Ranking: all/men/women switches correctly; region/city filters still work.
Play search: all is default.
Gender-null account: same-gender option disabled with explanation.
Gender-set account: same-gender option enabled.
Friend challenge controls unchanged.
Admin: gender visible, filter works, correction asks for reason.
Public player page: no prominent gender field added.
```

- [ ] **Step 5: Verify JavaScript syntax**

Run against fetched repository files:

```bash
node --check play-live.js
node --check profile.js
node --check admin.js
```

For inline `index.html` JavaScript, extract the final script body to a temporary `.js` file and run `node --check` on it.

- [ ] **Step 6: Verify GitHub Pages deployment**

After the final commit, confirm the `pages build and deployment` workflow for that exact head SHA has successful `build`, `report-build-status`, and `deploy` jobs before telling the user the feature is live.

- [ ] **Step 7: Final acceptance check**

Confirm every acceptance criterion in the spec explicitly, with special attention to the two high-risk rules:

```text
same_gender can never cross gender, even when the other player chose all.
legacy start_matchmaking always resets queue scope to all.
```
