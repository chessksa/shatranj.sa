-- Phase 4: extend the existing V3 competitive variant system with
-- Crazyhouse, Atomic, Antichess, Horde, and Racing Kings.

alter table public.v3_variant_games drop constraint if exists v3_variant_games_variant_check;
alter table public.v3_variant_games add constraint v3_variant_games_variant_check
  check (variant in (
    'chess960','threecheck','kingofthehill',
    'crazyhouse','atomic','antichess','horde','racingkings'
  ));

alter table public.v3_variant_queue drop constraint if exists v3_variant_queue_variant_check;
alter table public.v3_variant_queue add constraint v3_variant_queue_variant_check
  check (variant in (
    'chess960','threecheck','kingofthehill',
    'crazyhouse','atomic','antichess','horde','racingkings'
  ));

alter table public.v3_variant_ratings drop constraint if exists v3_variant_ratings_variant_check;
alter table public.v3_variant_ratings add constraint v3_variant_ratings_variant_check
  check (variant in (
    'chess960','threecheck','kingofthehill',
    'crazyhouse','atomic','antichess','horde','racingkings'
  ));

create or replace function public.v3_queue_variant_server(
  p_player_id uuid,
  p_variant text,
  p_base_seconds integer,
  p_increment_seconds integer,
  p_rated boolean,
  p_start_index integer,
  p_start_fen text
)
returns setof public.v3_variant_games
language plpgsql
security definer
set search_path=''
as $$
declare
  opp public.v3_variant_queue%rowtype;
  gid uuid;
  white_id uuid;
  black_id uuid;
begin
  if p_variant not in (
       'chess960','threecheck','kingofthehill',
       'crazyhouse','atomic','antichess','horde','racingkings'
     )
     or p_base_seconds not between 30 and 3600
     or p_increment_seconds not between 0 and 60
     or p_start_index not between 0 and 959
     or btrim(coalesce(p_start_fen,''))='' then
    raise exception 'invalid_variant_request';
  end if;

  if not exists(
    select 1 from public.players p
    where p.id=p_player_id
      and p.status='active'
      and not coalesce(p.is_synthetic,false)
  ) then
    raise exception 'player_unavailable';
  end if;

  select g.id into gid
  from public.v3_variant_games g
  where g.status='active'
    and p_player_id in(g.white_player_id,g.black_player_id)
  order by g.created_at desc
  limit 1;

  if gid is not null then
    return query select * from public.v3_variant_games where id=gid;
    return;
  end if;

  insert into public.v3_variant_queue(
    player_id,variant,base_seconds,increment_seconds,rated,joined_at
  ) values(
    p_player_id,p_variant,p_base_seconds,p_increment_seconds,p_rated,clock_timestamp()
  )
  on conflict(player_id) do update set
    variant=excluded.variant,
    base_seconds=excluded.base_seconds,
    increment_seconds=excluded.increment_seconds,
    rated=excluded.rated,
    joined_at=excluded.joined_at;

  select q.* into opp
  from public.v3_variant_queue q
  where q.player_id<>p_player_id
    and q.variant=p_variant
    and q.base_seconds=p_base_seconds
    and q.increment_seconds=p_increment_seconds
    and q.rated=p_rated
    and not exists(
      select 1 from public.v3_variant_games g
      where g.status='active'
        and q.player_id in(g.white_player_id,g.black_player_id)
    )
  order by q.joined_at
  for update skip locked
  limit 1;

  if opp.player_id is null then return; end if;

  if random()<0.5 then
    white_id:=p_player_id;
    black_id:=opp.player_id;
  else
    white_id:=opp.player_id;
    black_id:=p_player_id;
  end if;

  insert into public.v3_variant_games(
    variant,white_player_id,black_player_id,start_index,start_fen,fen,turn,
    base_seconds,increment_seconds,white_ms,black_ms,clock_anchor_at,status,rated,
    white_checks,black_checks
  ) values(
    p_variant,white_id,black_id,p_start_index,p_start_fen,p_start_fen,'w',
    p_base_seconds,p_increment_seconds,p_base_seconds::bigint*1000,p_base_seconds::bigint*1000,
    clock_timestamp(),'active',p_rated,0,0
  ) returning id into gid;

  delete from public.v3_variant_queue
  where player_id in(p_player_id,opp.player_id);

  return query select * from public.v3_variant_games where id=gid;
end;
$$;

-- Browser clients never call this RPC. The Edge Function validates the
-- complete variant position using chessops, then commits one versioned move.
create or replace function public.v4_commit_advanced_variant_move_server(
  p_game_id uuid,
  p_player_id uuid,
  p_expected_ply integer,
  p_san text,
  p_uci text,
  p_fen text,
  p_next_turn text,
  p_white_ms bigint,
  p_black_ms bigint,
  p_result text,
  p_termination text
)
returns public.v3_variant_games
language plpgsql
security definer
set search_path=''
as $$
declare
  g public.v3_variant_games%rowtype;
  mover text;
begin
  select * into g
  from public.v3_variant_games
  where id=p_game_id
  for update;

  if g.id is null then raise exception 'game_not_found'; end if;
  if g.variant not in ('crazyhouse','atomic','antichess','horde','racingkings') then
    raise exception 'wrong_variant_engine';
  end if;
  if g.status<>'active' then raise exception 'game_not_active'; end if;
  if g.ply<>p_expected_ply then raise exception 'stale_game_version'; end if;

  mover:=case
    when g.white_player_id=p_player_id then 'w'
    when g.black_player_id=p_player_id then 'b'
    else null
  end;
  if mover is null then raise exception 'not_participant'; end if;
  if mover<>g.turn then raise exception 'wrong_turn'; end if;
  if p_next_turn not in('w','b') or p_white_ms<0 or p_black_ms<0 then
    raise exception 'invalid_server_state';
  end if;
  if btrim(coalesce(p_fen,''))='' or btrim(coalesce(p_uci,''))='' then
    raise exception 'invalid_server_state';
  end if;
  if p_result is not null and p_result not in('1-0','0-1','1/2-1/2') then
    raise exception 'invalid_result';
  end if;

  insert into public.v3_variant_moves(game_id,ply,san,uci,fen_after,mover_player_id)
  values(g.id,g.ply+1,coalesce(nullif(btrim(p_san),''),p_uci),p_uci,p_fen,p_player_id);

  update public.v3_variant_games set
    fen=p_fen,
    turn=p_next_turn,
    ply=ply+1,
    white_ms=p_white_ms,
    black_ms=p_black_ms,
    clock_anchor_at=case when p_result is null then clock_timestamp() else null end,
    status=case when p_result is null then 'active' else 'finished' end,
    result=p_result,
    termination=p_termination,
    draw_offered_by=null,
    finished_at=case when p_result is null then null else clock_timestamp() end
  where id=g.id
  returning * into g;

  if p_result is not null then
    perform private.v3_settle_variant_rating(g.id);
    select * into g from public.v3_variant_games where id=g.id;
  end if;

  return g;
end;
$$;

revoke all on function public.v4_commit_advanced_variant_move_server(
  uuid,uuid,integer,text,text,text,text,bigint,bigint,text,text
) from public,anon,authenticated;
grant execute on function public.v4_commit_advanced_variant_move_server(
  uuid,uuid,integer,text,text,text,text,bigint,bigint,text,text
) to service_role;
