# Phase 4 Advanced Variants Design

## Goal

Complete the remaining major chess variants in the existing Shatranj V3 variants subsystem without changing the approved site identity or weakening server authority.

## Supported variants

- Crazyhouse
- Atomic
- Antichess
- Horde
- Racing Kings

The already-shipped Chess960, Three-Check, and King of the Hill remain unchanged.

## Architecture

Use `chessops@0.15.1` only inside a JWT-protected Supabase Edge Function. The browser never decides legality, outcomes, pockets, forced captures, explosions, horde rules, or racing-kings wins. PostgreSQL remains the authoritative persistence layer for matchmaking, clocks, ratings, move history, and results.

Extend `v3_variant_games`, `v3_variant_queue`, and `v3_variant_ratings` to accept the five additional variants. Store the complete variant FEN in the existing `fen`/`start_fen` fields; chessops FEN carries Crazyhouse pockets and variant-specific setup. No new competitive game table is introduced.

## Edge function

Create `advanced-variant-v4` with authenticated actions:

- `queue`: match only the same variant/time/rated tuple and create the engine-defined default position.
- `state`: return participant-safe game state plus the complete legal UCI move list. Crazyhouse drop moves use chessops UCI drop syntax such as `N@f7`.
- `move`: parse UCI, reconstruct the authoritative position from stored FEN, verify legality using chessops, apply exactly one move, derive new FEN and outcome, then commit through a service-only RPC with expected-ply protection.
- `resign`, `offer_draw`, `respond_draw`, `timeout`: reuse the existing V3 server action path.

No service-role key or puzzle/variant secret state appears in browser code.

## Browser UI

Extend `variants.html` and `v3/variants/app.mjs` with eight total modes. Standard board moves remain click-from/click-to. Crazyhouse adds a compact pocket strip for both colors; selecting a pocket piece highlights legal drop destinations returned by the server. Atomic, Antichess, Horde, and Racing Kings render from authoritative FEN and use server-supplied legal moves.

The approved petrol/turquoise site identity, cream/olive board themes, and exact approved piece PNGs remain unchanged.

## Security and integrity

- RLS remains enabled on V3 tables.
- Direct competitive writes stay revoked.
- `v3_queue_variant_server`, move commit RPCs, and rating settlement remain service-only where appropriate.
- Client state cannot submit trusted FEN, result, rating delta, pockets, or legal-move lists.
- Matchmaking remains atomic and protects against simultaneous duplicate games.

## Testing

Add contract tests that require all eight variants, chessops server use, JWT authentication, expected-ply checks, Crazyhouse drop support, and no browser import of chessops. Add GitHub Actions coverage and a rollback-only PostgreSQL smoke test for queueing/settlement. Deploy the Edge Function before exposing the five new modes in `main`.

## Licensing boundary

`chessops` is GPL-3.0-or-later. It is used only in the server-side Edge Function and is not bundled into the static browser application. The repository stores only the import/reference and our integration code; the browser receives only API results.