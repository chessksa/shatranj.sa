-- Phase 3: Arena and Swiss on top of the existing tournament match/readiness engine.

alter table public.tournaments add column if not exists format text not null default 'knockout';
alter table public.tournaments drop constraint if exists tournaments_format_check;
alter table public.tournaments add constraint tournaments_format_check check(format in('knockout','arena','swiss'));
alter table public.tournaments add column if not exists rounds_total integer check(rounds_total is null or rounds_total between 1 and 12);
alter table public.tournaments add column if not exists arena_duration_minutes integer check(arena_duration_minutes is null or arena_duration_minutes between 5 and 360);
alter table public.tournaments add column if not exists arena_ends_at timestamptz;

create table if not exists public.v3_tournament_scores (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  points numeric(7,2) not null default 0,
  wins integer not null default 0,
  draws integer not null default 0,
  losses integer not null default 0,
  games integer not null default 0,
  last_opponent_id uuid references public.players(id) on delete set null,
  updated_at timestamptz not null default clock_timestamp(),
  primary key(tournament_id,player_id)
);
create index if not exists v3_tournament_scores_rank_idx on public.v3_tournament_scores(tournament_id,points desc,wins desc);
alter table public.v3_tournament_scores enable row level security;
revoke all on public.v3_tournament_scores from public,anon,authenticated;
grant select on public.v3_tournament_scores to anon,authenticated;
create policy v3_tournament_scores_public_read on public.v3_tournament_scores for select to anon,authenticated using(true);

create table if not exists public.v3_arena_queue (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  joined_at timestamptz not null default clock_timestamp(),
  primary key(tournament_id,player_id)
);
alter table public.v3_arena_queue enable row level security;
revoke all on public.v3_arena_queue from public,anon,authenticated;
grant select on public.v3_arena_queue to authenticated;
create policy v3_arena_queue_self_read on public.v3_arena_queue for select to authenticated using(player_id=public.v2_my_player_id());

create or replace function private.v3_finish_tournament_by_scores(p_tournament_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare winner uuid;
begin
  select s.player_id into winner from public.v3_tournament_scores s
  where s.tournament_id=p_tournament_id
  order by s.points desc,s.wins desc,s.games asc,s.player_id limit 1;
  update public.tournaments set status='finished',winner_player_id=winner,finished_at=clock_timestamp(),arena_ends_at=coalesce(arena_ends_at,clock_timestamp())
  where id=p_tournament_id and status<>'finished';
  delete from public.v3_arena_queue where tournament_id=p_tournament_id;
end;$$;
revoke all on function private.v3_finish_tournament_by_scores(uuid) from public,anon,authenticated;

create or replace function private.v3_create_swiss_round(p_tournament_id uuid,p_round integer)
returns integer language plpgsql security definer set search_path='' as $$
declare players uuid[];p1 uuid;p2 uuid;cand uuid;mno integer:=1;remaining integer;prior boolean;
begin
  select array_agg(s.player_id order by s.points desc,p.rating desc,s.wins desc,random()) into players
  from public.v3_tournament_scores s join public.players p on p.id=s.player_id
  where s.tournament_id=p_tournament_id and p.status='active';
  remaining:=coalesce(array_length(players,1),0);
  if remaining<1 then return 0;end if;
  while coalesce(array_length(players,1),0)>1 loop
    p1:=players[1];players:=array_remove(players,p1);p2:=null;
    foreach cand in array players loop
      select exists(select 1 from private.tournament_matches tm where tm.tournament_id=p_tournament_id and tm.round_no<p_round and ((tm.player_one_id=p1 and tm.player_two_id=cand) or (tm.player_one_id=cand and tm.player_two_id=p1))) into prior;
      if not prior then p2:=cand;exit;end if;
    end loop;
    if p2 is null then p2:=players[1];end if;
    players:=array_remove(players,p2);
    insert into private.tournament_matches(tournament_id,round_no,match_no,player_one_id,player_two_id,status,ready_opens_at)
    values(p_tournament_id,p_round,mno,p1,p2,'pending',clock_timestamp());
    mno:=mno+1;
  end loop;
  if coalesce(array_length(players,1),0)=1 then
    p1:=players[1];
    insert into private.tournament_matches(tournament_id,round_no,match_no,player_one_id,winner_player_id,status,ready_opens_at,finished_at)
    values(p_tournament_id,p_round,mno,p1,p1,'bye',clock_timestamp(),clock_timestamp());
    update public.v3_tournament_scores set points=points+1,wins=wins+1,games=games+1,updated_at=clock_timestamp() where tournament_id=p_tournament_id and player_id=p1;
    mno:=mno+1;
  end if;
  return mno-1;
end;$$;
revoke all on function private.v3_create_swiss_round(uuid,integer) from public,anon,authenticated;

create or replace function private.v3_start_swiss_core(p_tournament_id uuid,p_force boolean default false)
returns boolean language plpgsql security definer set search_path='' as $$
declare t public.tournaments%rowtype;c integer;r integer;
begin
  select * into t from public.tournaments where id=p_tournament_id for update;
  if t.id is null then raise exception 'tournament not found';end if;if t.status<>'open' then return false;end if;
  select count(*) into c from public.tournament_registrations tr join public.players p on p.id=tr.player_id where tr.tournament_id=t.id and tr.status='registered' and p.status='active';
  if c<2 then if p_force then raise exception 'at least two registered players required';end if;return false;end if;
  r:=coalesce(t.rounds_total,greatest(1,least(9,ceil(ln(c::numeric)/ln(2::numeric))::integer)));
  delete from private.tournament_matches where tournament_id=t.id;delete from public.v3_tournament_scores where tournament_id=t.id;
  insert into public.v3_tournament_scores(tournament_id,player_id)
  select t.id,tr.player_id from public.tournament_registrations tr join public.players p on p.id=tr.player_id where tr.tournament_id=t.id and tr.status='registered' and p.status='active';
  update public.tournaments set status='running',rounds_total=r,registration_closes_at=coalesce(registration_closes_at,clock_timestamp()) where id=t.id;
  perform private.v3_create_swiss_round(t.id,1);return true;
end;$$;
revoke all on function private.v3_start_swiss_core(uuid,boolean) from public,anon,authenticated;

create or replace function private.v3_start_arena_core(p_tournament_id uuid,p_force boolean default false)
returns boolean language plpgsql security definer set search_path='' as $$
declare t public.tournaments%rowtype;c integer;duration integer;
begin
  select * into t from public.tournaments where id=p_tournament_id for update;
  if t.id is null then raise exception 'tournament not found';end if;if t.status<>'open' then return false;end if;
  select count(*) into c from public.tournament_registrations tr join public.players p on p.id=tr.player_id where tr.tournament_id=t.id and tr.status='registered' and p.status='active';
  if c<2 then if p_force then raise exception 'at least two registered players required';end if;return false;end if;
  duration:=coalesce(t.arena_duration_minutes,60);
  delete from private.tournament_matches where tournament_id=t.id;delete from public.v3_tournament_scores where tournament_id=t.id;delete from public.v3_arena_queue where tournament_id=t.id;
  insert into public.v3_tournament_scores(tournament_id,player_id)
  select t.id,tr.player_id from public.tournament_registrations tr join public.players p on p.id=tr.player_id where tr.tournament_id=t.id and tr.status='registered' and p.status='active';
  update public.tournaments set status='running',arena_duration_minutes=duration,arena_ends_at=clock_timestamp()+make_interval(mins=>duration),registration_closes_at=coalesce(registration_closes_at,clock_timestamp()) where id=t.id;
  return true;
end;$$;
revoke all on function private.v3_start_arena_core(uuid,boolean) from public,anon,authenticated;

create or replace function public.admin_create_tournament_v3(p_name text,p_scope_type text,p_country text,p_city text,p_time_control text,p_starts_at timestamptz,p_registration_opens_at timestamptz,p_registration_closes_at timestamptz,p_max_players integer,p_status text,p_format text default 'knockout',p_rounds_total integer default null,p_arena_duration_minutes integer default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare tid uuid;
begin
  if p_format not in('knockout','arena','swiss') then raise exception 'invalid format';end if;
  tid:=public.admin_create_tournament(p_name,p_scope_type,p_country,p_city,p_time_control,p_starts_at,p_registration_opens_at,p_registration_closes_at,p_max_players,p_status);
  update public.tournaments set format=p_format,rounds_total=case when p_format='swiss' then p_rounds_total else null end,arena_duration_minutes=case when p_format='arena' then coalesce(p_arena_duration_minutes,60) else null end where id=tid;
  return tid;
end;$$;
revoke all on function public.admin_create_tournament_v3(text,text,text,text,text,timestamptz,timestamptz,timestamptz,integer,text,text,integer,integer) from public,anon;
grant execute on function public.admin_create_tournament_v3(text,text,text,text,text,timestamptz,timestamptz,timestamptz,integer,text,text,integer,integer) to authenticated;

create or replace function public.admin_start_tournament(p_tournament_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_admin uuid;v_tournament public.tournaments%rowtype;v_ok boolean;
begin
  v_admin:=private.require_operator();select * into v_tournament from public.tournaments t where t.id=p_tournament_id;if v_tournament.id is null then raise exception 'tournament not found';end if;
  if v_tournament.scope_type='global' then if not exists(select 1 from private.admin_users a where a.auth_user_id=v_admin and a.is_active and(a.role='owner' or a.scope_type='global')) then raise exception 'outside admin scope';end if;else perform private.require_operator_scope(v_tournament.country,v_tournament.city);end if;
  if v_tournament.format='swiss' then v_ok:=private.v3_start_swiss_core(p_tournament_id,true);elsif v_tournament.format='arena' then v_ok:=private.v3_start_arena_core(p_tournament_id,true);else v_ok:=private.start_tournament_core(p_tournament_id,true);end if;
  if not v_ok then raise exception 'tournament could not start';end if;
  insert into private.admin_actions(admin_auth_user_id,tournament_id,action_type,reason,details) values(v_admin,p_tournament_id,'tournament_start','بدء البطولة',jsonb_build_object('manual',true,'format',v_tournament.format));return true;
end;$$;

create or replace function private.start_due_tournaments()
returns integer language plpgsql security definer set search_path='' as $$
declare rec record;started integer:=0;ok boolean;
begin
  for rec in select t.id,t.format from public.tournaments t where t.status='open' and t.starts_at is not null and t.starts_at<=clock_timestamp() order by t.starts_at loop
    begin
      if rec.format='swiss' then ok:=private.v3_start_swiss_core(rec.id,false);elsif rec.format='arena' then ok:=private.v3_start_arena_core(rec.id,false);else ok:=private.start_tournament_core(rec.id,false);end if;
      if ok then started:=started+1;end if;
    exception when others then null;end;
  end loop;return started;
end;$$;

create or replace function public.v3_arena_request_pairing(p_tournament_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare pid uuid;t public.tournaments%rowtype;opp public.v3_arena_queue%rowtype;mid uuid;mno integer;
begin
  pid:=public.v2_my_player_id();if pid is null then raise exception 'authentication_required';end if;
  select * into t from public.tournaments where id=p_tournament_id for update;if t.id is null or t.format<>'arena' or t.status<>'running' then raise exception 'arena_not_running';end if;
  if t.arena_ends_at is not null and clock_timestamp()>=t.arena_ends_at then perform private.v3_finish_tournament_by_scores(t.id);return null;end if;
  if not exists(select 1 from public.tournament_registrations tr where tr.tournament_id=t.id and tr.player_id=pid and tr.status='registered') then raise exception 'not_registered';end if;
  select tm.id into mid from private.tournament_matches tm where tm.tournament_id=t.id and tm.status in('pending','active') and pid in(tm.player_one_id,tm.player_two_id) order by tm.created_at desc limit 1;if mid is not null then return mid;end if;
  insert into public.v3_arena_queue(tournament_id,player_id,joined_at) values(t.id,pid,clock_timestamp()) on conflict(tournament_id,player_id) do update set joined_at=excluded.joined_at;
  select q.* into opp from public.v3_arena_queue q where q.tournament_id=t.id and q.player_id<>pid and not exists(select 1 from private.tournament_matches tm where tm.tournament_id=t.id and tm.status in('pending','active') and q.player_id in(tm.player_one_id,tm.player_two_id)) order by case when exists(select 1 from public.v3_tournament_scores s where s.tournament_id=t.id and s.player_id=pid and s.last_opponent_id=q.player_id) then 1 else 0 end,q.joined_at for update skip locked limit 1;
  if opp.player_id is null then return null;end if;
  select coalesce(max(match_no),0)+1 into mno from private.tournament_matches where tournament_id=t.id and round_no=1;
  insert into private.tournament_matches(tournament_id,round_no,match_no,player_one_id,player_two_id,status,ready_opens_at) values(t.id,1,mno,pid,opp.player_id,'pending',clock_timestamp()) returning id into mid;
  delete from public.v3_arena_queue where tournament_id=t.id and player_id in(pid,opp.player_id);return mid;
end;$$;
revoke all on function public.v3_arena_request_pairing(uuid) from public,anon;
grant execute on function public.v3_arena_request_pairing(uuid) to authenticated;

create or replace function public.v3_tournament_standings(p_tournament_id uuid)
returns table(rank_no bigint,player_id uuid,player_name text,points numeric,wins integer,draws integer,losses integer,games integer)
language sql stable security invoker set search_path='' as $$
 select row_number() over(order by s.points desc,s.wins desc,s.games asc,p.name),s.player_id,p.name,s.points,s.wins,s.draws,s.losses,s.games from public.v3_tournament_scores s join public.players p on p.id=s.player_id where s.tournament_id=p_tournament_id order by s.points desc,s.wins desc,s.games asc,p.name;
$$;
grant execute on function public.v3_tournament_standings(uuid) to anon,authenticated;

create or replace function private.process_tournament_live_game()
returns trigger language plpgsql security definer set search_path='' as $$
declare m private.tournament_matches%rowtype;gp private.live_game_players%rowtype;winner uuid;loser uuid;fmt text;rounds integer;ends_at timestamptz;
begin
 if new.status<>'finished' or old.status='finished' or new.result is null then return new;end if;
 select * into m from private.tournament_matches tm where tm.live_game_id=new.id for update;if m.id is null then return new;end if;
 select t.format,t.rounds_total,t.arena_ends_at into fmt,rounds,ends_at from public.tournaments t where t.id=m.tournament_id;
 if fmt='knockout' then
   if new.result='1/2-1/2' then update private.tournament_matches set status='pending',live_game_id=null,attempt_no=attempt_no+1,player_one_ready_at=null,player_two_ready_at=null,player_one_seat_key_cipher=null,player_two_seat_key_cipher=null,player_one_color=null,player_two_color=null,started_at=null where id=m.id;return new;end if;
   select * into gp from private.live_game_players where game_id=new.id;if gp.game_id is null then return new;end if;
   if new.result='1-0' then winner:=gp.white_player_id;elsif new.result='0-1' then winner:=gp.black_player_id;else return new;end if;
   update private.tournament_matches set status='finished',winner_player_id=winner,finished_at=clock_timestamp() where id=m.id;perform private.advance_tournament_match(m.id,winner);return new;
 end if;
 select * into gp from private.live_game_players where game_id=new.id;if gp.game_id is null then return new;end if;
 if new.result='1-0' then winner:=gp.white_player_id;loser:=gp.black_player_id;elsif new.result='0-1' then winner:=gp.black_player_id;loser:=gp.white_player_id;end if;
 update private.tournament_matches set status='finished',winner_player_id=winner,finished_at=clock_timestamp() where id=m.id;
 if new.result='1/2-1/2' then
   update public.v3_tournament_scores set points=points+case when fmt='arena' then 1 else 0.5 end,draws=draws+1,games=games+1,last_opponent_id=case when player_id=gp.white_player_id then gp.black_player_id else gp.white_player_id end,updated_at=clock_timestamp() where tournament_id=m.tournament_id and player_id in(gp.white_player_id,gp.black_player_id);
 else
   update public.v3_tournament_scores set points=points+case when fmt='arena' then 2 else 1 end,wins=wins+1,games=games+1,last_opponent_id=loser,updated_at=clock_timestamp() where tournament_id=m.tournament_id and player_id=winner;
   update public.v3_tournament_scores set losses=losses+1,games=games+1,last_opponent_id=winner,updated_at=clock_timestamp() where tournament_id=m.tournament_id and player_id=loser;
 end if;
 if fmt='swiss' and not exists(select 1 from private.tournament_matches x where x.tournament_id=m.tournament_id and x.round_no=m.round_no and x.status in('pending','active')) then
   if m.round_no<coalesce(rounds,m.round_no) then perform private.v3_create_swiss_round(m.tournament_id,m.round_no+1);else perform private.v3_finish_tournament_by_scores(m.tournament_id);end if;
 elsif fmt='arena' and ends_at is not null and clock_timestamp()>=ends_at and not exists(select 1 from private.tournament_matches x where x.tournament_id=m.tournament_id and x.status in('pending','active')) then perform private.v3_finish_tournament_by_scores(m.tournament_id);end if;
 return new;
end;$$;
