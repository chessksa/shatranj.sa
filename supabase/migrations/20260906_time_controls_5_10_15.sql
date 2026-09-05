-- Standardize all new playable time controls to 5 / 10 / 15 minutes.
-- Historical 3-minute rows remain readable; public entry points reject new 3-minute games.

alter table public.live_games
  drop constraint if exists live_games_time_control_minutes_check;
alter table public.live_games
  add constraint live_games_time_control_minutes_check
  check (time_control_minutes in (3,5,10,15));

alter table private.friend_challenges
  drop constraint if exists friend_challenges_minutes_check;
alter table private.friend_challenges
  add constraint friend_challenges_minutes_check
  check (minutes in (3,5,10,15));

alter table public.computer_games
  add column if not exists time_control_minutes integer,
  add column if not exists player_time_ms bigint,
  add column if not exists computer_time_ms bigint,
  add column if not exists turn_started_at timestamptz;

update public.computer_games
set time_control_minutes = coalesce(time_control_minutes, 10),
    player_time_ms = coalesce(player_time_ms, 600000),
    computer_time_ms = coalesce(computer_time_ms, 600000),
    turn_started_at = coalesce(turn_started_at, updated_at, created_at, clock_timestamp());

alter table public.computer_games
  alter column time_control_minutes set default 10,
  alter column time_control_minutes set not null,
  alter column player_time_ms set default 600000,
  alter column player_time_ms set not null,
  alter column computer_time_ms set default 600000,
  alter column computer_time_ms set not null,
  alter column turn_started_at set default clock_timestamp(),
  alter column turn_started_at set not null;

alter table public.computer_games
  drop constraint if exists computer_games_time_control_minutes_check;
alter table public.computer_games
  add constraint computer_games_time_control_minutes_check
  check (time_control_minutes in (5,10,15));

alter table public.computer_games
  drop constraint if exists computer_games_player_time_nonnegative;
alter table public.computer_games
  add constraint computer_games_player_time_nonnegative
  check (player_time_ms >= 0);

alter table public.computer_games
  drop constraint if exists computer_games_computer_time_nonnegative;
alter table public.computer_games
  add constraint computer_games_computer_time_nonnegative
  check (computer_time_ms >= 0);

-- Keep the existing function bodies and permissions, changing only their accepted time controls.
do $migration$
declare
  v_def text;
begin
  select pg_get_functiondef('public.start_matchmaking(integer)'::regprocedure) into v_def;
  v_def := replace(v_def,
    'if p_minutes not in (3,5,10,15) then',
    'if p_minutes not in (5,10,15) then');
  if position('p_minutes not in (5,10,15)' in v_def) = 0 then
    raise exception 'could not update start_matchmaking time controls';
  end if;
  execute v_def;

  select pg_get_functiondef('public.start_matchmaking_v2(integer,text)'::regprocedure) into v_def;
  v_def := replace(v_def,
    'if p_minutes not in (3,5,10) then',
    'if p_minutes not in (5,10,15) then');
  if position('p_minutes not in (5,10,15)' in v_def) = 0 then
    raise exception 'could not update start_matchmaking_v2 time controls';
  end if;
  execute v_def;

  select pg_get_functiondef('public.send_friend_challenge(uuid,integer)'::regprocedure) into v_def;
  v_def := replace(v_def,
    'if p_minutes not in (3,5,10) then',
    'if p_minutes not in (5,10,15) then');
  if position('p_minutes not in (5,10,15)' in v_def) = 0 then
    raise exception 'could not update send_friend_challenge time controls';
  end if;
  execute v_def;
end
$migration$;
