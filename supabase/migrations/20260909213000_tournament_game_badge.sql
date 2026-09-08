-- Expose tournament context for a live game so play and spectator pages can show a compact badge.
create or replace function public.get_live_game_tournament_context(p_game_id uuid)
returns table(
  tournament_id uuid,
  tournament_name text,
  round_no integer,
  max_round integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id,
         t.name,
         tm.round_no,
         (
           select max(all_matches.round_no)
           from private.tournament_matches all_matches
           where all_matches.tournament_id=tm.tournament_id
         )::integer as max_round
  from private.tournament_matches tm
  join public.tournaments t on t.id=tm.tournament_id
  where tm.live_game_id=p_game_id
  limit 1;
$$;

revoke all on function public.get_live_game_tournament_context(uuid) from public;
grant execute on function public.get_live_game_tournament_context(uuid) to anon,authenticated;
