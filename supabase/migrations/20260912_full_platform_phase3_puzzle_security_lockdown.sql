-- Phase 3 puzzle security stage 2: run only after the secure puzzle-session client is deployed.

revoke select on table public.v2_puzzles from anon,authenticated;
revoke all on function public.v2_submit_puzzle_attempt(uuid,boolean,integer,integer,boolean) from public,anon,authenticated;
