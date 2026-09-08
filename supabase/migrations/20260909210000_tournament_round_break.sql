-- Three-minute inter-round break for knockout tournaments.
-- Round 1 opens immediately. Every later round opens only after the whole previous round finishes + 3 minutes.

alter table private.tournament_matches
  add column if not exists ready_opens_at timestamptz;

create or replace function private.set_first_tournament_round_ready_open()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.round_no=1 and new.ready_opens_at is null then
    new.ready_opens_at:=clock_timestamp();
  end if;
  return new;
end;
$$;

revoke all on function private.set_first_tournament_round_ready_open() from public;

drop trigger if exists trg_set_first_tournament_round_ready_open on private.tournament_matches;
create trigger trg_set_first_tournament_round_ready_open
before insert on private.tournament_matches
for each row execute function private.set_first_tournament_round_ready_open();

-- Existing first-round matches are immediately eligible. Existing later rounds are backfilled
-- only when their entire previous round is already complete.
update private.tournament_matches
   set ready_opens_at=coalesce(ready_opens_at,created_at)
 where round_no=1;

with completed_rounds as (
  select tm.tournament_id,
         tm.round_no+1 as target_round,
         max(coalesce(tm.finished_at,tm.created_at)) as completed_at
    from private.tournament_matches tm
   group by tm.tournament_id,tm.round_no
  having bool_and(tm.status in ('finished','bye'))
)
update private.tournament_matches next_match
   set ready_opens_at=coalesce(next_match.ready_opens_at,completed_rounds.completed_at+interval '3 minutes')
  from completed_rounds
 where next_match.tournament_id=completed_rounds.tournament_id
   and next_match.round_no=completed_rounds.target_round
   and next_match.round_no>1;

create or replace function private.schedule_tournament_next_round(
  p_tournament_id uuid,
  p_completed_round integer
) returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_completed_at timestamptz;
  v_ready_at timestamptz;
begin
  if p_completed_round is null or p_completed_round<1 then return null; end if;

  if exists(
    select 1
      from private.tournament_matches tm
     where tm.tournament_id=p_tournament_id
       and tm.round_no=p_completed_round
       and tm.status not in ('finished','bye')
  ) then
    return null;
  end if;

  select max(coalesce(tm.finished_at,tm.created_at))
    into v_completed_at
    from private.tournament_matches tm
   where tm.tournament_id=p_tournament_id
     and tm.round_no=p_completed_round;

  if v_completed_at is null then return null; end if;
  v_ready_at:=v_completed_at+interval '3 minutes';

  update private.tournament_matches tm
     set ready_opens_at=coalesce(tm.ready_opens_at,v_ready_at)
   where tm.tournament_id=p_tournament_id
     and tm.round_no=p_completed_round+1;

  return v_ready_at;
end;
$$;

revoke all on function private.schedule_tournament_next_round(uuid,integer) from public;

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
  where tm.id=p_match_id
  for update;

  if v_match.id is null then raise exception 'tournament match not found'; end if;
  if p_winner_player_id is null or p_winner_player_id not in (v_match.player_one_id,v_match.player_two_id) then
    if not (v_match.player_two_id is null and p_winner_player_id=v_match.player_one_id) then
      raise exception 'invalid tournament winner';
    end if;
  end if;

  -- Serialize advancement for a whole tournament round so simultaneous final matches cannot
  -- both miss the moment when the previous round becomes fully complete.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_match.tournament_id::text||':'||v_match.round_no::text,0)
  );

  v_parent_match_no:=((v_match.match_no+1)/2)::integer;

  select * into v_parent
  from private.tournament_matches tm
  where tm.tournament_id=v_match.tournament_id
    and tm.round_no=v_match.round_no+1
    and tm.match_no=v_parent_match_no
  for update;

  if v_parent.id is null then
    update public.tournaments
       set status='finished',
           registration_closes_at=coalesce(registration_closes_at,clock_timestamp())
     where id=v_match.tournament_id;
    return true;
  end if;

  if mod(v_match.match_no,2)=1 then
    update private.tournament_matches
       set player_one_id=p_winner_player_id
     where id=v_parent.id;
  else
    update private.tournament_matches
       set player_two_id=p_winner_player_id
     where id=v_parent.id;
  end if;

  update private.tournament_matches
     set status=case when player_one_id is not null and player_two_id is not null then 'pending' else status end
   where id=v_parent.id;

  perform private.schedule_tournament_next_round(v_match.tournament_id,v_match.round_no);
  return true;
end;
$$;

revoke all on function private.advance_tournament_match(uuid,uuid) from public;

-- Defense in depth: even an internal caller cannot attach a live game before the round opens.
create or replace function private.enforce_tournament_round_break()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.live_game_id is not null
     and old.live_game_id is null
     and (new.ready_opens_at is null or new.ready_opens_at>clock_timestamp()) then
    raise exception 'tournament round break active';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_tournament_round_break() from public;

drop trigger if exists trg_enforce_tournament_round_break on private.tournament_matches;
create trigger trg_enforce_tournament_round_break
before update of live_game_id on private.tournament_matches
for each row execute function private.enforce_tournament_round_break();

-- Return the round-open timestamp with bracket data so the public page can render the countdown.
drop function if exists public.get_tournament_bracket(uuid);
create function public.get_tournament_bracket(p_tournament_id uuid)
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
  ready_opens_at timestamptz,
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
         tm.status,tm.live_game_id,tm.ready_opens_at,
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

revoke all on function public.get_tournament_bracket(uuid) from public;
grant execute on function public.get_tournament_bracket(uuid) to anon,authenticated;

-- Participant access is blocked during the break, before readiness can be recorded.
drop function if exists public.get_my_tournament_match_access(uuid);
create function public.get_my_tournament_match_access(p_match_id uuid)
returns table(
  state text,
  match_id uuid,
  game_id uuid,
  game_code text,
  seat_key text,
  color text,
  opponent_name text,
  ready_opens_at timestamptz
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
    return query select 'finished'::text,v_match.id,v_match.live_game_id,null::text,null::text,null::text,null::text,v_match.ready_opens_at;
    return;
  end if;

  v_opponent:=case when v_me=v_match.player_one_id then v_match.player_two_id else v_match.player_one_id end;
  select p.name into v_opponent_name from public.players p where p.id=v_opponent;

  if (v_match.round_no>1 and v_match.ready_opens_at is null)
     or v_match.ready_opens_at > clock_timestamp() then
    return query select 'round_break'::text,v_match.id,null::uuid,null::text,null::text,null::text,v_opponent_name,v_match.ready_opens_at;
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
    return query select 'waiting'::text,v_match.id,null::uuid,null::text,null::text,null::text,v_opponent_name,v_match.ready_opens_at;
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
         v_color,v_opponent_name,v_match.ready_opens_at;
end;
$$;

revoke all on function public.get_my_tournament_match_access(uuid) from public,anon;
grant execute on function public.get_my_tournament_match_access(uuid) to authenticated;
