-- Phase 5: configurable standard matchmaking + deterministic rematch flow.
-- Keeps the existing V2 5/10/15 queue intact for compatibility.

create table if not exists private.v5_matchmaking_queue (
  player_id uuid primary key references public.players(id) on delete cascade,
  base_seconds integer not null check (base_seconds between 30 and 3600),
  increment_seconds integer not null default 0 check (increment_seconds between 0 and 60),
  rated boolean not null default true,
  rating_snapshot integer not null default 1500,
  joined_at timestamptz not null default clock_timestamp(),
  last_seen_at timestamptz not null default clock_timestamp(),
  status text not null default 'waiting' check (status in ('waiting','matched')),
  matched_game_id uuid references public.v2_games(id) on delete set null
);

alter table private.v5_matchmaking_queue enable row level security;
revoke all on table private.v5_matchmaking_queue from public, anon, authenticated;

create index if not exists v5_matchmaking_waiting_idx
  on private.v5_matchmaking_queue(status, base_seconds, increment_seconds, rated, joined_at)
  where status='waiting';

create or replace function public.start_v5_matchmaking(
  p_base_seconds integer,
  p_increment_seconds integer default 0,
  p_rated boolean default true
)
returns table(
  queue_status text,
  game_id uuid,
  color text,
  opponent_player_id uuid,
  base_seconds integer,
  increment_seconds integer,
  rated boolean,
  grace_until timestamptz
)
language plpgsql
security definer
set search_path to 'public','private','auth'
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
  v_rated boolean := coalesce(p_rated,true);
begin
  if p_base_seconds is null or not (p_base_seconds between 30 and 3600) then
    raise exception 'unsupported_time_control' using errcode='22023';
  end if;
  if p_increment_seconds is null or not (p_increment_seconds between 0 and 60) then
    raise exception 'unsupported_increment' using errcode='22023';
  end if;

  v_player_id := private.v2_current_player_id();
  if v_player_id is null then
    raise exception 'player_profile_required' using errcode='42501';
  end if;

  select p.rating into v_rating
  from public.players p
  where p.id=v_player_id and p.status='active' and not coalesce(p.is_synthetic,false);
  if not found then
    raise exception 'active_player_required' using errcode='42501';
  end if;

  select g.* into v_existing
  from public.v2_games g
  where g.status in ('matched','active')
    and v_player_id in (g.white_player_id,g.black_player_id)
  order by g.created_at desc
  limit 1;

  if found then
    return query select
      'matched'::text,
      v_existing.id,
      case when v_existing.white_player_id=v_player_id then 'w' else 'b' end::text,
      case when v_existing.white_player_id=v_player_id then v_existing.black_player_id else v_existing.white_player_id end,
      v_existing.base_seconds,
      v_existing.increment_seconds,
      v_existing.rated,
      v_existing.grace_until;
    return;
  end if;

  delete from private.v5_matchmaking_queue q
  where q.status='waiting' and q.last_seen_at < v_now - interval '90 seconds';

  delete from private.v2_matchmaking_queue where player_id=v_player_id;

  insert into private.v5_matchmaking_queue(
    player_id,base_seconds,increment_seconds,rated,rating_snapshot,joined_at,last_seen_at,status,matched_game_id
  ) values(
    v_player_id,p_base_seconds,p_increment_seconds,v_rated,coalesce(v_rating,1500),v_now,v_now,'waiting',null
  )
  on conflict(player_id) do update set
    base_seconds=excluded.base_seconds,
    increment_seconds=excluded.increment_seconds,
    rated=excluded.rated,
    rating_snapshot=excluded.rating_snapshot,
    joined_at=case
      when private.v5_matchmaking_queue.status='waiting'
       and private.v5_matchmaking_queue.base_seconds=excluded.base_seconds
       and private.v5_matchmaking_queue.increment_seconds=excluded.increment_seconds
       and private.v5_matchmaking_queue.rated=excluded.rated
      then private.v5_matchmaking_queue.joined_at
      else excluded.joined_at
    end,
    last_seen_at=excluded.last_seen_at,
    status='waiting',
    matched_game_id=null;

  select q.player_id into v_opponent_id
  from private.v5_matchmaking_queue q
  where q.status='waiting'
    and q.base_seconds=p_base_seconds
    and q.increment_seconds=p_increment_seconds
    and q.rated=v_rated
    and q.player_id<>v_player_id
    and q.last_seen_at>=v_now-interval '90 seconds'
    and not exists(
      select 1 from public.v2_games ag
      where ag.status in ('matched','active')
        and q.player_id in (ag.white_player_id,ag.black_player_id)
    )
    and not exists(
      select 1 from public.v2_blocks b
      where (b.blocker_id=v_player_id and b.blocked_id=q.player_id)
         or (b.blocker_id=q.player_id and b.blocked_id=v_player_id)
    )
  order by q.joined_at asc
  for update of q skip locked
  limit 1;

  if v_opponent_id is null then
    return query select 'waiting'::text,null::uuid,null::text,null::uuid,
      p_base_seconds,p_increment_seconds,v_rated,null::timestamptz;
    return;
  end if;

  v_player_white := random()<0.5;
  v_grace := v_now+interval '5 seconds';

  insert into public.v2_games(
    white_player_id,black_player_id,rated,base_seconds,increment_seconds,
    white_ms,black_ms,clock_anchor_at,status,grace_until,variant
  ) values(
    case when v_player_white then v_player_id else v_opponent_id end,
    case when v_player_white then v_opponent_id else v_player_id end,
    v_rated,p_base_seconds,p_increment_seconds,
    p_base_seconds::bigint*1000,p_base_seconds::bigint*1000,
    v_grace,'matched',v_grace,'standard'
  ) returning * into v_game;

  update private.v5_matchmaking_queue
  set status='matched',matched_game_id=v_game.id,last_seen_at=v_now
  where player_id in (v_player_id,v_opponent_id);

  return query select
    'matched'::text,
    v_game.id,
    case when v_game.white_player_id=v_player_id then 'w' else 'b' end::text,
    v_opponent_id,
    v_game.base_seconds,
    v_game.increment_seconds,
    v_game.rated,
    v_game.grace_until;
end;
$$;

create or replace function public.poll_v5_matchmaking()
returns table(
  queue_status text,
  game_id uuid,
  color text,
  opponent_player_id uuid,
  base_seconds integer,
  increment_seconds integer,
  rated boolean,
  grace_until timestamptz
)
language plpgsql
security definer
set search_path to 'public','private','auth'
as $$
declare
  v_player_id uuid;
  v_base integer;
  v_inc integer;
  v_rated boolean;
  v_game_id uuid;
  v_game public.v2_games%rowtype;
begin
  v_player_id:=private.v2_current_player_id();
  if v_player_id is null then
    raise exception 'player_profile_required' using errcode='42501';
  end if;

  select q.base_seconds,q.increment_seconds,q.rated,q.matched_game_id
  into v_base,v_inc,v_rated,v_game_id
  from private.v5_matchmaking_queue q
  where q.player_id=v_player_id;

  if not found then
    return query select 'idle'::text,null::uuid,null::text,null::uuid,null::integer,null::integer,null::boolean,null::timestamptz;
    return;
  end if;

  if v_game_id is not null then
    select g.* into v_game from public.v2_games g where g.id=v_game_id;
    if found then
      return query select
        'matched'::text,
        v_game.id,
        case when v_game.white_player_id=v_player_id then 'w' else 'b' end::text,
        case when v_game.white_player_id=v_player_id then v_game.black_player_id else v_game.white_player_id end,
        v_game.base_seconds,v_game.increment_seconds,v_game.rated,v_game.grace_until;
      return;
    end if;
  end if;

  update private.v5_matchmaking_queue
  set last_seen_at=clock_timestamp()
  where player_id=v_player_id and status='waiting';

  return query select * from public.start_v5_matchmaking(v_base,v_inc,v_rated);
end;
$$;

create or replace function public.cancel_v5_matchmaking()
returns boolean
language plpgsql
security definer
set search_path to 'public','private','auth'
as $$
declare
  v_player_id uuid;
  v_count integer;
begin
  v_player_id:=private.v2_current_player_id();
  if v_player_id is null then return false; end if;
  delete from private.v5_matchmaking_queue
  where player_id=v_player_id and status='waiting';
  get diagnostics v_count=row_count;
  return v_count>0;
end;
$$;

revoke all on function public.start_v5_matchmaking(integer,integer,boolean) from public,anon;
revoke all on function public.poll_v5_matchmaking() from public,anon;
revoke all on function public.cancel_v5_matchmaking() from public,anon;
grant execute on function public.start_v5_matchmaking(integer,integer,boolean) to authenticated;
grant execute on function public.poll_v5_matchmaking() to authenticated;
grant execute on function public.cancel_v5_matchmaking() to authenticated;

alter table public.v2_challenges
  add column if not exists challenge_type text not null default 'direct',
  add column if not exists source_game_id uuid references public.v2_games(id) on delete set null;

do $$ begin
  if not exists(
    select 1 from pg_constraint
    where conrelid='public.v2_challenges'::regclass
      and conname='v2_challenges_type_check'
  ) then
    alter table public.v2_challenges
      add constraint v2_challenges_type_check check(challenge_type in ('direct','rematch'));
  end if;
end $$;

create unique index if not exists v2_challenges_rematch_source_unique
  on public.v2_challenges(source_game_id)
  where challenge_type='rematch' and source_game_id is not null;

create or replace function public.v5_get_rematch_state(p_source_game_id uuid)
returns table(
  challenge_id uuid,
  rematch_status text,
  game_id uuid,
  direction text,
  opponent_player_id uuid
)
language plpgsql
stable
security definer
set search_path to 'public','private','auth'
as $$
declare
  v_me uuid;
begin
  v_me:=private.v2_current_player_id();
  if v_me is null then
    raise exception 'player_profile_required' using errcode='42501';
  end if;

  if not exists(
    select 1 from public.v2_games g
    where g.id=p_source_game_id and v_me in (g.white_player_id,g.black_player_id)
  ) then
    raise exception 'game_not_accessible' using errcode='42501';
  end if;

  return query
  select c.id,c.status,c.game_id,
    case when c.challenger_id=v_me then 'outgoing' else 'incoming' end::text,
    case when c.challenger_id=v_me then c.challenged_id else c.challenger_id end
  from public.v2_challenges c
  where c.challenge_type='rematch'
    and c.source_game_id=p_source_game_id
    and v_me in (c.challenger_id,c.challenged_id)
  limit 1;
end;
$$;

create or replace function public.v5_request_rematch(p_source_game_id uuid)
returns table(challenge_id uuid,rematch_status text,game_id uuid)
language plpgsql
security definer
set search_path to 'public','private','auth'
as $$
declare
  v_me uuid;
  v_source public.v2_games%rowtype;
  v_opponent uuid;
  v_ch public.v2_challenges%rowtype;
  v_new_game public.v2_games%rowtype;
  v_grace timestamptz;
begin
  v_me:=private.v2_current_player_id();
  if v_me is null then
    raise exception 'player_profile_required' using errcode='42501';
  end if;

  select * into v_source
  from public.v2_games
  where id=p_source_game_id
  for update;

  if not found or v_me not in (v_source.white_player_id,v_source.black_player_id) then
    raise exception 'game_not_accessible' using errcode='42501';
  end if;
  if v_source.status<>'finished' then
    raise exception 'game_not_finished' using errcode='22023';
  end if;
  if v_source.variant<>'standard' then
    raise exception 'unsupported_rematch_variant' using errcode='22023';
  end if;

  v_opponent:=case when v_source.white_player_id=v_me then v_source.black_player_id else v_source.white_player_id end;

  if exists(
    select 1 from public.v2_blocks b
    where (b.blocker_id=v_me and b.blocked_id=v_opponent)
       or (b.blocker_id=v_opponent and b.blocked_id=v_me)
  ) then
    raise exception 'blocked' using errcode='42501';
  end if;

  select * into v_ch
  from public.v2_challenges
  where challenge_type='rematch' and source_game_id=p_source_game_id
  for update;

  if not found then
    insert into public.v2_challenges(
      challenger_id,challenged_id,base_seconds,increment_seconds,rated,variant,
      status,expires_at,challenge_type,source_game_id
    ) values(
      v_me,v_opponent,v_source.base_seconds,v_source.increment_seconds,v_source.rated,'standard',
      'pending',clock_timestamp()+interval '10 minutes','rematch',p_source_game_id
    ) returning * into v_ch;

    insert into public.v2_notifications(player_id,kind,title,body,href)
    values(v_opponent,'rematch','طلب إعادة مباراة','يريد خصمك إعادة المباراة.','play-v2.html?game='||p_source_game_id::text||'&rematch=1');

    return query select v_ch.id,'pending'::text,null::uuid;
    return;
  end if;

  if v_ch.status='accepted' and v_ch.game_id is not null then
    return query select v_ch.id,'accepted'::text,v_ch.game_id;
    return;
  end if;

  if v_ch.status<>'pending' then
    return query select v_ch.id,v_ch.status,v_ch.game_id;
    return;
  end if;

  if v_ch.expires_at<=clock_timestamp() then
    update public.v2_challenges set status='expired',updated_at=clock_timestamp() where id=v_ch.id;
    return query select v_ch.id,'expired'::text,null::uuid;
    return;
  end if;

  if v_ch.challenger_id=v_me then
    return query select v_ch.id,'pending'::text,null::uuid;
    return;
  end if;

  if v_ch.challenged_id<>v_me then
    raise exception 'rematch_not_available' using errcode='42501';
  end if;

  if exists(
    select 1 from public.v2_games g
    where g.status in ('matched','active')
      and (v_source.white_player_id in (g.white_player_id,g.black_player_id)
        or v_source.black_player_id in (g.white_player_id,g.black_player_id))
  ) then
    raise exception 'player_already_in_game' using errcode='23505';
  end if;

  v_grace:=clock_timestamp()+interval '5 seconds';

  insert into public.v2_games(
    white_player_id,black_player_id,rated,base_seconds,increment_seconds,
    white_ms,black_ms,clock_anchor_at,status,grace_until,variant
  ) values(
    v_source.black_player_id,
    v_source.white_player_id,
    v_source.rated,
    v_source.base_seconds,
    v_source.increment_seconds,
    v_source.base_seconds::bigint*1000,
    v_source.base_seconds::bigint*1000,
    v_grace,'matched',v_grace,'standard'
  ) returning * into v_new_game;

  update public.v2_challenges
  set status='accepted',game_id=v_new_game.id,updated_at=clock_timestamp()
  where id=v_ch.id;

  delete from private.v5_matchmaking_queue where player_id in (v_source.white_player_id,v_source.black_player_id);
  delete from private.v2_matchmaking_queue where player_id in (v_source.white_player_id,v_source.black_player_id);

  insert into public.v2_notifications(player_id,kind,title,body,href)
  values
    (v_source.white_player_id,'rematch_accepted','بدأت إعادة المباراة','تم قبول إعادة المباراة.','play-v2.html?game='||v_new_game.id::text),
    (v_source.black_player_id,'rematch_accepted','بدأت إعادة المباراة','تم قبول إعادة المباراة.','play-v2.html?game='||v_new_game.id::text);

  return query select v_ch.id,'accepted'::text,v_new_game.id;
end;
$$;

revoke all on function public.v5_get_rematch_state(uuid) from public,anon;
revoke all on function public.v5_request_rematch(uuid) from public,anon;
grant execute on function public.v5_get_rematch_state(uuid) to authenticated;
grant execute on function public.v5_request_rematch(uuid) to authenticated;

-- Rematch requests use their dedicated source-game flow and should not appear
-- in the generic direct-challenge inbox, which randomizes colors on acceptance.
create or replace function public.v2_list_challenges()
returns table(
  challenge_id uuid,
  direction text,
  opponent_id uuid,
  opponent_name text,
  opponent_rating integer,
  base_seconds integer,
  increment_seconds integer,
  rated boolean,
  variant text,
  status text,
  game_id uuid,
  created_at timestamptz,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path to 'public','private','auth'
as $$
  with me as (select private.v2_current_player_id() id)
  select c.id,
    case when c.challenger_id=me.id then 'outgoing' else 'incoming' end,
    case when c.challenger_id=me.id then c.challenged_id else c.challenger_id end,
    p.name,p.rating,c.base_seconds,c.increment_seconds,c.rated,c.variant,c.status,c.game_id,c.created_at,c.expires_at
  from public.v2_challenges c
  join me on me.id in (c.challenger_id,c.challenged_id)
  join public.players p on p.id=case when c.challenger_id=me.id then c.challenged_id else c.challenger_id end
  where c.challenge_type='direct'
    and c.created_at>clock_timestamp()-interval '30 days'
  order by c.created_at desc
  limit 100;
$$;
