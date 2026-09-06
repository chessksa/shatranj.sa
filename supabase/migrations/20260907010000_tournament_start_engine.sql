-- Tournament knockout engine: scheduled/manual starts, bracket, readiness, live games and advancement.

create table if not exists private.tournament_matches (
  id uuid primary key default extensions.gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_no integer not null check (round_no >= 1),
  match_no integer not null check (match_no >= 1),
  player_one_id uuid references public.players(id) on delete set null,
  player_two_id uuid references public.players(id) on delete set null,
  winner_player_id uuid references public.players(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','active','finished','bye')),
  attempt_no integer not null default 1 check (attempt_no >= 1),
  live_game_id uuid references public.live_games(id) on delete set null,
  player_one_ready_at timestamptz,
  player_two_ready_at timestamptz,
  player_one_seat_key_cipher bytea,
  player_two_seat_key_cipher bytea,
  player_one_color text check (player_one_color is null or player_one_color in ('w','b')),
  player_two_color text check (player_two_color is null or player_two_color in ('w','b')),
  created_at timestamptz not null default clock_timestamp(),
  started_at timestamptz,
  finished_at timestamptz,
  unique (tournament_id, round_no, match_no)
);

create index if not exists tournament_matches_tournament_idx
  on private.tournament_matches(tournament_id, round_no, match_no);
create unique index if not exists tournament_matches_live_game_idx
  on private.tournament_matches(live_game_id) where live_game_id is not null;

alter table private.tournament_matches enable row level security;
revoke all on private.tournament_matches from public, anon, authenticated;

-- Allow the administration audit log to record explicit tournament starts.
alter table private.admin_actions drop constraint if exists admin_actions_action_type_check;
alter table private.admin_actions add constraint admin_actions_action_type_check check (
  action_type = any (array[
    'ban','unban','rating_plus_10','rating_minus_10','close_report','gender_change',
    'player_create','player_update','player_delete','player_ban','player_unban','rating_change',
    'moderator_create','moderator_update','moderator_remove',
    'tournament_create','tournament_update','tournament_cancel','tournament_start'
  ]::text[])
);

create or replace function private.advance_tournament_match(
  p_match_id uuid,
  p_winner_player_id uuid
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match private.tournament_matches%rowtype;
  v_parent private.tournament_matches%rowtype;
  v_parent_match_no integer;
begin
  select * into v_match
  from private.tournament_matches tm
  where tm.id = p_match_id
  for update;

  if v_match.id is null then
    raise exception 'tournament match not found';
  end if;
  if p_winner_player_id is null or p_winner_player_id not in (v_match.player_one_id, v_match.player_two_id) then
    if not (v_match.player_two_id is null and p_winner_player_id = v_match.player_one_id) then
      raise exception 'invalid tournament winner';
    end if;
  end if;

  v_parent_match_no := ((v_match.match_no + 1) / 2)::integer;

  select * into v_parent
  from private.tournament_matches tm
  where tm.tournament_id = v_match.tournament_id
    and tm.round_no = v_match.round_no + 1
    and tm.match_no = v_parent_match_no
  for update;

  if v_parent.id is null then
    update public.tournaments
       set status = 'finished',
           registration_closes_at = coalesce(registration_closes_at, clock_timestamp())
     where id = v_match.tournament_id;
    return true;
  end if;

  if mod(v_match.match_no, 2) = 1 then
    update private.tournament_matches
       set player_one_id = p_winner_player_id
     where id = v_parent.id;
  else
    update private.tournament_matches
       set player_two_id = p_winner_player_id
     where id = v_parent.id;
  end if;

  update private.tournament_matches
     set status = case when player_one_id is not null and player_two_id is not null then 'pending' else status end
   where id = v_parent.id;

  return true;
end;
$$;

create or replace function private.create_tournament_live_game(
  p_match_id uuid
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match private.tournament_matches%rowtype;
  v_tournament public.tournaments%rowtype;
  v_one_name text;
  v_two_name text;
  v_one_status text;
  v_two_status text;
  v_one_key text;
  v_two_key text;
  v_one_color text;
  v_two_color text;
  v_white_key text;
  v_black_key text;
  v_white_name text;
  v_black_name text;
  v_white_player uuid;
  v_black_player uuid;
  v_code text;
  v_game_id uuid;
  v_secret text;
  v_minutes integer;
  v_ms bigint;
begin
  select * into v_match
  from private.tournament_matches tm
  where tm.id = p_match_id
  for update;

  if v_match.id is null then raise exception 'tournament match not found'; end if;
  if v_match.live_game_id is not null then return v_match.live_game_id; end if;
  if v_match.status <> 'pending' then raise exception 'tournament match not ready'; end if;
  if v_match.player_one_id is null or v_match.player_two_id is null then raise exception 'tournament opponent missing'; end if;
  if v_match.player_one_ready_at is null or v_match.player_two_ready_at is null then return null; end if;

  select * into v_tournament from public.tournaments t where t.id=v_match.tournament_id;
  if v_tournament.id is null or v_tournament.status <> 'running' then raise exception 'tournament not running'; end if;

  select p.name,p.status into v_one_name,v_one_status from public.players p where p.id=v_match.player_one_id;
  select p.name,p.status into v_two_name,v_two_status from public.players p where p.id=v_match.player_two_id;
  if v_one_status <> 'active' or v_two_status <> 'active' then raise exception 'player unavailable'; end if;

  if exists(
    select 1
    from private.live_game_players lgp
    join public.live_games lg on lg.id=lgp.game_id
    where lg.status='active'
      and (lgp.white_player_id in (v_match.player_one_id,v_match.player_two_id)
        or lgp.black_player_id in (v_match.player_one_id,v_match.player_two_id))
  ) then
    return null;
  end if;

  select s.value into v_secret
  from private.app_secrets s
  where s.key='matchmaking_seat_secret';
  if v_secret is null then raise exception 'seat secret missing'; end if;

  v_one_key := encode(extensions.gen_random_bytes(24),'hex');
  v_two_key := encode(extensions.gen_random_bytes(24),'hex');
  v_code := private.matchmaking_code();

  begin
    v_minutes := v_tournament.time_control::integer;
  exception when others then
    v_minutes := 10;
  end;
  if v_minutes not in (3,5,10,15) then v_minutes := 10; end if;
  v_ms := v_minutes::bigint * 60000;

  if (get_byte(extensions.gen_random_bytes(1),0) % 2)=0 then
    v_one_color:='w'; v_two_color:='b';
    v_white_key:=v_one_key; v_black_key:=v_two_key;
    v_white_name:=v_one_name; v_black_name:=v_two_name;
    v_white_player:=v_match.player_one_id; v_black_player:=v_match.player_two_id;
  else
    v_one_color:='b'; v_two_color:='w';
    v_white_key:=v_two_key; v_black_key:=v_one_key;
    v_white_name:=v_two_name; v_black_name:=v_one_name;
    v_white_player:=v_match.player_two_id; v_black_player:=v_match.player_one_id;
  end if;

  insert into public.live_games(
    code,white_name,black_name,white_key_hash,black_key_hash,
    status,result,white_time_ms,black_time_ms,turn_started_at,draw_offer_by,
    time_control_minutes,created_at,updated_at
  ) values(
    v_code,v_white_name,v_black_name,
    encode(extensions.digest(v_white_key,'sha256'),'hex'),
    encode(extensions.digest(v_black_key,'sha256'),'hex'),
    'active',null,v_ms,v_ms,clock_timestamp(),null,
    v_minutes,clock_timestamp(),clock_timestamp()
  ) returning id into v_game_id;

  insert into private.live_game_players(game_id,white_player_id,black_player_id,rating_step)
  values(v_game_id,v_white_player,v_black_player,1);

  update private.tournament_matches
     set live_game_id=v_game_id,
         status='active',
         player_one_seat_key_cipher=extensions.pgp_sym_encrypt(v_one_key,v_secret,'cipher-algo=aes256'),
         player_two_seat_key_cipher=extensions.pgp_sym_encrypt(v_two_key,v_secret,'cipher-algo=aes256'),
         player_one_color=v_one_color,
         player_two_color=v_two_color,
         started_at=clock_timestamp()
   where id=v_match.id;

  return v_game_id;
end;
$$;

create or replace function private.start_tournament_core(
  p_tournament_id uuid,
  p_force boolean default false
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tournament public.tournaments%rowtype;
  v_players uuid[];
  v_count integer;
  v_bracket_size integer := 1;
  v_rounds integer := 0;
  v_tmp integer;
  v_round integer;
  v_match_count integer;
  v_match_no integer;
  v_byes integer;
  v_player_index integer := 1;
  v_match_id uuid;
  v_player uuid;
begin
  select * into v_tournament
  from public.tournaments t
  where t.id=p_tournament_id
  for update;

  if v_tournament.id is null then raise exception 'tournament not found'; end if;
  if v_tournament.status <> 'open' then return false; end if;

  select array_agg(x.player_id order by x.sort_key)
    into v_players
  from (
    select tr.player_id, random() as sort_key
    from public.tournament_registrations tr
    join public.players p on p.id=tr.player_id and p.status='active'
    where tr.tournament_id=p_tournament_id and tr.status='registered'
  ) x;

  v_count := coalesce(array_length(v_players,1),0);
  if v_count < 2 then
    if p_force then raise exception 'at least two registered players required'; end if;
    return false;
  end if;
  if not p_force and v_tournament.max_players is not null and v_count < v_tournament.max_players then
    return false;
  end if;

  while v_bracket_size < v_count loop v_bracket_size := v_bracket_size * 2; end loop;
  v_tmp := v_bracket_size;
  while v_tmp > 1 loop v_rounds := v_rounds + 1; v_tmp := v_tmp / 2; end loop;

  delete from private.tournament_matches where tournament_id=p_tournament_id;

  for v_round in 1..v_rounds loop
    v_match_count := v_bracket_size / power(2,v_round)::integer;
    for v_match_no in 1..v_match_count loop
      insert into private.tournament_matches(tournament_id,round_no,match_no,status)
      values(p_tournament_id,v_round,v_match_no,'pending');
    end loop;
  end loop;

  v_byes := v_bracket_size - v_count;
  v_match_count := v_bracket_size / 2;

  for v_match_no in 1..v_match_count loop
    select tm.id into v_match_id
    from private.tournament_matches tm
    where tm.tournament_id=p_tournament_id and tm.round_no=1 and tm.match_no=v_match_no;

    if v_match_no <= v_byes then
      v_player := v_players[v_player_index];
      v_player_index := v_player_index + 1;
      update private.tournament_matches
         set player_one_id=v_player,
             winner_player_id=v_player,
             status='bye',
             finished_at=clock_timestamp()
       where id=v_match_id;
      perform private.advance_tournament_match(v_match_id,v_player);
    else
      update private.tournament_matches
         set player_one_id=v_players[v_player_index],
             player_two_id=v_players[v_player_index+1],
             status='pending'
       where id=v_match_id;
      v_player_index := v_player_index + 2;
    end if;
  end loop;

  update public.tournaments
     set status='running',
         registration_closes_at=coalesce(registration_closes_at,clock_timestamp())
   where id=p_tournament_id;

  return true;
end;
$$;

create or replace function private.process_tournament_live_game()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match private.tournament_matches%rowtype;
  v_players private.live_game_players%rowtype;
  v_winner uuid;
begin
  if new.status <> 'finished' or old.status='finished' or new.result is null then return new; end if;

  select * into v_match
  from private.tournament_matches tm
  where tm.live_game_id=new.id
  for update;
  if v_match.id is null then return new; end if;

  if new.result='1/2-1/2' then
    update private.tournament_matches
       set status='pending',
           live_game_id=null,
           attempt_no=attempt_no+1,
           player_one_ready_at=null,
           player_two_ready_at=null,
           player_one_seat_key_cipher=null,
           player_two_seat_key_cipher=null,
           player_one_color=null,
           player_two_color=null,
           started_at=null
     where id=v_match.id;
    return new;
  end if;

  select * into v_players from private.live_game_players lgp where lgp.game_id=new.id;
  if v_players.game_id is null then return new; end if;

  if new.result='1-0' then v_winner:=v_players.white_player_id;
  elsif new.result='0-1' then v_winner:=v_players.black_player_id;
  else return new;
  end if;

  update private.tournament_matches
     set status='finished',winner_player_id=v_winner,finished_at=clock_timestamp()
   where id=v_match.id;

  perform private.advance_tournament_match(v_match.id,v_winner);
  return new;
end;
$$;

create or replace function private.start_due_tournaments()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_started integer := 0;
begin
  for v_id in
    select t.id
    from public.tournaments t
    where t.status='open'
      and t.starts_at is not null
      and t.starts_at <= clock_timestamp()
    order by t.starts_at
  loop
    begin
      if private.start_tournament_core(v_id,false) then v_started:=v_started+1; end if;
    exception when others then
      null;
    end;
  end loop;
  return v_started;
end;
$$;

create or replace function public.admin_start_tournament(p_tournament_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid;
  v_tournament public.tournaments%rowtype;
  v_ok boolean;
begin
  v_admin:=private.require_operator();
  select * into v_tournament from public.tournaments t where t.id=p_tournament_id;
  if v_tournament.id is null then raise exception 'tournament not found'; end if;

  if v_tournament.scope_type='global' then
    if not exists(
      select 1 from private.admin_users a
      where a.auth_user_id=v_admin and a.is_active and (a.role='owner' or a.scope_type='global')
    ) then raise exception 'outside admin scope'; end if;
  else
    perform private.require_operator_scope(v_tournament.country,v_tournament.city);
  end if;

  v_ok:=private.start_tournament_core(p_tournament_id,true);
  if not v_ok then raise exception 'tournament could not start'; end if;

  insert into private.admin_actions(admin_auth_user_id,tournament_id,action_type,reason,details)
  values(v_admin,p_tournament_id,'tournament_start','بدء البطولة',jsonb_build_object('manual',true));
  return true;
end;
$$;

create or replace function public.get_tournament_bracket(p_tournament_id uuid)
returns table(
  match_id uuid,
  round_no integer,
  match_no integer,
  attempt_no integer,
  player_one_id uuid,
  player_one_name text,
  player_two_id uuid,
  player_two_name text,
  winner_player_id uuid,
  winner_name text,
  match_status text,
  game_id uuid,
  is_my_match boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select tm.id,tm.round_no,tm.match_no,tm.attempt_no,
         tm.player_one_id,p1.name,
         tm.player_two_id,p2.name,
         tm.winner_player_id,pw.name,
         tm.status,tm.live_game_id,
         exists(
           select 1 from public.players me
           where me.auth_user_id=auth.uid()
             and me.id in (tm.player_one_id,tm.player_two_id)
         )
  from private.tournament_matches tm
  left join public.players p1 on p1.id=tm.player_one_id
  left join public.players p2 on p2.id=tm.player_two_id
  left join public.players pw on pw.id=tm.winner_player_id
  where tm.tournament_id=p_tournament_id
  order by tm.round_no,tm.match_no;
$$;

create or replace function public.get_my_tournament_match_access(p_match_id uuid)
returns table(
  state text,
  match_id uuid,
  game_id uuid,
  game_code text,
  seat_key text,
  color text,
  opponent_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid:=private.current_player_id();
  v_match private.tournament_matches%rowtype;
  v_secret text;
  v_cipher bytea;
  v_color text;
  v_opponent uuid;
  v_opponent_name text;
  v_game public.live_games%rowtype;
begin
  select * into v_match
  from private.tournament_matches tm
  where tm.id=p_match_id
  for update;

  if v_match.id is null then raise exception 'tournament match not found'; end if;
  if v_me not in (v_match.player_one_id,v_match.player_two_id) then raise exception 'not a participant'; end if;

  if v_match.status in ('finished','bye') then
    return query select 'finished'::text,v_match.id,v_match.live_game_id,null::text,null::text,null::text,null::text;
    return;
  end if;

  if v_me=v_match.player_one_id then
    update private.tournament_matches set player_one_ready_at=coalesce(player_one_ready_at,clock_timestamp()) where id=v_match.id;
  else
    update private.tournament_matches set player_two_ready_at=coalesce(player_two_ready_at,clock_timestamp()) where id=v_match.id;
  end if;

  select * into v_match from private.tournament_matches tm where tm.id=p_match_id for update;
  if v_match.live_game_id is null and v_match.player_one_ready_at is not null and v_match.player_two_ready_at is not null then
    perform private.create_tournament_live_game(v_match.id);
    select * into v_match from private.tournament_matches tm where tm.id=p_match_id for update;
  end if;

  if v_match.live_game_id is null then
    v_opponent:=case when v_me=v_match.player_one_id then v_match.player_two_id else v_match.player_one_id end;
    select p.name into v_opponent_name from public.players p where p.id=v_opponent;
    return query select 'waiting'::text,v_match.id,null::uuid,null::text,null::text,null::text,v_opponent_name;
    return;
  end if;

  select * into v_game from public.live_games lg where lg.id=v_match.live_game_id;
  select s.value into v_secret from private.app_secrets s where s.key='matchmaking_seat_secret';
  if v_secret is null then raise exception 'seat secret missing'; end if;

  if v_me=v_match.player_one_id then
    v_cipher:=v_match.player_one_seat_key_cipher;
    v_color:=v_match.player_one_color;
    v_opponent:=v_match.player_two_id;
  else
    v_cipher:=v_match.player_two_seat_key_cipher;
    v_color:=v_match.player_two_color;
    v_opponent:=v_match.player_one_id;
  end if;
  select p.name into v_opponent_name from public.players p where p.id=v_opponent;

  return query
  select case when v_game.status='finished' then 'finished'::text else 'active'::text end,
         v_match.id,v_game.id,v_game.code,
         extensions.pgp_sym_decrypt(v_cipher,v_secret),
         v_color,v_opponent_name;
end;
$$;

create or replace function public.get_my_active_tournament_matches()
returns table(
  tournament_id uuid,
  tournament_name text,
  match_id uuid,
  round_no integer,
  match_no integer,
  opponent_player_id uuid,
  opponent_name text,
  match_status text,
  game_id uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid:=private.current_player_id();
begin
  return query
  select t.id,t.name,tm.id,tm.round_no,tm.match_no,
         case when tm.player_one_id=v_me then tm.player_two_id else tm.player_one_id end,
         p.name,tm.status,tm.live_game_id
  from private.tournament_matches tm
  join public.tournaments t on t.id=tm.tournament_id and t.status='running'
  left join public.players p on p.id=case when tm.player_one_id=v_me then tm.player_two_id else tm.player_one_id end
  where v_me in (tm.player_one_id,tm.player_two_id)
    and tm.status in ('pending','active')
  order by t.starts_at nulls last,tm.round_no,tm.match_no;
end;
$$;

revoke all on function private.advance_tournament_match(uuid,uuid) from public;
revoke all on function private.create_tournament_live_game(uuid) from public;
revoke all on function private.start_tournament_core(uuid,boolean) from public;
revoke all on function private.start_due_tournaments() from public;
revoke all on function public.admin_start_tournament(uuid) from public;
revoke all on function public.get_tournament_bracket(uuid) from public;
revoke all on function public.get_my_tournament_match_access(uuid) from public;
revoke all on function public.get_my_active_tournament_matches() from public;

grant execute on function public.admin_start_tournament(uuid) to authenticated;
grant execute on function public.get_tournament_bracket(uuid) to anon,authenticated;
grant execute on function public.get_my_tournament_match_access(uuid) to authenticated;
grant execute on function public.get_my_active_tournament_matches() to authenticated;

drop trigger if exists trg_process_tournament_live_game on public.live_games;
create trigger trg_process_tournament_live_game
after update of status,result on public.live_games
for each row
when (new.status='finished' and old.status is distinct from 'finished')
execute function private.process_tournament_live_game();

-- Run due tournament starts every minute. Existing job is replaced idempotently.
do $$
declare v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname='start-due-tournaments' limit 1;
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
  perform cron.schedule('start-due-tournaments','* * * * *','select private.start_due_tournaments();');
end;
$$;
