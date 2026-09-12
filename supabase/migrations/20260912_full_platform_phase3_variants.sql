-- Phase 3: server-authoritative Chess960 foundation.

create table if not exists public.v3_variant_games (
  id uuid primary key default gen_random_uuid(),
  variant text not null default 'chess960' check (variant in ('chess960')),
  white_player_id uuid not null references public.players(id) on delete cascade,
  black_player_id uuid not null references public.players(id) on delete cascade,
  start_index integer not null check (start_index between 0 and 959),
  start_fen text not null,
  fen text not null,
  turn text not null default 'w' check (turn in ('w','b')),
  ply integer not null default 0 check (ply >= 0),
  base_seconds integer not null default 600 check (base_seconds between 30 and 3600),
  increment_seconds integer not null default 0 check (increment_seconds between 0 and 60),
  white_ms bigint not null check (white_ms >= 0),
  black_ms bigint not null check (black_ms >= 0),
  clock_anchor_at timestamptz,
  status text not null default 'active' check (status in ('active','finished','cancelled')),
  result text check (result is null or result in ('1-0','0-1','1/2-1/2')),
  termination text,
  rated boolean not null default false,
  rating_settled boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  started_at timestamptz not null default clock_timestamp(),
  finished_at timestamptz,
  constraint v3_variant_distinct_players check (white_player_id <> black_player_id)
);
create index if not exists v3_variant_games_white_idx on public.v3_variant_games(white_player_id,status,created_at desc);
create index if not exists v3_variant_games_black_idx on public.v3_variant_games(black_player_id,status,created_at desc);
create index if not exists v3_variant_games_public_idx on public.v3_variant_games(status,created_at desc);

create table if not exists public.v3_variant_moves (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.v3_variant_games(id) on delete cascade,
  ply integer not null check (ply > 0),
  san text not null,
  uci text,
  fen_after text not null,
  mover_player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default clock_timestamp(),
  unique(game_id,ply)
);
create index if not exists v3_variant_moves_game_idx on public.v3_variant_moves(game_id,ply);

create table if not exists public.v3_variant_queue (
  player_id uuid primary key references public.players(id) on delete cascade,
  variant text not null default 'chess960' check (variant in ('chess960')),
  base_seconds integer not null default 600 check (base_seconds between 30 and 3600),
  increment_seconds integer not null default 0 check (increment_seconds between 0 and 60),
  rated boolean not null default false,
  joined_at timestamptz not null default clock_timestamp()
);
create index if not exists v3_variant_queue_match_idx on public.v3_variant_queue(variant,base_seconds,increment_seconds,rated,joined_at);

alter table public.v3_variant_games enable row level security;
alter table public.v3_variant_moves enable row level security;
alter table public.v3_variant_queue enable row level security;

revoke all on public.v3_variant_games, public.v3_variant_moves, public.v3_variant_queue from public, anon, authenticated;
grant select on public.v3_variant_games, public.v3_variant_moves to anon, authenticated;
grant select on public.v3_variant_queue to authenticated;

create policy v3_variant_games_public_read on public.v3_variant_games for select to anon,authenticated using (true);
create policy v3_variant_moves_public_read on public.v3_variant_moves for select to anon,authenticated using (true);
create policy v3_variant_queue_self_read on public.v3_variant_queue for select to authenticated using (player_id=public.v2_my_player_id());

create or replace function public.v3_list_variant_games(p_limit integer default 30)
returns table(
  id uuid, variant text, white_player_id uuid, white_name text, black_player_id uuid, black_name text,
  start_index integer, fen text, turn text, ply integer, white_ms bigint, black_ms bigint,
  status text, result text, termination text, created_at timestamptz
)
language sql stable security definer set search_path='' as $$
  select g.id,g.variant,g.white_player_id,wp.name,g.black_player_id,bp.name,
         g.start_index,g.fen,g.turn,g.ply,g.white_ms,g.black_ms,
         g.status,g.result,g.termination,g.created_at
  from public.v3_variant_games g
  join public.players wp on wp.id=g.white_player_id
  join public.players bp on bp.id=g.black_player_id
  order by case when g.status='active' then 0 else 1 end, g.created_at desc
  limit greatest(1,least(coalesce(p_limit,30),100));
$$;
grant execute on function public.v3_list_variant_games(integer) to anon,authenticated;

create or replace function public.v3_my_variant_games(p_limit integer default 30)
returns setof public.v3_variant_games
language sql stable security definer set search_path='' as $$
  select g.* from public.v3_variant_games g
  where public.v2_my_player_id() in (g.white_player_id,g.black_player_id)
  order by g.created_at desc
  limit greatest(1,least(coalesce(p_limit,30),100));
$$;
revoke all on function public.v3_my_variant_games(integer) from public,anon;
grant execute on function public.v3_my_variant_games(integer) to authenticated;
