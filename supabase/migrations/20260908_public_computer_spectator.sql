-- Public, read-only computer game spectator API.
-- Keeps public.computer_games protected; only limited spectator fields leave the database.

create or replace function private.list_public_computer_games_v1()
returns table(
  game_id uuid,
  player_name text,
  player_rating integer,
  player_city text,
  player_country text,
  level text,
  time_control_minutes integer,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    g.id,
    p.name,
    p.rating,
    p.city,
    p.country,
    g.level,
    g.time_control_minutes,
    g.created_at,
    g.updated_at
  from public.computer_games g
  join public.players p on p.id = g.player_id
  where g.status = 'active'
  order by g.created_at desc
  limit 50;
$$;

create or replace function private.get_public_computer_game_v1(p_game_id uuid)
returns table(
  game_id uuid,
  player_name text,
  player_rating integer,
  player_city text,
  player_country text,
  level text,
  fen text,
  moves jsonb,
  status text,
  result text,
  time_control_minutes integer,
  player_time_ms bigint,
  computer_time_ms bigint,
  turn_started_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    g.id,
    p.name,
    p.rating,
    p.city,
    p.country,
    g.level,
    g.fen,
    g.moves,
    g.status,
    g.result,
    g.time_control_minutes,
    g.player_time_ms,
    g.computer_time_ms,
    g.turn_started_at,
    g.created_at,
    g.updated_at
  from public.computer_games g
  join public.players p on p.id = g.player_id
  where g.id = p_game_id
    and g.status in ('active','finished');
$$;

revoke all on function private.list_public_computer_games_v1() from public;
revoke all on function private.get_public_computer_game_v1(uuid) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.list_public_computer_games_v1() to anon, authenticated;
grant execute on function private.get_public_computer_game_v1(uuid) to anon, authenticated;

create or replace function public.list_public_computer_games()
returns table(
  game_id uuid,
  player_name text,
  player_rating integer,
  player_city text,
  player_country text,
  level text,
  time_control_minutes integer,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.list_public_computer_games_v1();
$$;

create or replace function public.get_public_computer_game(p_game_id uuid)
returns table(
  game_id uuid,
  player_name text,
  player_rating integer,
  player_city text,
  player_country text,
  level text,
  fen text,
  moves jsonb,
  status text,
  result text,
  time_control_minutes integer,
  player_time_ms bigint,
  computer_time_ms bigint,
  turn_started_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.get_public_computer_game_v1(p_game_id);
$$;

revoke all on function public.list_public_computer_games() from public;
revoke all on function public.get_public_computer_game(uuid) from public;
grant execute on function public.list_public_computer_games() to anon, authenticated;
grant execute on function public.get_public_computer_game(uuid) to anon, authenticated;
