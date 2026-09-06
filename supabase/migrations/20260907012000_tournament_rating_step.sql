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
  values(v_game_id,v_white_player,v_black_player,10);

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
