create table if not exists public.computer_games (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  level text not null check (level in ('easy','medium','hard')),
  fen text not null,
  moves jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active','finished','abandoned')),
  result text check (result is null or result in ('win','loss','draw')),
  rating_applied boolean not null default false,
  rating_before integer,
  rating_delta integer,
  rating_after integer,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  finished_at timestamptz
);

create index if not exists computer_games_player_status_idx
  on public.computer_games(player_id,status,created_at desc);

create unique index if not exists computer_games_one_active_per_player_idx
  on public.computer_games(player_id)
  where status='active';

alter table public.computer_games enable row level security;

revoke all on table public.computer_games from public, anon, authenticated;
grant select, insert, update, delete on table public.computer_games to service_role;

create or replace function public.apply_computer_game_rating(p_game_id uuid)
returns table(
  player_id uuid,
  rating_before integer,
  rating_delta integer,
  rating_after integer
)
language plpgsql
security definer
set search_path=''
as $function$
declare
  g public.computer_games%rowtype;
  v_before integer;
  v_delta integer;
  v_after integer;
  v_points integer;
begin
  select * into g
  from public.computer_games cg
  where cg.id=p_game_id
  for update;

  if g.id is null then
    raise exception 'computer game not found';
  end if;

  if g.status <> 'finished' or g.result is null then
    raise exception 'computer game is not finished';
  end if;

  if g.rating_applied then
    return query select g.player_id, g.rating_before, g.rating_delta, g.rating_after;
    return;
  end if;

  v_points := case g.level
    when 'easy' then 5
    when 'medium' then 10
    when 'hard' then 20
    else null
  end;

  if v_points is null then
    raise exception 'invalid computer level';
  end if;

  v_delta := case g.result
    when 'win' then v_points
    when 'loss' then -v_points
    when 'draw' then 0
    else null
  end;

  select p.rating into v_before
  from public.players p
  where p.id=g.player_id and p.status='active'
  for update;

  if v_before is null then
    raise exception 'active player not found';
  end if;

  v_after := v_before + v_delta;

  if v_delta <> 0 then
    update public.players
       set rating=v_after
     where id=g.player_id;

    insert into public.rating_history(player_id,match_id,old_rating,new_rating,created_at)
    values(g.player_id,null,v_before,v_after,clock_timestamp());
  end if;

  update public.computer_games
     set rating_applied=true,
         rating_before=v_before,
         rating_delta=v_delta,
         rating_after=v_after,
         updated_at=clock_timestamp()
   where id=g.id;

  perform private.evaluate_player_achievements(g.player_id);

  return query select g.player_id, v_before, v_delta, v_after;
end;
$function$;

revoke all on function public.apply_computer_game_rating(uuid) from public, anon, authenticated;
grant execute on function public.apply_computer_game_rating(uuid) to service_role;
