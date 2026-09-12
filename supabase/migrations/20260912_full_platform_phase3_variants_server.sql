-- Phase 3 Chess960 server-only RPCs and variant ratings.

alter table public.v3_variant_games add column if not exists draw_offered_by uuid references public.players(id) on delete set null;

create table if not exists public.v3_variant_ratings (
  player_id uuid not null references public.players(id) on delete cascade,
  variant text not null check (variant in ('chess960')),
  rating integer not null default 1500 check (rating between 100 and 4000),
  games_count integer not null default 0 check (games_count >= 0),
  updated_at timestamptz not null default clock_timestamp(),
  primary key(player_id,variant)
);
alter table public.v3_variant_ratings enable row level security;
revoke all on public.v3_variant_ratings from public,anon,authenticated;
grant select on public.v3_variant_ratings to anon,authenticated;
create policy v3_variant_ratings_public_read on public.v3_variant_ratings for select to anon,authenticated using (true);

create or replace function public.v3_list_variant_games(p_limit integer default 30)
returns table(
  id uuid, variant text, white_player_id uuid, white_name text, black_player_id uuid, black_name text,
  start_index integer, fen text, turn text, ply integer, white_ms bigint, black_ms bigint,
  status text, result text, termination text, created_at timestamptz
)
language sql stable security invoker set search_path='' as $$
  select g.id,g.variant,g.white_player_id,wp.name,g.black_player_id,bp.name,
         g.start_index,g.fen,g.turn,g.ply,g.white_ms,g.black_ms,
         g.status,g.result,g.termination,g.created_at
  from public.v3_variant_games g
  join public.players wp on wp.id=g.white_player_id
  join public.players bp on bp.id=g.black_player_id
  order by case when g.status='active' then 0 else 1 end, g.created_at desc
  limit greatest(1,least(coalesce(p_limit,30),100));
$$;

create or replace function private.v3_settle_variant_rating(p_game_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare
  g public.v3_variant_games%rowtype;
  dw integer:=0; db integer:=0;
begin
  select * into g from public.v3_variant_games where id=p_game_id for update;
  if g.id is null or g.result is null or g.rating_settled then return; end if;
  if not g.rated then
    update public.v3_variant_games set rating_settled=true where id=g.id;
    return;
  end if;
  insert into public.v3_variant_ratings(player_id,variant) values(g.white_player_id,g.variant),(g.black_player_id,g.variant)
  on conflict(player_id,variant) do nothing;
  if g.result='1-0' then dw:=10; db:=-10;
  elsif g.result='0-1' then dw:=-10; db:=10;
  end if;
  update public.v3_variant_ratings set rating=greatest(100,rating+dw),games_count=games_count+1,updated_at=clock_timestamp()
   where player_id=g.white_player_id and variant=g.variant;
  update public.v3_variant_ratings set rating=greatest(100,rating+db),games_count=games_count+1,updated_at=clock_timestamp()
   where player_id=g.black_player_id and variant=g.variant;
  update public.v3_variant_games set rating_settled=true where id=g.id;
end;
$$;
revoke all on function private.v3_settle_variant_rating(uuid) from public,anon,authenticated;

create or replace function public.v3_queue_variant_server(
  p_player_id uuid,p_variant text,p_base_seconds integer,p_increment_seconds integer,p_rated boolean,
  p_start_index integer,p_start_fen text
) returns setof public.v3_variant_games
language plpgsql security definer set search_path='' as $$
declare
  opp public.v3_variant_queue%rowtype;
  gid uuid;
  white_id uuid; black_id uuid;
begin
  if p_variant<>'chess960' or p_base_seconds not between 30 and 3600 or p_increment_seconds not between 0 and 60 then
    raise exception 'invalid_variant_request';
  end if;
  if not exists(select 1 from public.players p where p.id=p_player_id and p.status='active' and not coalesce(p.is_synthetic,false)) then
    raise exception 'player_unavailable';
  end if;
  select g.id into gid from public.v3_variant_games g
   where g.status='active' and p_player_id in (g.white_player_id,g.black_player_id)
   order by g.created_at desc limit 1;
  if gid is not null then return query select * from public.v3_variant_games where id=gid; return; end if;

  insert into public.v3_variant_queue(player_id,variant,base_seconds,increment_seconds,rated,joined_at)
  values(p_player_id,p_variant,p_base_seconds,p_increment_seconds,p_rated,clock_timestamp())
  on conflict(player_id) do update set variant=excluded.variant,base_seconds=excluded.base_seconds,
    increment_seconds=excluded.increment_seconds,rated=excluded.rated,joined_at=excluded.joined_at;

  select q.* into opp
  from public.v3_variant_queue q
  where q.player_id<>p_player_id and q.variant=p_variant and q.base_seconds=p_base_seconds
    and q.increment_seconds=p_increment_seconds and q.rated=p_rated
    and not exists(select 1 from public.v3_variant_games g where g.status='active' and q.player_id in(g.white_player_id,g.black_player_id))
  order by q.joined_at
  for update skip locked limit 1;

  if opp.player_id is null then return; end if;
  if random()<0.5 then white_id:=p_player_id; black_id:=opp.player_id; else white_id:=opp.player_id; black_id:=p_player_id; end if;

  insert into public.v3_variant_games(variant,white_player_id,black_player_id,start_index,start_fen,fen,turn,
    base_seconds,increment_seconds,white_ms,black_ms,clock_anchor_at,status,rated)
  values(p_variant,white_id,black_id,p_start_index,p_start_fen,p_start_fen,'w',p_base_seconds,p_increment_seconds,
    p_base_seconds::bigint*1000,p_base_seconds::bigint*1000,clock_timestamp(),'active',p_rated)
  returning id into gid;
  delete from public.v3_variant_queue where player_id in(p_player_id,opp.player_id);
  return query select * from public.v3_variant_games where id=gid;
end;
$$;
revoke all on function public.v3_queue_variant_server(uuid,text,integer,integer,boolean,integer,text) from public,anon,authenticated;
grant execute on function public.v3_queue_variant_server(uuid,text,integer,integer,boolean,integer,text) to service_role;

create or replace function public.v3_commit_variant_move_server(
  p_game_id uuid,p_player_id uuid,p_expected_ply integer,p_san text,p_uci text,p_fen text,p_next_turn text,
  p_white_ms bigint,p_black_ms bigint,p_result text,p_termination text
) returns public.v3_variant_games
language plpgsql security definer set search_path='' as $$
declare
  g public.v3_variant_games%rowtype;
  mover text;
begin
  select * into g from public.v3_variant_games where id=p_game_id for update;
  if g.id is null then raise exception 'game_not_found'; end if;
  if g.status<>'active' then raise exception 'game_not_active'; end if;
  if g.ply<>p_expected_ply then raise exception 'stale_game_version'; end if;
  mover:=case when g.white_player_id=p_player_id then 'w' when g.black_player_id=p_player_id then 'b' else null end;
  if mover is null then raise exception 'not_participant'; end if;
  if mover<>g.turn then raise exception 'wrong_turn'; end if;
  if p_next_turn not in ('w','b') or p_white_ms<0 or p_black_ms<0 then raise exception 'invalid_server_state'; end if;
  if p_result is not null and p_result not in ('1-0','0-1','1/2-1/2') then raise exception 'invalid_result'; end if;

  insert into public.v3_variant_moves(game_id,ply,san,uci,fen_after,mover_player_id)
  values(g.id,g.ply+1,p_san,p_uci,p_fen,p_player_id);
  update public.v3_variant_games set fen=p_fen,turn=p_next_turn,ply=ply+1,
    white_ms=p_white_ms,black_ms=p_black_ms,clock_anchor_at=case when p_result is null then clock_timestamp() else null end,
    status=case when p_result is null then 'active' else 'finished' end,result=p_result,termination=p_termination,
    draw_offered_by=null,finished_at=case when p_result is null then null else clock_timestamp() end
  where id=g.id returning * into g;
  if p_result is not null then perform private.v3_settle_variant_rating(g.id); select * into g from public.v3_variant_games where id=g.id; end if;
  return g;
end;
$$;
revoke all on function public.v3_commit_variant_move_server(uuid,uuid,integer,text,text,text,text,bigint,bigint,text,text) from public,anon,authenticated;
grant execute on function public.v3_commit_variant_move_server(uuid,uuid,integer,text,text,text,text,bigint,bigint,text,text) to service_role;

create or replace function public.v3_variant_action_server(p_game_id uuid,p_player_id uuid,p_action text,p_accept boolean default null)
returns public.v3_variant_games
language plpgsql security definer set search_path='' as $$
declare g public.v3_variant_games%rowtype; color text; res text;
begin
  select * into g from public.v3_variant_games where id=p_game_id for update;
  if g.id is null then raise exception 'game_not_found'; end if;
  if g.status<>'active' then return g; end if;
  color:=case when g.white_player_id=p_player_id then 'w' when g.black_player_id=p_player_id then 'b' else null end;
  if color is null then raise exception 'not_participant'; end if;
  if p_action='resign' then
    res:=case when color='w' then '0-1' else '1-0' end;
    update public.v3_variant_games set status='finished',result=res,termination='resign',clock_anchor_at=null,finished_at=clock_timestamp() where id=g.id;
  elsif p_action='offer_draw' then
    update public.v3_variant_games set draw_offered_by=p_player_id where id=g.id;
  elsif p_action='respond_draw' then
    if g.draw_offered_by is null or g.draw_offered_by=p_player_id then raise exception 'no_opponent_draw_offer'; end if;
    if coalesce(p_accept,false) then
      update public.v3_variant_games set status='finished',result='1/2-1/2',termination='agreement',draw_offered_by=null,clock_anchor_at=null,finished_at=clock_timestamp() where id=g.id;
    else update public.v3_variant_games set draw_offered_by=null where id=g.id; end if;
  else raise exception 'unsupported_action'; end if;
  select * into g from public.v3_variant_games where id=p_game_id;
  if g.result is not null then perform private.v3_settle_variant_rating(g.id); select * into g from public.v3_variant_games where id=g.id; end if;
  return g;
end;
$$;
revoke all on function public.v3_variant_action_server(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.v3_variant_action_server(uuid,uuid,text,boolean) to service_role;

create or replace function public.v3_cancel_variant_queue()
returns boolean language plpgsql security definer set search_path='' as $$
declare pid uuid;
begin
  pid:=public.v2_my_player_id();
  if pid is null then raise exception 'authentication_required'; end if;
  delete from public.v3_variant_queue where player_id=pid;
  return found;
end;
$$;
revoke all on function public.v3_cancel_variant_queue() from public,anon;
grant execute on function public.v3_cancel_variant_queue() to authenticated;
