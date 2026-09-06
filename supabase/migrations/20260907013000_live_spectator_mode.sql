-- Public, read-only live-game state for spectators.
-- Exposes only board/player display data; never seat keys, hashes, or write capabilities.

create or replace function public.get_spectator_live_game_state(p_game_id uuid)
returns table(
  game_id uuid,
  white_player_id uuid,
  black_player_id uuid,
  white_name text,
  black_name text,
  white_rating integer,
  black_rating integer,
  white_city text,
  black_city text,
  white_region text,
  black_region text,
  fen text,
  status text,
  result text,
  white_time_ms bigint,
  black_time_ms bigint,
  turn_started_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id,
         m.white_player_id,
         m.black_player_id,
         g.white_name,
         g.black_name,
         wp.rating,
         bp.rating,
         wp.city,
         bp.city,
         wp.region,
         bp.region,
         g.fen,
         g.status,
         g.result,
         g.white_time_ms,
         g.black_time_ms,
         g.turn_started_at,
         g.updated_at
  from public.live_games g
  left join private.live_game_players m on m.game_id = g.id
  left join public.players wp on wp.id = m.white_player_id
  left join public.players bp on bp.id = m.black_player_id
  where g.id = p_game_id
    and g.status in ('active','finished');
$$;

revoke all on function public.get_spectator_live_game_state(uuid) from public;
revoke all on function public.get_spectator_live_game_state(uuid) from anon;
revoke all on function public.get_spectator_live_game_state(uuid) from authenticated;
grant execute on function public.get_spectator_live_game_state(uuid) to anon, authenticated;
