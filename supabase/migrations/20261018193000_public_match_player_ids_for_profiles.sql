-- Read-only identifiers for people already visible in public match lists.
-- Legacy anonymous live games do not have player IDs and return no mapping.
create or replace function public.get_public_match_player_ids(
  p_game_id uuid,
  p_game_type text
)
returns table(white_player_id uuid, black_player_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select g.white_player_id, g.black_player_id
  from public.v2_games g
  where p_game_type = 'human_v2'
    and g.id = p_game_id
    and g.status in ('matched', 'active', 'finished')
  union all
  select g.player_id, null::uuid
  from public.computer_games g
  where p_game_type = 'computer'
    and g.id = p_game_id
    and g.status in ('active', 'finished')
$$;
revoke all on function public.get_public_match_player_ids(uuid,text) from public,anon,authenticated;
grant execute on function public.get_public_match_player_ids(uuid,text) to anon,authenticated;
