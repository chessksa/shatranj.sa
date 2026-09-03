# Member Dashboard Icon Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the five collapsible member-dashboard sections with equal icon navigation tiles that show counts beside their icons and open one shared section-details page.

**Architecture:** `profile.html` keeps identity, stats, recent games, and achievements, but replaces inline friend/request/challenge lists with five equal navigation tiles. `profile.js` loads only the five dashboard counts. A new `profile-section.html` + `profile-section.js` pair renders one selected section from `?section=...`, reusing the current Supabase RPCs and action semantics without any database changes.

**Tech Stack:** Static HTML/CSS/JavaScript, Supabase JS v2, GitHub Pages, Python structural regression tests, Node syntax check.

**Spec:** `docs/superpowers/specs/2026-09-03-member-dashboard-icon-navigation-design.md`

## Global Constraints

- Keep `profile.html` colors aligned with the current homepage palette: `#082d2f`, `rgba(13,56,57,.88)`, `#d4b467`, `#f4eddc`, `#adc1bc`.
- Keep the member identity card and five statistics intact.
- Keep `recentGames` and `achievementsList` visible on `profile.html`.
- Do not change database schema, RPC signatures, matchmaking, or live-game logic.
- Keep friend/request/challenge actions functionally equivalent to the current `profile.js` behavior.
- Dashboard icon tiles must be equal-size and responsive; the count is displayed in the same inline visual row as the icon.

---

### Task 1: Dashboard icon navigation regression tests

**Files:**
- Create: `tests/test_profile_icon_navigation.py`
- Create: `.github/workflows/test-profile-icon-navigation.yml`

**Interfaces:**
- Consumes: existing `profile.html`, `profile.js`.
- Produces: structural assertions for five navigation links and count-only dashboard loading.

- [ ] **Step 1: Write the failing test**

The test must assert:
- exactly five links with class `profile-nav-item`;
- destinations `profile-section.html?section=friends`, `friend-requests`, `sent-requests`, `challenges`, `sent-challenges`;
- count IDs `friendsCount`, `incomingCount`, `outgoingCount`, `incomingChallengesCount`, `outgoingChallengesCount` appear inside those links;
- `.profile-nav-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr))` and `.profile-nav-item{min-height:86px` exist;
- no `data-collapse-target` remains in `profile.html`;
- `recentGames` and `achievementsList` remain visible;
- `profile.js` defines and calls `loadProfileNavigationCounts()` and no longer defines `setupProfileSectionToggles()`.

- [ ] **Step 2: Run test to verify it fails**

Run: `python tests/test_profile_icon_navigation.py`
Expected: FAIL because the current dashboard still uses collapsible rows.

- [ ] **Step 3: Commit the test only**

```bash
git add tests/test_profile_icon_navigation.py .github/workflows/test-profile-icon-navigation.yml
git commit -m "test: define member dashboard icon navigation"
```

### Task 2: Replace collapsible dashboard rows with icon navigation

**Files:**
- Modify: `profile.html`
- Modify: `profile.js`
- Test: `tests/test_profile_icon_navigation.py`

**Interfaces:**
- Consumes: `get_my_friends`, `get_my_friend_requests`, `get_my_friend_challenges`.
- Produces: `loadProfileNavigationCounts(): Promise<void>` and five stable count element IDs.

- [ ] **Step 1: Implement five equal dashboard links**

Insert one `profile-nav-grid` before the always-visible recent-games card. Use five anchors with one icon/count row and one label:

```html
<a class="profile-nav-item" href="profile-section.html?section=friends">
  <span class="profile-nav-main"><span class="profile-nav-icon">👥</span><strong id="friendsCount">0</strong></span>
  <span class="profile-nav-label">الأصدقاء</span>
</a>
```

Use equivalent items for friend requests, sent requests, incoming challenges, and sent challenges with distinct simple icons.

- [ ] **Step 2: Add equal sizing and responsive layout**

```css
.profile-nav-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin:7px 0}
.profile-nav-item{min-height:86px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:10px 8px;border:1px solid var(--line);border-radius:12px;background:rgba(13,56,57,.88);text-align:center}
.profile-nav-main{display:flex;align-items:center;justify-content:center;gap:7px}.profile-nav-icon{font-size:24px;line-height:1}.profile-nav-main strong{font-size:16px;color:var(--gold)}
.profile-nav-label{font-size:12px;color:var(--cream);white-space:nowrap}
@media(max-width:620px){.profile-nav-grid{grid-template-columns:repeat(5,minmax(72px,1fr));overflow-x:auto}.profile-nav-item{min-height:78px}.profile-nav-label{font-size:11px}}
```

- [ ] **Step 3: Replace full-list dashboard loading with count loading**

Implement:

```js
async function loadProfileNavigationCounts() {
  const [{ data: friends, error: fErr }, { data: requests, error: rErr }, { data: challenges, error: cErr }] = await Promise.all([
    client.rpc('get_my_friends'),
    client.rpc('get_my_friend_requests'),
    client.rpc('get_my_friend_challenges')
  ]);
  if (fErr) throw fErr;
  if (rErr) throw rErr;
  if (cErr) throw cErr;
  const friendRequests = requests || [];
  const challengeRows = challenges || [];
  $('friendsCount').textContent = (friends || []).length;
  $('incomingCount').textContent = friendRequests.filter(r => r.direction === 'incoming').length;
  $('outgoingCount').textContent = friendRequests.filter(r => r.direction === 'outgoing').length;
  $('incomingChallengesCount').textContent = challengeRows.filter(r => r.direction === 'incoming' && r.status === 'pending').length;
  $('outgoingChallengesCount').textContent = challengeRows.filter(r => r.direction === 'outgoing' && r.status === 'pending').length;
}
```

Call it during startup and presence refresh. Remove inline collapse setup and avoid writing list markup into dashboard-only elements that no longer exist.

- [ ] **Step 4: Run tests**

Run:
```bash
python tests/test_profile_icon_navigation.py
python tests/test_profile_compact_layout.py
python tests/test_global_arial_font.py
node --check profile.js
```
Expected: all PASS.

- [ ] **Step 5: Commit dashboard implementation**

```bash
git add profile.html profile.js
git commit -m "feat: add member dashboard icon navigation"
```

### Task 3: Unified profile-section page and behavior

**Files:**
- Create: `profile-section.html`
- Create: `profile-section.js`
- Create: `tests/test_profile_section_page.py`
- Modify: `.github/workflows/test-profile-icon-navigation.yml`

**Interfaces:**
- Consumes query parameter `section` with values `friends`, `friend-requests`, `sent-requests`, `challenges`, `sent-challenges`.
- Consumes existing RPCs: `get_my_friends`, `get_my_friend_requests`, `get_my_friend_challenges`, `respond_friend_request`, `remove_friend`, `send_friend_challenge`, `respond_friend_challenge`, `cancel_friend_challenge`, `get_my_challenge_game_access`.
- Produces one list container `sectionList`, title `sectionTitle`, and existing action button semantics via `data-action`.

- [ ] **Step 1: Write the failing section-page test**

Assert the new HTML loads `config.js`, Supabase JS v2, and `profile-section.js`; contains `sectionTitle`, `sectionList`, a `profile.html` back link, the friend-challenge modal, and homepage palette colors. Assert JS defines a five-entry `SECTION_CONFIG`, reads `new URLSearchParams(location.search).get('section')`, uses the three required list RPCs, supports request/challenge actions, and redirects unauthenticated sessions to `index.html#register`.

- [ ] **Step 2: Run test to verify RED**

Run: `python tests/test_profile_section_page.py`
Expected: FAIL because the page files do not exist.

- [ ] **Step 3: Implement `profile-section.html`**

Create a compact page with:
- brand + `العودة للوحة العضو`;
- dynamic `sectionTitle`;
- card containing `sectionList`;
- the same challenge-time modal controls (`challengeModal`, `challengeMinutes`, `sendChallengeBtn`, `cancelChallengeModalBtn`);
- `toast` and script includes.

- [ ] **Step 4: Implement `profile-section.js`**

Use this configuration shape:

```js
const SECTION_CONFIG = {
  friends: { title: 'الأصدقاء', kind: 'friends' },
  'friend-requests': { title: 'طلبات الصداقة', kind: 'requests', direction: 'incoming' },
  'sent-requests': { title: 'الطلبات المرسلة', kind: 'requests', direction: 'outgoing' },
  challenges: { title: 'التحديات', kind: 'challenges', direction: 'incoming' },
  'sent-challenges': { title: 'التحديات المرسلة', kind: 'challenges', direction: 'outgoing' }
};
```

Load only the selected dataset, filter requests by direction and challenges by direction + `status === 'pending'`, and render the same row actions as the current dashboard implementation. After every mutation, call `loadSection()` again. Retain accepted-challenge game-access sessionStorage keys and redirect to `play.html?game=...&challenge=...`.

- [ ] **Step 5: Run section tests and JS syntax check**

Run:
```bash
python tests/test_profile_section_page.py
python tests/test_profile_icon_navigation.py
node --check profile-section.js
node --check profile.js
```
Expected: all PASS.

- [ ] **Step 6: Commit unified section page**

```bash
git add profile-section.html profile-section.js tests/test_profile_section_page.py .github/workflows/test-profile-icon-navigation.yml
git commit -m "feat: add unified member section page"
```

### Task 4: Final regression and deployment verification

**Files:**
- Verify only; no feature changes unless a failing regression requires a focused fix.

**Interfaces:**
- Produces evidence that the merged commit is safe to deploy.

- [ ] **Step 1: Run profile-focused suite**

```bash
python tests/test_profile_icon_navigation.py
python tests/test_profile_section_page.py
python tests/test_profile_compact_layout.py
python tests/test_global_arial_font.py
node --check profile.js
node --check profile-section.js
```
Expected: all PASS with zero failures.

- [ ] **Step 2: Verify GitHub Pages build and deploy jobs**

Confirm the final `main` commit's Pages workflow has successful `build`, `report-build-status`, and `deploy` jobs.
