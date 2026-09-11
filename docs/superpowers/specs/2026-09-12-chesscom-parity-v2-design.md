# Shatranj V2 — Full Chess Platform Design

Date: 2026-09-12
Status: Approved design baseline pending final spec review
Reference product: Chess.com (feature-parity inspiration only)
Product identity: شطرنج العرب

## 1. Goal

Build Shatranj V2 as a full Arabic-first chess platform with breadth comparable to Chess.com while preserving our own brand, codebase, data model, visual identity, terminology, and product decisions.

This is not a source-code clone and must not copy Chess.com trademarks, logos, proprietary assets, text, or private implementation details. We reproduce product capabilities and interaction patterns with original implementation.

## 2. Migration Principle

Do not replace the current production site in one step.

Shatranj V2 is introduced incrementally inside the existing repository. Existing users, accounts, ratings/points, completed games, tournaments, profiles, and spectator features remain available throughout migration.

Each subsystem must be independently releasable and reversible. Existing production flows remain the fallback until their V2 replacement passes tests and live verification.

## 3. Core Architecture

### Frontend

Keep the current static/GitHub Pages delivery model initially, but reorganize the frontend around clear feature modules instead of continuing to grow large mixed-purpose HTML and JavaScript files.

Primary product areas:

- Home
- Play
- Computer
- Puzzles
- Learn
- Train
- Analysis
- Tournaments
- Watch
- Community
- Clubs
- Players
- Profile
- Statistics
- Settings
- Administration

Shared frontend services:

- Authentication/session
- Realtime presence
- Notifications
- Chessboard rendering
- Time controls/clocks
- Player identity/profile cards
- Ratings/points display
- Navigation/layout shell
- Error/loading states

### Backend

Supabase remains the primary backend for:

- Auth
- PostgreSQL data
- Realtime state
- Row-level security
- RPCs
- Edge Functions
- Storage where needed

Server-authoritative operations are required for competitive game state, clocks, matchmaking, rating settlement, tournament state, puzzle scoring, challenge acceptance, and abuse-sensitive actions.

### Chess engine

Use the existing Stockfish integration as the base for:

- Computer play
- Analysis
- Game review
- Move evaluation
- Training feedback

Engine work must remain isolated from authoritative multiplayer game state.

## 4. Product Modules

### 4.1 Home

The home page becomes the central dashboard, not a marketing-only page.

It includes:

- Primary Play action
- Quick time controls
- Current/live games
- Invitations/challenges
- Friends/online players summary
- Tournament highlights
- Puzzle of the day
- Recent activity
- Player points and selected stats
- Watch/live games entry

The current Arab identity and Arabic RTL experience remain first-class.

### 4.2 Play

Supported play modes:

- Instant matchmaking
- Custom matchmaking
- Rated game
- Unrated game
- Challenge a player
- Friend challenge
- Daily/correspondence chess
- Rematch
- Computer play
- Chess960
- Additional variants added behind feature flags

Initial standard time controls continue to support existing 5/10/15-minute modes, then expand to configurable presets and increments.

The live game screen must provide:

- Board
- Two players
- Accurate clocks
- Last-move indication
- Captures/game state where appropriate
- Resign
- Offer draw
- Grace-end behavior where already approved
- Rematch after completion
- Return home
- Open player profile
- Spectator-compatible state

Desktop and mobile layouts may differ, but game rules and server state must be identical.

### 4.3 Matchmaking

Matchmaking is a dedicated subsystem.

Inputs may include:

- Game mode
- Time control
- Rated/unrated
- Player rating/points band
- Variant
- Challenge target

Rules:

- Prevent duplicate queue entries
- Prevent matching a player with themselves
- Atomically claim both players
- Create exactly one game
- Remove stale queue entries
- Recover cleanly from disconnects
- Preserve existing eligibility rules where still required

### 4.4 Rating / Points

The public Arabic product continues to use the term «النقاط» where already adopted.

Rating settlement is server-authoritative and idempotent.

The system must support separate rating pools per relevant mode where needed, while presenting a simple default score to ordinary users.

No frontend calculation may be trusted as the source of truth for competitive rating changes.

### 4.5 Computer Play

Computer games continue to use Stockfish with selectable difficulty.

Requirements:

- Stable clocks
- Legal-move validation
- Difficulty presets
- Player color choice
- Takeback only where intentionally enabled
- Game result settlement
- Optional rating separation from human games

Computer games must never be counted as human live games in statistics unless explicitly labeled.

### 4.6 Profiles and Players

Each player has a public profile with:

- Username/display name
- Avatar
- Country/city where allowed
- Points/rating
- Online status when appropriate
- Join date
- Game counts
- Wins/losses/draws
- Recent games
- Tournament results
- Achievements
- Friends/follow relationship when enabled

Player names are clickable throughout the product.

### 4.7 Friends, Challenges and Social Graph

Add a social graph supporting:

- Friend/follow request
- Accept/reject
- Remove
- Block
- Online indicators
- Direct game challenge

Blocking must affect invitations, direct challenges, and messaging.

### 4.8 Messaging and Community

Community is implemented in phases:

- Player-to-player messages
- Club messages/discussions
- Tournament chat where enabled
- Moderation/reporting

All user-generated content requires moderation controls, rate limits, abuse reporting, and block enforcement.

### 4.9 Clubs

Clubs include:

- Club profile
- Owner/admin/member roles
- Join/request-to-join modes
- Member list
- Club announcements
- Club events/tournaments
- Club leaderboard

### 4.10 Tournaments

Preserve the existing tournament engine and extend it rather than replacing it blindly.

Target tournament families:

- Arena
- Swiss
- Scheduled knockout/round-based events where supported
- Daily/correspondence tournaments later

Tournament infrastructure includes:

- Registration
- Capacity rules
- Eligibility
- Start engine
- Pairings
- Round transitions
- Standings
- Tie-breaks
- Spectator links
- Results
- Rating settlement
- Admin controls

### 4.11 Watch / Spectator

Spectating is a first-class feature.

Users can:

- View current live games
- Open a selected game
- See board and clocks
- Open player profiles
- Follow tournament games

Spectators are read-only and cannot mutate game state.

### 4.12 Puzzles

Puzzle subsystem includes:

- Rated puzzles
- Puzzle of the day
- Theme/category filtering
- Puzzle history
- Puzzle rating
- Streak mode
- Timed Rush-style mode
- Battle-style head-to-head puzzle mode later

Puzzle positions are stored with canonical solutions and metadata.

Scoring and competitive puzzle modes are server-authoritative.

### 4.13 Learn

Learning content includes:

- Structured lessons
- Courses
- Openings
- Middlegame concepts
- Endgames
- Interactive positions
- Progress tracking

Content must be original, licensed, or user-created with appropriate rights.

### 4.14 Train

Training includes:

- Opening rehearsal
- Endgame drills
- Tactical themes
- Board vision drills
- Custom positions

Training progress is stored separately from competitive ratings.

### 4.15 Analysis

Analysis board supports:

- Load completed game
- Free analysis board
- FEN import
- PGN import/export where appropriate
- Stockfish evaluation
- Principal variations
- Best-line exploration
- Move navigation

### 4.16 Game Review

Game Review is built on top of the analysis service and adds:

- Accuracy estimate
- Best move comparison
- Inaccuracy/mistake/blunder classification
- Critical moments
- Summary feedback
- Replay navigation

The scoring model must be ours; Chess.com labels or proprietary evaluation formulas are not copied.

### 4.17 Statistics

Statistics support:

- Games played
- Results
- Rating history
- Performance by time control
- Performance by color
- Tournament history
- Puzzle history
- Streaks
- Recent activity

### 4.18 Achievements and Streaks

Optional engagement systems include:

- Achievements
- Daily activity streaks
- Puzzle streaks
- Milestones

These are informational/engagement features and must not affect competitive game integrity.

### 4.19 Notifications

Unify existing site notification code into one service supporting:

- Friend requests
- Challenges
- Game start
- Game result
- Tournament start
- Tournament round
- Messages
- Club activity
- System notices

Notifications have read/unread state and deep links to the relevant object.

### 4.20 Settings

Settings include:

- Account
- Profile
- Privacy
- Board appearance
- Piece set
- Sound
- Notifications
- Language
- Time zone
- Blocking

### 4.21 Administration

Extend the current admin system to manage:

- Players
- Reports
- Suspensions/bans
- Games
- Tournaments
- Clubs
- Messages/content moderation
- Puzzles
- Learning content
- Site notices
- Feature flags
- Basic operational metrics

Admin actions must be authorized server-side, not by frontend visibility alone.

## 5. Data Model Direction

Do not create one oversized table.

Target domains include separate tables/entities for:

- profiles
- games
- game_moves
- matchmaking_queue
- challenges
- friendships / follows
- blocks
- tournaments
- tournament_registrations
- tournament_matches
- clubs
- club_members
- messages
- reports
- notifications
- puzzles
- puzzle_attempts
- lessons
- lesson_progress
- achievements
- user_achievements
- rating_history

Existing tables are migrated or extended where practical. New tables must respect RLS and ownership boundaries.

## 6. Realtime and Data Flow

### Live game flow

1. Player requests a game.
2. Matchmaking finds/creates an opponent pair.
3. Backend creates one authoritative game.
4. Both clients subscribe to game state.
5. A move is submitted to the backend.
6. Backend validates turn, legality, terminal state, and timing.
7. Backend commits state.
8. Realtime publishes the new state.
9. Clients render the committed state.

Clients may use optimistic UI only where it cannot compromise correctness.

### Challenge flow

1. Challenger creates a challenge.
2. Target receives a notification.
3. Accept executes atomically.
4. One game is created.
5. Challenge closes.

### Tournament flow

Registration, pairings, rounds, standings, and settlement remain backend-owned and idempotent.

## 7. Reliability and Error Handling

Every competitive workflow must be retry-safe.

Required behaviors:

- No duplicate games from repeated requests
- No duplicate rating settlement
- No clock rollback
- No illegal move acceptance
- No double tournament registration
- No duplicate challenge acceptance
- Clear recovery after network interruption
- Reconnect to existing active game instead of creating a new one

User-visible errors must be concise Arabic messages with actionable retry behavior.

## 8. Security and Integrity

Required controls:

- Supabase RLS on user-owned/private records
- Server-side admin authorization
- Rate limiting on messaging/challenges/competitive actions
- Input validation
- Idempotency keys or equivalent transaction guards
- Audit trail for moderation/admin actions
- Blocks enforced server-side
- No trust in client-provided rating/result values

Anti-cheat can be added as a dedicated later subsystem; the architecture must allow engine-correlation signals and review queues without blocking V2 core delivery.

## 9. Compatibility

The current site remains operational during migration.

Compatibility requirements:

- Existing accounts continue to sign in
- Existing profile URLs continue to resolve or redirect safely
- Existing points remain intact
- Existing tournament data remains accessible
- Current game/spectator URLs either remain valid or redirect to the V2 route
- Existing approved chess piece assets remain available until a user-approved replacement is adopted

## 10. Visual Design Direction

We borrow interaction hierarchy from leading chess platforms but retain the project's own visual identity.

Keep:

- Arabic RTL as first-class
- Existing approved turquoise/petrol visual family where it remains suitable
- Existing approved board/piece direction unless separately redesigned
- Mobile-specific layouts where they improve playability

Do not copy Chess.com logo, exact branded colors as a trademark imitation, proprietary icons, illustrations, or premium artwork.

## 11. Delivery Strategy

The full platform is decomposed into release programs, each with its own implementation spec/plan:

1. Platform shell and shared services
2. V2 live play and matchmaking
3. Profiles, social graph and challenges
4. Tournaments and spectator consolidation
5. Puzzles
6. Analysis and Game Review
7. Learning and training
8. Clubs, messaging and community moderation
9. Statistics, achievements and notifications
10. Administration consolidation
11. Optional premium/monetization layer

No later program is allowed to destabilize live play.

## 12. Testing Strategy

For each subsystem:

- Unit tests for isolated logic
- Integration tests for Supabase/RPC boundaries
- Regression tests for existing behaviors
- Mobile and desktop layout tests
- Realtime reconnect tests
- Idempotency/duplicate-request tests
- Permission/RLS tests

Critical competitive paths additionally require tests for clocks, move legality, settlement, reconnection, and concurrency.

## 13. Success Criteria

Shatranj V2 is successful when:

- Existing users can migrate without losing accounts or data
- Human live games are reliable on mobile and desktop
- Competitive state is server-authoritative
- Matchmaking and challenges cannot create duplicate games
- Tournaments and spectator mode remain stable
- Puzzles, learning, analysis, clubs and community are available as independent modules
- Product navigation feels unified rather than like separate legacy pages
- Arabic is the primary polished experience
- The platform reaches broad feature parity with Chess.com without copying protected implementation or brand assets

## 14. First Implementation Program

The first implementation program after this architecture is approved is:

**Platform Shell + V2 Live Play Foundation**

It will define the shared navigation/layout shell, route structure, common session/profile services, and the new authoritative live-play/matchmaking boundary. All later modules will build on these interfaces.
