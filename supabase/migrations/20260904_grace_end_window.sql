-- Five-second no-rating grace period after matchmaking creates a live game.

create or replace function public.get_live_game_grace_state(p_game_id uuid)
returns table(
  server_now timestamptz,
  grace_expires_at timestamptz,
  remaining_ms bigint,
  can_end boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_player_id uuid;
  g public.live_games%rowtype;
  m private.live_game_players%rowtype;
  v_now timestamptz := clock_timestamp();
  v_expires timestamptz;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  select p.id into v_player_id
  from public.players p
  where p.auth_user_id=v_uid
    and p.status='active'
  limit 1;

  if v_player_id is null then
    raise exception 'player profile required';
  end if;

  select * into g
  from public.live_games lg
  where lg.id=p_game_id;

  if g.id is null then
    raise exception 'game not found';
  end if;

  select * into m
  from private.live_game_players lgp
  where lgp.game_id=p_game_id;

  if m.game_id is null
     or (v_player_id<>m.white_player_id and v_player_id<>m.black_player_id) then
    raise exception 'not a participant';
  end if;

  v_expires := g.created_at + interval '5 seconds';

  return query
  select
    v_now,
    v_expires,
    greatest(0, floor(extract(epoch from (v_expires-v_now))*1000)::bigint),
    (g.status='active' and v_now < v_expires);
end;
$$;

create or replace function public.cancel_live_game_grace(p_game_id uuid, p_seat_key text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_player_id uuid;
  v_hash text;
  v_now timestamptz := clock_timestamp();
  g public.live_games%rowtype;
  m private.live_game_players%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  select p.id into v_player_id
  from public.players p
  where p.auth_user_id=v_uid
    and p.status='active'
  limit 1;

  if v_player_id is null then
    raise exception 'player profile required';
  end if;

  select * into g
  from public.live_games lg
  where lg.id=p_game_id
  for update;

  if g.id is null then
    raise exception 'game not found';
  end if;

  select * into m
  from private.live_game_players lgp
  where lgp.game_id=p_game_id;

  if m.game_id is null then
    raise exception 'game participants not found';
  end if;

  v_hash := encode(extensions.digest(p_seat_key,'sha256'),'hex');
  if not (
    (v_hash=g.white_key_hash and v_player_id=m.white_player_id)
    or
    (v_hash=g.black_key_hash and v_player_id=m.black_player_id)
  ) then
    raise exception 'invalid seat';
  end if;

  if g.status<>'active' then
    return false;
  end if;

  if v_now >= g.created_at + interval '5 seconds' then
    return false;
  end if;

  update public.live_games
     set status='cancelled',
         result=null,
         turn_started_at=null,
         draw_offer_by=null,
         updated_at=v_now
   where id=p_game_id;

  update private.matchmaking_queue
     set status='cancelled',
         matched_game_id=null,
         seat_key_cipher=null,
         color=null,
         last_seen_at=v_now,
         updated_at=v_now
   where matched_game_id=p_game_id
     and player_id in (m.white_player_id,m.black_player_id);

  return true;
end;
$$;

revoke all on function public.get_live_game_grace_state(uuid) from public, anon;
revoke all on function public.cancel_live_game_grace(uuid,text) from public, anon;
grant execute on function public.get_live_game_grace_state(uuid) to authenticated;
grant execute on function public.cancel_live_game_grace(uuid,text) to authenticated;
