-- Phase 6: server-side rate limiting and Fair Play telemetry.
-- Fair Play signals create review cases only. No automatic suspension or rating action occurs here.

create table if not exists private.v6_rate_buckets (
  actor_player_id uuid not null references public.players(id) on delete cascade,
  bucket text not null,
  window_started_at timestamptz not null default clock_timestamp(),
  hits integer not null default 0 check (hits >= 0),
  primary key (actor_player_id, bucket)
);

alter table private.v6_rate_buckets enable row level security;
revoke all on private.v6_rate_buckets from public, anon, authenticated;

create or replace function private.v6_consume_rate_limit(
  p_player_id uuid,
  p_bucket text,
  p_max_hits integer,
  p_window_seconds integer
)
returns table(allowed boolean, remaining integer, retry_after_ms integer)
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_hits integer;
  v_started timestamptz;
  v_retry numeric;
begin
  if p_player_id is null or coalesce(length(trim(p_bucket)),0)=0 then
    raise exception 'invalid_rate_limit_key' using errcode='22023';
  end if;
  if p_max_hits is null or p_max_hits < 1 or p_window_seconds is null or p_window_seconds < 1 then
    raise exception 'invalid_rate_limit_config' using errcode='22023';
  end if;

  insert into private.v6_rate_buckets(actor_player_id,bucket,window_started_at,hits)
  values(p_player_id,p_bucket,v_now,1)
  on conflict(actor_player_id,bucket) do update set
    hits = case
      when private.v6_rate_buckets.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then 1
      else private.v6_rate_buckets.hits + 1
    end,
    window_started_at = case
      when private.v6_rate_buckets.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then v_now
      else private.v6_rate_buckets.window_started_at
    end
  returning hits,window_started_at into v_hits,v_started;

  v_retry := greatest(0, extract(epoch from (v_started + make_interval(secs => p_window_seconds) - v_now)) * 1000);
  return query select
    v_hits <= p_max_hits,
    greatest(0,p_max_hits-v_hits),
    ceil(v_retry)::integer;
end;
$$;

create or replace function public.v6_consume_rate_limit_server(
  p_player_id uuid,
  p_bucket text,
  p_max_hits integer,
  p_window_seconds integer
)
returns table(allowed boolean, remaining integer, retry_after_ms integer)
language sql
security definer
set search_path to ''
as $$
  select * from private.v6_consume_rate_limit(p_player_id,p_bucket,p_max_hits,p_window_seconds);
$$;

revoke all on function public.v6_consume_rate_limit_server(uuid,text,integer,integer) from public,anon,authenticated;
grant execute on function public.v6_consume_rate_limit_server(uuid,text,integer,integer) to service_role;

create or replace function private.v6_limit_content_insert()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_player uuid;
  v_bucket text;
  v_max integer;
  v_window integer;
  v_allowed boolean;
begin
  if tg_table_schema='public' and tg_table_name='v2_messages' then
    v_player:=new.sender_id;
    if new.recipient_id is not null then
      v_bucket:='direct_message'; v_max:=18; v_window:=60;
    else
      v_bucket:='club_message'; v_max:=30; v_window:=60;
    end if;
  elsif tg_table_schema='public' and tg_table_name='v2_challenges' then
    v_player:=new.challenger_id; v_bucket:='challenge'; v_max:=12; v_window:=60;
  elsif tg_table_schema='public' and tg_table_name='v3_reports' then
    v_player:=new.reporter_player_id; v_bucket:='report'; v_max:=5; v_window:=300;
  else
    return new;
  end if;

  select r.allowed into v_allowed
  from private.v6_consume_rate_limit(v_player,v_bucket,v_max,v_window) r;
  if not coalesce(v_allowed,false) then
    raise exception 'rate_limit_exceeded' using errcode='P0001';
  end if;
  return new;
end;
$$;

revoke all on function private.v6_limit_content_insert() from public,anon,authenticated;

drop trigger if exists trg_v6_limit_v2_messages on public.v2_messages;
create trigger trg_v6_limit_v2_messages
before insert on public.v2_messages
for each row execute function private.v6_limit_content_insert();

drop trigger if exists trg_v6_limit_v2_challenges on public.v2_challenges;
create trigger trg_v6_limit_v2_challenges
before insert on public.v2_challenges
for each row execute function private.v6_limit_content_insert();

drop trigger if exists trg_v6_limit_v3_reports on public.v3_reports;
create trigger trg_v6_limit_v3_reports
before insert on public.v3_reports
for each row execute function private.v6_limit_content_insert();

create table if not exists private.v6_fair_play_move_events (
  id bigint generated always as identity primary key,
  source_type text not null,
  game_id uuid not null,
  player_id uuid not null references public.players(id) on delete cascade,
  ply integer not null check (ply > 0),
  move_uci text,
  san text,
  server_move_ms integer not null check (server_move_ms >= 0),
  remaining_ms bigint,
  rated boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  unique(source_type,game_id,ply)
);

alter table private.v6_fair_play_move_events enable row level security;
revoke all on private.v6_fair_play_move_events from public,anon,authenticated;
create index if not exists v6_fair_play_events_player_recent_idx
  on private.v6_fair_play_move_events(player_id,created_at desc)
  where rated;

create table if not exists private.v6_fair_play_cases (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null default 'review' check (status in ('review','cleared','actioned')),
  score integer not null default 0 check (score between 0 and 100),
  signals jsonb not null default '{}'::jsonb,
  last_game_id uuid,
  event_count integer not null default 0,
  resolution_note text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

alter table private.v6_fair_play_cases enable row level security;
revoke all on private.v6_fair_play_cases from public,anon,authenticated;
create unique index if not exists v6_fair_play_one_review_case_per_player
  on private.v6_fair_play_cases(player_id) where status='review';

create or replace function public.v6_record_move_event_server(
  p_source_type text,
  p_game_id uuid,
  p_player_id uuid,
  p_ply integer,
  p_move_uci text,
  p_san text,
  p_server_move_ms integer,
  p_remaining_ms bigint,
  p_rated boolean
)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_count integer;
  v_fast integer;
  v_avg numeric;
  v_std numeric;
  v_score integer;
  v_signals jsonb;
begin
  if p_player_id is null or p_game_id is null or p_ply is null or p_ply < 1 then
    raise exception 'invalid_fair_play_event' using errcode='22023';
  end if;
  if p_server_move_ms is null or p_server_move_ms < 0 or p_server_move_ms > 86400000 then
    raise exception 'invalid_move_duration' using errcode='22023';
  end if;

  insert into private.v6_fair_play_move_events(
    source_type,game_id,player_id,ply,move_uci,san,server_move_ms,remaining_ms,rated
  ) values(
    left(coalesce(nullif(trim(p_source_type),''),'standard'),32),p_game_id,p_player_id,p_ply,
    left(p_move_uci,32),left(p_san,64),p_server_move_ms,p_remaining_ms,coalesce(p_rated,false)
  ) on conflict(source_type,game_id,ply) do nothing;

  if not coalesce(p_rated,false) or p_ply < 20 or mod(p_ply,4)<>0 then
    return;
  end if;

  select count(*)::integer,
         count(*) filter(where e.server_move_ms <= 150)::integer,
         avg(e.server_move_ms),
         stddev_pop(e.server_move_ms)
  into v_count,v_fast,v_avg,v_std
  from (
    select server_move_ms
    from private.v6_fair_play_move_events
    where player_id=p_player_id and rated and created_at >= clock_timestamp()-interval '14 days'
    order by created_at desc
    limit 28
  ) e;

  if coalesce(v_count,0) < 20 then return; end if;

  -- Timing is only a review signal. It never proves cheating by itself.
  if (coalesce(v_fast,0) >= 16 and coalesce(v_avg,999999) <= 500)
     or (coalesce(v_avg,999999) <= 650 and coalesce(v_std,999999) <= 120) then
    v_score := least(90,
      45
      + least(25,coalesce(v_fast,0))
      + case when coalesce(v_std,999999)<=120 then 15 else 0 end
    );
    v_signals := jsonb_build_object(
      'timing_window_moves',v_count,
      'moves_under_150ms',v_fast,
      'average_server_move_ms',round(v_avg,1),
      'timing_stddev_ms',round(coalesce(v_std,0),1),
      'source_type',p_source_type
    );

    insert into private.v6_fair_play_cases(player_id,status,score,signals,last_game_id,event_count,updated_at)
    values(p_player_id,'review',v_score,v_signals,p_game_id,v_count,clock_timestamp())
    on conflict(player_id) where status='review' do update set
      score=greatest(private.v6_fair_play_cases.score,excluded.score),
      signals=excluded.signals,
      last_game_id=excluded.last_game_id,
      event_count=excluded.event_count,
      updated_at=clock_timestamp();
  end if;

  -- No automatic suspension, ban, or rating change is performed by Fair Play telemetry.
end;
$$;

revoke all on function public.v6_record_move_event_server(text,uuid,uuid,integer,text,text,integer,bigint,boolean) from public,anon,authenticated;
grant execute on function public.v6_record_move_event_server(text,uuid,uuid,integer,text,text,integer,bigint,boolean) to service_role;

create or replace function public.admin_v6_list_fair_play_cases(p_status text default 'review')
returns table(
  id uuid, player_id uuid, player_name text, status text, score integer,
  signals jsonb, last_game_id uuid, event_count integer, created_at timestamptz, updated_at timestamptz
)
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform private.require_operator();
  return query
  select c.id,c.player_id,p.name,c.status,c.score,c.signals,c.last_game_id,c.event_count,c.created_at,c.updated_at
  from private.v6_fair_play_cases c
  join public.players p on p.id=c.player_id
  where p_status is null or c.status=p_status
  order by c.score desc,c.updated_at desc
  limit 500;
end;
$$;

create or replace function public.admin_v6_resolve_fair_play_case(
  p_case_id uuid,
  p_status text,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_actor uuid;
begin
  perform private.require_operator();
  if p_status not in ('cleared','actioned') then
    raise exception 'invalid_fair_play_resolution' using errcode='22023';
  end if;
  select au.id into v_actor from auth.users au where au.id=auth.uid();
  update private.v6_fair_play_cases
  set status=p_status,
      resolution_note=nullif(left(trim(coalesce(p_note,'')),1000),''),
      resolved_by=v_actor,
      resolved_at=clock_timestamp(),
      updated_at=clock_timestamp()
  where id=p_case_id and status='review';
  return found;
end;
$$;

revoke all on function public.admin_v6_list_fair_play_cases(text) from public,anon;
revoke all on function public.admin_v6_resolve_fair_play_case(uuid,text,text) from public,anon;
grant execute on function public.admin_v6_list_fair_play_cases(text) to authenticated;
grant execute on function public.admin_v6_resolve_fair_play_case(uuid,text,text) to authenticated;
