-- Phase 6: targeted legacy API hardening.
-- Keep explicitly public spectator/profile RPCs unchanged.

revoke execute on function public.cancel_matchmaking() from public, anon;
grant execute on function public.cancel_matchmaking() to authenticated;

revoke execute on function public.claim_player_profile(text,text,text,text,text) from public, anon;
grant execute on function public.claim_player_profile(text,text,text,text,text) to authenticated;

revoke execute on function public.claim_player_profile(text,text,text,text,text,text) from public, anon;
grant execute on function public.claim_player_profile(text,text,text,text,text,text) to authenticated;

revoke execute on function public.claim_player_profile_v2(text,text,text,text,text,text) from public, anon;
grant execute on function public.claim_player_profile_v2(text,text,text,text,text,text) to authenticated;

revoke execute on function public.get_my_player_profile() from public, anon;
grant execute on function public.get_my_player_profile() to authenticated;

revoke execute on function public.get_my_player_profile_v2() from public, anon;
grant execute on function public.get_my_player_profile_v2() to authenticated;

revoke execute on function public.poll_matchmaking() from public, anon;
grant execute on function public.poll_matchmaking() to authenticated;

revoke execute on function public.send_player_challenge(uuid,integer) from public, anon;
grant execute on function public.send_player_challenge(uuid,integer) to authenticated;

revoke execute on function public.set_my_gender_once(text) from public, anon;
grant execute on function public.set_my_gender_once(text) to authenticated;

revoke execute on function public.start_matchmaking(integer) from public, anon;
grant execute on function public.start_matchmaking(integer) to authenticated;

revoke execute on function public.start_matchmaking_v2(integer,text) from public, anon;
grant execute on function public.start_matchmaking_v2(integer,text) to authenticated;

-- This legacy view is not used by the current frontend. Recreate it with invoker
-- semantics and remove direct client grants so callers use the scoped public RPCs.
create or replace view public.public_players
with (security_invoker = true)
as
select
  p.id,
  p.name,
  p.region,
  p.city,
  p.category,
  p.rating,
  p.rating_status,
  p.games_count,
  p.wins,
  p.draws,
  p.losses,
  p.created_at,
  p.is_synthetic
from public.players p
where p.status = 'active';

revoke all on public.public_players from public, anon, authenticated;
grant select on public.public_players to service_role;
