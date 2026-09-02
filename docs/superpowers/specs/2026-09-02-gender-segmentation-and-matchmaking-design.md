# Gender Segmentation and Matchmaking Design

## Goal
Add a required player gender classification (`male` / `female`) for new registrations, allow existing players to set it once, provide public ranking filters for all/men/women, expose gender to admins only, and let players choose whether random matchmaking searches everyone or only players of the same gender.

## Product behavior
- New registration requires choosing **ذكر** or **أنثى** before the player profile is created.
- Existing players with no stored gender see a one-time completion control inside their own account. After it is set, ordinary users cannot change it.
- Gender is not displayed as a prominent field on the public player profile.
- Ranking offers three scopes: **الكل | الرجال | النساء**.
- Random matchmaking offers **الجميع | نفس الجنس فقط** for every search.
- If an existing player has no gender yet, **نفس الجنس فقط** is unavailable until the player completes the one-time gender field.
- Admin player management can see and filter by gender. Admins can correct a player's gender when necessary and the action must be auditable through the existing admin action mechanism or a reason-bearing admin RPC.

## Data model
Add `public.players.gender text null` with a check constraint allowing only `male` and `female`. It stays nullable during migration so existing accounts and current gameplay are not broken.

Add `private.matchmaking_queue.gender_scope text not null default 'all'` with a check constraint allowing `all` and `same_gender`.

Do not add gender to the existing public player profile RPC. Public ranking access should use a dedicated RPC that accepts a gender filter server-side and returns the same public ranking fields without returning a raw `gender` column.

## Backward compatibility
Production RPCs currently used by the site must remain callable during deployment. Add versioned/additive RPCs rather than replacing a live signature in a way that can break the current frontend:
- `claim_player_profile_v2(..., p_gender text)`
- `get_my_player_profile_v2()`
- `set_my_gender_once(p_gender text)`
- `get_public_ranked_players(p_gender text default null)`
- `start_matchmaking_v2(p_minutes integer, p_gender_scope text default 'all')`

The existing `claim_player_profile`, `get_my_player_profile`, and `start_matchmaking` functions remain available until the frontend has moved to the new functions.

## Registration and own-account flow
`index.html` adds a required gender selector to account creation and passes it to `claim_player_profile_v2` after email confirmation.

`profile.html` / `profile.js` use `get_my_player_profile_v2`. When `gender` is null, the account shows a compact one-time completion card with two choices. `set_my_gender_once` must reject attempts if gender is already set.

## Rankings
The home ranking UI keeps existing region/city filtering and adds a gender scope control. `get_public_ranked_players(null)` returns all active players, `male` returns active men, and `female` returns active women. The RPC returns public fields only: player id, name, username where available, region, city, category, rating, rating status, created date, and existing public statistics as needed by the current table. Gender itself need not be returned.

## Matchmaking compatibility rule
Each queued player has `gender_scope`.

A candidate is compatible only if all current conditions still pass (active status, same time control, heartbeat freshness, rating window) and both players' gender preferences are satisfied:

```text
(me.scope = 'all' OR opponent.gender = me.gender)
AND
(opponent.scope = 'all' OR me.gender = opponent.gender)
```

This is symmetric. A player who requests same-gender play can never be matched with the other gender even if the other player selected everyone.

`start_matchmaking_v2` rejects `same_gender` if the caller's gender is null. `all` remains compatible with legacy players whose gender is still null, so rollout does not stop existing matchmaking.

## Play UI
`play.html` adds a search-scope selector beside the existing time controls. `play-live.js` loads `get_my_player_profile_v2`, disables same-gender search for legacy accounts without gender, and sends the selected scope to `start_matchmaking_v2`.

The selected scope affects only the current random matchmaking search. Friend challenges remain unchanged.

## Admin UI
`admin_list_players` / `admin_get_player` gain gender through additive/versioned admin RPCs if changing the existing return type would be unsafe. `admin.html` / `admin.js` add a gender filter and show gender in the player detail. An admin correction RPC validates `male`/`female`, requires a reason, and records the change.

## Privacy
- Gender is stored in the player row but not added to the ordinary public player profile.
- Public ranking endpoints reveal membership only through the selected ranking category and do not return mobile, auth IDs, or any private fields.
- Matchmaking performs gender checks server-side; the queue remains private.

## Rollout order
1. Database migration with nullable gender, new RPCs, queue scope, and compatibility logic while preserving current RPCs.
2. Verify current `start_matchmaking` still works with default/all behavior.
3. Deploy registration, profile completion, ranking filters, admin view, and play search-scope UI.
4. Verify GitHub Pages deployment and production RPC behavior.

## Acceptance criteria
- A new account cannot finish player registration without choosing male/female.
- Existing accounts continue to log in and play using `all` before completing gender.
- Existing accounts can set gender once from their own account.
- Ranking can switch among all/men/women without exposing private player data.
- A `same_gender` queue entry never matches the other gender.
- Two compatible same-gender players can still match under the existing time/rating rules.
- An `all` search still matches normally and friend challenges are unaffected.
- Admin can see/filter gender and correct it with a reason.
