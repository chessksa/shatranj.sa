create schema if not exists private;

create table public.v2_games (
  id uuid primary key default gen_random_uuid(),
  white_player_id uuid not null references public.players(id),
  black_player_id uuid not null references public.players(id),
  rated boolean not null default true,
  base_seconds integer not null check (base_seconds in (300, 600, 900)),
  increment_seconds integer not null default 0 check (increment_seconds = 0),
  fen text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn text not null default 'w' check (turn in ('w', 'b')),
  ply integer not null default 0 check (ply >= 0),
  white_ms bigint not null check (white_ms >= 0),
  black_ms bigint not null check (black_ms >= 0),
  clock_anchor_at timestamptz,
  status text not null default 'matched' check (status in ('matched', 'active', 'finished', 'cancelled')),
  result text check (result is null or result in ('1-0', '0-1', '1/2-1/2')),
  termination text,
  grace_until timestamptz not null,
  draw_offered_by uuid references public.players(id),
  rating_settled boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  started_at timestamptz,
  finished_at timestamptz,
  constraint v2_games_distinct_players check (white_player_id <> black_player_id)
);

create index v2_games_white_status_idx on public.v2_games (white_player_id, status);
create index v2_games_black_status_idx on public.v2_games (black_player_id, status);
create index v2_games_status_created_idx on public.v2_games (status, created_at desc);

create table public.v2_game_moves (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.v2_games(id) on delete cascade,
  ply integer not null check (ply > 0),
  from_square text not null check (from_square ~ '^[a-h][1-8]$'),
  to_square text not null check (to_square ~ '^[a-h][1-8]$'),
  promotion text check (promotion is null or promotion in ('q', 'r', 'b', 'n')),
  san text not null,
  fen_after text not null,
  mover_player_id uuid not null references public.players(id),
  white_ms bigint not null check (white_ms >= 0),
  black_ms bigint not null check (black_ms >= 0),
  created_at timestamptz not null default clock_timestamp(),
  constraint v2_game_moves_game_ply_key unique (game_id, ply)
);

create index v2_game_moves_game_idx on public.v2_game_moves (game_id, ply);

create table private.v2_matchmaking_queue (
  player_id uuid primary key references public.players(id) on delete cascade,
  base_minutes integer not null check (base_minutes = any (array[5,10,15])),
  rating_snapshot integer not null,
  joined_at timestamptz not null default clock_timestamp(),
  last_seen_at timestamptz not null default clock_timestamp(),
  status text not null default 'waiting' check (status in ('waiting', 'matched')),
  matched_game_id uuid references public.v2_games(id) on delete set null
);

create index v2_matchmaking_waiting_idx
  on private.v2_matchmaking_queue (base_minutes, joined_at)
  where status = 'waiting';

create table private.v2_rating_history (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.v2_games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  rating_before integer not null,
  rating_after integer not null,
  delta integer not null,
  result text not null check (result in ('win', 'loss', 'draw')),
  created_at timestamptz not null default clock_timestamp(),
  constraint v2_rating_history_game_player_key unique (game_id, player_id)
);

alter table public.v2_games enable row level security;
alter table public.v2_game_moves enable row level security;

revoke all on table public.v2_games from anon, authenticated;
revoke all on table public.v2_game_moves from anon, authenticated;
grant select on table public.v2_games to authenticated;
grant select on table public.v2_game_moves to authenticated;

create policy v2_games_participant_select
on public.v2_games
for select
to authenticated
using (
  exists (
    select 1
    from public.players p
    where p.auth_user_id = auth.uid()
      and p.id in (v2_games.white_player_id, v2_games.black_player_id)
  )
);

create policy v2_game_moves_participant_select
on public.v2_game_moves
for select
to authenticated
using (
  exists (
    select 1
    from public.v2_games g
    join public.players p
      on p.id in (g.white_player_id, g.black_player_id)
    where g.id = v2_game_moves.game_id
      and p.auth_user_id = auth.uid()
  )
);

create or replace function private.v2_current_player_id()
returns uuid
language sql
stable
security definer
set search_path = public, private, auth
as $$
  select p.id
  from public.players p
  where p.auth_user_id = auth.uid()
    and coalesce(p.is_synthetic, false) = false
    and coalesce(p.status, '') not in ('banned', 'suspended', 'inactive')
  order by p.created_at asc
  limit 1;
$$;

revoke all on function private.v2_current_player_id() from public, anon, authenticated;

create or replace function public.start_v2_matchmaking(p_minutes integer)
returns table (
  queue_status text,
  game_id uuid,
  color text,
  opponent_player_id uuid,
  base_seconds integer,
  grace_until timestamptz
)
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_player_id uuid;
  v_rating integer;
  v_existing public.v2_games%rowtype;
  v_opponent_id uuid;
  v_game public.v2_games%rowtype;
  v_player_white boolean;
  v_now timestamptz := clock_timestamp();
  v_grace timestamptz;
begin
  if p_minutes is null or not (p_minutes = any (array[5,10,15])) then
    raise exception 'unsupported_time_control' using errcode = '22023';
  end if;

  v_player_id := private.v2_current_player_id();
  if v_player_id is null then
    raise exception 'player_profile_required' using errcode = '42501';
  end if;

  select p.rating into v_rating
  from public.players p
  where p.id = v_player_id;

  select g.* into v_existing
  from public.v2_games g
  where g.status in ('matched', 'active')
    and v_player_id in (g.white_player_id, g.black_player_id)
  order by g.created_at desc
  limit 1;

  if found then
    return query
    select
      'matched'::text,
      v_existing.id,
      case when v_existing.white_player_id = v_player_id then 'w' else 'b' end::text,
      case when v_existing.white_player_id = v_player_id then v_existing.black_player_id else v_existing.white_player_id end,
      v_existing.base_seconds,
      v_existing.grace_until;
    return;
  end if;

  insert into private.v2_matchmaking_queue (
    player_id, base_minutes, rating_snapshot, joined_at, last_seen_at, status, matched_game_id
  ) values (
    v_player_id, p_minutes, coalesce(v_rating, 1500), v_now, v_now, 'waiting', null
  )
  on conflict (player_id) do update
    set base_minutes = excluded.base_minutes,
        rating_snapshot = excluded.rating_snapshot,
        joined_at = case
          when private.v2_matchmaking_queue.status = 'waiting'
            and private.v2_matchmaking_queue.base_minutes = excluded.base_minutes
          then private.v2_matchmaking_queue.joined_at
          else excluded.joined_at
        end,
        last_seen_at = excluded.last_seen_at,
        status = 'waiting',
        matched_game_id = null;

  select q.player_id into v_opponent_id
  from private.v2_matchmaking_queue q
  where q.status = 'waiting'
    and q.base_minutes = p_minutes
    and q.player_id <> v_player_id
    and q.last_seen_at >= v_now - interval '90 seconds'
    and not exists (
      select 1 from public.v2_games ag
      where ag.status in ('matched', 'active')
        and q.player_id in (ag.white_player_id, ag.black_player_id)
    )
  order by q.joined_at asc
  for update skip locked
  limit 1;

  if v_opponent_id is null then
    return query
    select 'waiting'::text, null::uuid, null::text, null::uuid, (p_minutes * 60), null::timestamptz;
    return;
  end if;

  v_player_white := random() < 0.5;
  v_grace := v_now + interval '5 seconds';

  insert into public.v2_games (
    white_player_id,
    black_player_id,
    rated,
    base_seconds,
    increment_seconds,
    white_ms,
    black_ms,
    clock_anchor_at,
    status,
    grace_until
  ) values (
    case when v_player_white then v_player_id else v_opponent_id end,
    case when v_player_white then v_opponent_id else v_player_id end,
    true,
    p_minutes * 60,
    0,
    p_minutes * 60 * 1000::bigint,
    p_minutes * 60 * 1000::bigint,
    v_grace,
    'matched',
    v_grace
  ) returning * into v_game;

  update private.v2_matchmaking_queue
  set status = 'matched',
      matched_game_id = v_game.id,
      last_seen_at = v_now
  where player_id in (v_player_id, v_opponent_id);

  return query
  select
    'matched'::text,
    v_game.id,
    case when v_game.white_player_id = v_player_id then 'w' else 'b' end::text,
    v_opponent_id,
    v_game.base_seconds,
    v_game.grace_until;
end;
$$;

create or replace function public.poll_v2_matchmaking()
returns table (
  queue_status text,
  game_id uuid,
  color text,
  opponent_player_id uuid,
  base_seconds integer,
  grace_until timestamptz
)
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_player_id uuid;
  v_minutes integer;
  v_game_id uuid;
  v_game public.v2_games%rowtype;
begin
  v_player_id := private.v2_current_player_id();
  if v_player_id is null then
    raise exception 'player_profile_required' using errcode = '42501';
  end if;

  select q.base_minutes, q.matched_game_id
  into v_minutes, v_game_id
  from private.v2_matchmaking_queue q
  where q.player_id = v_player_id;

  if not found then
    return query select 'idle'::text, null::uuid, null::text, null::uuid, null::integer, null::timestamptz;
    return;
  end if;

  if v_game_id is not null then
    select g.* into v_game from public.v2_games g where g.id = v_game_id;
    if found then
      return query
      select
        'matched'::text,
        v_game.id,
        case when v_game.white_player_id = v_player_id then 'w' else 'b' end::text,
        case when v_game.white_player_id = v_player_id then v_game.black_player_id else v_game.white_player_id end,
        v_game.base_seconds,
        v_game.grace_until;
      return;
    end if;
  end if;

  update private.v2_matchmaking_queue
  set last_seen_at = clock_timestamp()
  where player_id = v_player_id and status = 'waiting';

  return query select * from public.start_v2_matchmaking(v_minutes);
end;
$$;

create or replace function public.cancel_v2_matchmaking()
returns boolean
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_player_id uuid;
  v_deleted integer;
begin
  v_player_id := private.v2_current_player_id();
  if v_player_id is null then
    return false;
  end if;

  delete from private.v2_matchmaking_queue
  where player_id = v_player_id
    and status = 'waiting';
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

create or replace function public.get_v2_game_state(p_game_id uuid)
returns table (
  id uuid,
  white_player_id uuid,
  white_name text,
  white_rating integer,
  black_player_id uuid,
  black_name text,
  black_rating integer,
  rated boolean,
  base_seconds integer,
  increment_seconds integer,
  fen text,
  turn text,
  ply integer,
  white_ms bigint,
  black_ms bigint,
  clock_anchor_at timestamptz,
  status text,
  result text,
  termination text,
  grace_until timestamptz,
  draw_offered_by uuid,
  created_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz
)
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_player_id uuid;
begin
  v_player_id := private.v2_current_player_id();
  if v_player_id is null then
    raise exception 'player_profile_required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.v2_games g
    where g.id = p_game_id
      and v_player_id in (g.white_player_id, g.black_player_id)
  ) then
    raise exception 'game_not_accessible' using errcode = '42501';
  end if;

  return query
  select
    g.id,
    g.white_player_id,
    wp.name,
    wp.rating,
    g.black_player_id,
    bp.name,
    bp.rating,
    g.rated,
    g.base_seconds,
    g.increment_seconds,
    g.fen,
    g.turn,
    g.ply,
    g.white_ms,
    g.black_ms,
    g.clock_anchor_at,
    g.status,
    g.result,
    g.termination,
    g.grace_until,
    g.draw_offered_by,
    g.created_at,
    g.started_at,
    g.finished_at
  from public.v2_games g
  join public.players wp on wp.id = g.white_player_id
  join public.players bp on bp.id = g.black_player_id
  where g.id = p_game_id;
end;
$$;

create or replace function public.get_v2_game_moves(p_game_id uuid)
returns table (
  ply integer,
  from_square text,
  to_square text,
  promotion text,
  san text,
  fen_after text,
  mover_player_id uuid,
  white_ms bigint,
  black_ms bigint,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_player_id uuid;
begin
  v_player_id := private.v2_current_player_id();
  if v_player_id is null or not exists (
    select 1 from public.v2_games g
    where g.id = p_game_id
      and v_player_id in (g.white_player_id, g.black_player_id)
  ) then
    raise exception 'game_not_accessible' using errcode = '42501';
  end if;

  return query
  select m.ply, m.from_square, m.to_square, m.promotion, m.san, m.fen_after,
         m.mover_player_id, m.white_ms, m.black_ms, m.created_at
  from public.v2_game_moves m
  where m.game_id = p_game_id
  order by m.ply asc;
end;
$$;

create or replace function private.commit_v2_move(
  p_game_id uuid,
  p_mover_player_id uuid,
  p_expected_ply integer,
  p_from_square text,
  p_to_square text,
  p_promotion text,
  p_san text,
  p_fen_after text,
  p_next_turn text,
  p_white_ms bigint,
  p_black_ms bigint,
  p_result text,
  p_termination text
)
returns public.v2_games
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_game public.v2_games%rowtype;
  v_new_status text;
  v_now timestamptz := clock_timestamp();
begin
  select * into v_game
  from public.v2_games g
  where g.id = p_game_id
  for update;

  if not found then
    raise exception 'game_not_found' using errcode = 'P0002';
  end if;
  if v_game.status not in ('matched', 'active') then
    raise exception 'game_not_active' using errcode = '40001';
  end if;
  if v_game.ply <> p_expected_ply then
    raise exception 'stale_game_version' using errcode = '40001';
  end if;
  if (v_game.turn = 'w' and v_game.white_player_id <> p_mover_player_id)
     or (v_game.turn = 'b' and v_game.black_player_id <> p_mover_player_id) then
    raise exception 'wrong_turn' using errcode = '42501';
  end if;
  if p_next_turn not in ('w', 'b') or p_next_turn = v_game.turn then
    raise exception 'invalid_next_turn' using errcode = '22023';
  end if;
  if p_white_ms < 0 or p_black_ms < 0 then
    raise exception 'invalid_clock' using errcode = '22023';
  end if;
  if p_result is not null and p_result not in ('1-0', '0-1', '1/2-1/2') then
    raise exception 'invalid_result' using errcode = '22023';
  end if;

  v_new_status := case when p_result is null then 'active' else 'finished' end;

  update public.v2_games g
  set fen = p_fen_after,
      turn = p_next_turn,
      ply = p_expected_ply + 1,
      white_ms = p_white_ms,
      black_ms = p_black_ms,
      clock_anchor_at = case when p_result is null then v_now else null end,
      status = v_new_status,
      result = p_result,
      termination = p_termination,
      started_at = coalesce(g.started_at, v_now),
      finished_at = case when p_result is null then null else v_now end,
      grace_until = case when g.status = 'matched' then least(g.grace_until, v_now) else g.grace_until end,
      draw_offered_by = null
  where g.id = p_game_id
  returning * into v_game;

  insert into public.v2_game_moves (
    game_id, ply, from_square, to_square, promotion, san, fen_after,
    mover_player_id, white_ms, black_ms, created_at
  ) values (
    p_game_id, p_expected_ply + 1, p_from_square, p_to_square, p_promotion,
    p_san, p_fen_after, p_mover_player_id, p_white_ms, p_black_ms, v_now
  );

  return v_game;
end;
$$;

revoke all on function public.start_v2_matchmaking(integer) from public, anon;
revoke all on function public.poll_v2_matchmaking() from public, anon;
revoke all on function public.cancel_v2_matchmaking() from public, anon;
revoke all on function public.get_v2_game_state(uuid) from public, anon;
revoke all on function public.get_v2_game_moves(uuid) from public, anon;
revoke all on function private.commit_v2_move(uuid, uuid, integer, text, text, text, text, text, text, bigint, bigint, text, text) from public, anon, authenticated;

grant execute on function public.start_v2_matchmaking(integer) to authenticated;
grant execute on function public.poll_v2_matchmaking() to authenticated;
grant execute on function public.cancel_v2_matchmaking() to authenticated;
grant execute on function public.get_v2_game_state(uuid) to authenticated;
grant execute on function public.get_v2_game_moves(uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'v2_games'
    ) then
      alter publication supabase_realtime add table public.v2_games;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'v2_game_moves'
    ) then
      alter publication supabase_realtime add table public.v2_game_moves;
    end if;
  end if;
end;
$$;
