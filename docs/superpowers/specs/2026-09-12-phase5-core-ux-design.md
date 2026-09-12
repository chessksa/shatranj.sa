# Phase 5 Core UX Design

## Goal

Close the remaining daily-use gaps in the main product loop: configurable matchmaking, rematch, enforceable account/privacy preferences, and a signed-in home dashboard. Preserve the approved Shatranj identity and all existing V2/V3/V4 competitive systems.

## Custom matchmaking

Add a V5 matchmaking RPC boundary using exact `base_seconds`, `increment_seconds`, and `rated` fields. Default UI presets remain 5/10/15, but players may choose a custom base time and increment. Competitive state remains server-authoritative and matchmaking remains atomic.

Supported limits for this phase:
- base: 30 seconds to 60 minutes
- increment: 0 to 60 seconds
- rated or friendly
- standard chess only

The existing V2 queue table is extended rather than replaced, with backwards-compatible `base_minutes` retained for legacy callers.

## Rematch

Rematch is a challenge linked to a completed V2 game. Either participant may request it. The opponent must accept; one player cannot silently create the next game.

Rules:
- source game must be completed and caller must be a participant
- same time control and rated/friendly state
- same opponent
- colors swap from the source game
- at most one live pending rematch challenge per source game
- acceptance creates exactly one new game
- both players receive deep-linked notification state
- regular challenge UI remains compatible

## Preferences and privacy

Create one player-owned settings row with RPC access only. Initial enforceable preferences:
- allow direct challenges
- allow direct messages
- notifications enabled
- public profile enabled
- sound enabled (client preference)
- timezone (validated against PostgreSQL timezone names)

Challenge and direct-message RPCs must enforce recipient preferences server-side. Public-profile RPCs must not expose a player who disabled public profile except to themselves/admin paths. A notification trigger suppresses ordinary notifications when disabled while allowing security/moderation/system notices.

## Home dashboard

For signed-in users, add a compact dashboard section to the existing home without replacing its approved layout. It shows:
- current points and game summary
- active game / resume link
- pending incoming challenges
- friends online count
- next relevant tournament
- puzzle-of-the-day entry
- activity streak
- shortcuts to analysis, stats, clubs, notifications, and variants

The dashboard uses one scoped RPC where practical to avoid reading private tables from the browser.

## Security

- RLS on settings table
- no direct authenticated writes to competitive queue/game tables
- rematch acceptance row-locks the challenge
- settings update validates known fields and timezone
- message/challenge blocking remains in force in addition to preferences
- dashboard returns only the current player's own private aggregates

## Verification

Use TDD contract tests, rollback-only PostgreSQL integration for custom matchmaking and rematch, CI syntax/contracts, Supabase advisor, and Pages deployment verification. A real two-account browser smoke test must not be claimed unless actually performed.