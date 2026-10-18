-- Archive completed desktop browser-engine computer games without granting
-- client-reported local results the ability to alter rated player points.
-- Existing public finished-game and spectator RPCs read computer_games.
create or replace function public.archive_local_computer_game(
  p_game_id uuid,
  p_level text,
  p_moves jsonb,
  p_result text,
  p_fen text,
  p_minutes integer,
  p_player_ms bigint,
  p_computer_ms bigint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player_id uuid;
  v_player_rating integer;
  v_existing_owner uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to archive computer games' using errcode = '28000';
  end if;

  select p.id,p.rating into v_player_id,v_player_rating
  from public.players p
  where p.auth_user_id=(select auth.uid()) and p.status='active'
  limit 1;
  if v_player_id is null then
    raise exception 'Active player profile required' using errcode = '28000';
  end if;

  if p_game_id is null or p_level not in ('easy','medium','hard')
     or p_result not in ('win','loss','draw')
     or p_minutes not in (5,10,15)
     or p_player_ms is null or p_player_ms < 0 or p_player_ms > p_minutes*60000
     or p_computer_ms is null or p_computer_ms < 0 or p_computer_ms > p_minutes*60000
  then
    raise exception 'Invalid finished computer game metadata' using errcode = '22023';
  end if;

  if p_fen is null or length(p_fen)>110 or
     p_fen !~ '^[rnbqkpRNBQKP1-8/]{15,80} [wb] (-|[KQkq]+) (-|[a-h][36]) [0-9]+ [0-9]+$'
  then
    raise exception 'Invalid final board position' using errcode = '22023';
  end if;

  if p_moves is null or jsonb_typeof(p_moves)<>'array' or jsonb_array_length(p_moves)>400 then
    raise exception 'Invalid move history' using errcode = '22023';
  end if;

  if exists(
    select 1 from jsonb_array_elements(p_moves) with ordinality as m(item,ply)
    where jsonb_typeof(m.item)<>'object'
       or coalesce(m.item->>'from','') !~ '^[a-h][1-8]$'
       or coalesce(m.item->>'to','') !~ '^[a-h][1-8]$'
       or coalesce(m.item->>'promotion','') not in ('','q','r','b','n')
       or coalesce(m.item->>'side','') <> case when m.ply%2=1 then 'player' else 'computer' end
  ) then
    raise exception 'Invalid move notation' using errcode = '22023';
  end if;

  -- Idempotency lets a temporarily disconnected browser retry the same finish.
  select g.player_id into v_existing_owner
  from public.computer_games g where g.id=p_game_id;
  if v_existing_owner is not null then
    if v_existing_owner<>v_player_id then
      raise exception 'Computer match reference is already used' using errcode='23505';
    end if;
    return p_game_id;
  end if;

  -- Unrated, client-reported matches cannot be used for rating awards.
  -- Bound write amplification even if someone bypasses the UI.
  if (select count(*) from public.computer_games g
      where g.player_id=v_player_id and g.created_at>clock_timestamp()-interval '1 day') >=300
  then
    raise exception 'Too many archived games in the last 24 hours' using errcode='54000';
  end if;

  insert into public.computer_games(
    id,player_id,level,fen,moves,status,result,
    rating_applied,rating_before,rating_delta,rating_after,
    time_control_minutes,player_time_ms,computer_time_ms,finished_at
  ) values (
    p_game_id,v_player_id,p_level,p_fen,p_moves,'finished',p_result,
    true,v_player_rating,0,v_player_rating,
    p_minutes,p_player_ms,p_computer_ms,clock_timestamp()
  ) on conflict (id) do nothing;

  select g.player_id into v_existing_owner
  from public.computer_games g where g.id=p_game_id;
  if v_existing_owner is distinct from v_player_id then
    raise exception 'Computer match reference conflict' using errcode='23505';
  end if;
  return p_game_id;
end;
$$;
revoke all on function public.archive_local_computer_game(uuid,text,jsonb,text,text,integer,bigint,bigint) from public, anon, authenticated;
grant execute on function public.archive_local_computer_game(uuid,text,jsonb,text,text,integer,bigint,bigint) to authenticated;
comment on function public.archive_local_computer_game(uuid,text,jsonb,text,text,integer,bigint,bigint)
is 'Saves completed local computer games for the watch list; never awards rated points for browser-reported outcomes.';
