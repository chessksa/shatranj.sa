create or replace function private.settle_v2_rating(p_game_id uuid)
returns public.v2_games
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_game public.v2_games%rowtype;
  v_white_before integer;
  v_black_before integer;
  v_white_after integer;
  v_black_after integer;
  v_white_outcome text;
  v_black_outcome text;
begin
  select * into v_game
  from public.v2_games g
  where g.id = p_game_id
  for update;

  if not found then
    raise exception 'game_not_found' using errcode = 'P0002';
  end if;
  if v_game.status <> 'finished' or v_game.result is null then
    return v_game;
  end if;
  if v_game.rating_settled then
    return v_game;
  end if;

  if not v_game.rated then
    update public.v2_games
    set rating_settled = true
    where id = p_game_id
    returning * into v_game;
    return v_game;
  end if;

  select p.rating into v_white_before
  from public.players p
  where p.id = v_game.white_player_id
  for update;

  select p.rating into v_black_before
  from public.players p
  where p.id = v_game.black_player_id
  for update;

  v_white_before := coalesce(v_white_before, 1500);
  v_black_before := coalesce(v_black_before, 1500);

  if v_game.result = '1-0' then
    v_white_after := v_white_before + 10;
    v_black_after := greatest(0, v_black_before - 10);
    v_white_outcome := 'win';
    v_black_outcome := 'loss';
  elsif v_game.result = '0-1' then
    v_white_after := greatest(0, v_white_before - 10);
    v_black_after := v_black_before + 10;
    v_white_outcome := 'loss';
    v_black_outcome := 'win';
  else
    v_white_after := v_white_before;
    v_black_after := v_black_before;
    v_white_outcome := 'draw';
    v_black_outcome := 'draw';
  end if;

  update public.players
  set rating = v_white_after,
      games_count = coalesce(games_count, 0) + 1,
      wins = coalesce(wins, 0) + case when v_white_outcome = 'win' then 1 else 0 end,
      draws = coalesce(draws, 0) + case when v_white_outcome = 'draw' then 1 else 0 end,
      losses = coalesce(losses, 0) + case when v_white_outcome = 'loss' then 1 else 0 end
  where id = v_game.white_player_id;

  update public.players
  set rating = v_black_after,
      games_count = coalesce(games_count, 0) + 1,
      wins = coalesce(wins, 0) + case when v_black_outcome = 'win' then 1 else 0 end,
      draws = coalesce(draws, 0) + case when v_black_outcome = 'draw' then 1 else 0 end,
      losses = coalesce(losses, 0) + case when v_black_outcome = 'loss' then 1 else 0 end
  where id = v_game.black_player_id;

  insert into private.v2_rating_history (
    game_id, player_id, rating_before, rating_after, delta, result
  ) values
    (p_game_id, v_game.white_player_id, v_white_before, v_white_after, v_white_after - v_white_before, v_white_outcome),
    (p_game_id, v_game.black_player_id, v_black_before, v_black_after, v_black_after - v_black_before, v_black_outcome)
  on conflict (game_id, player_id) do nothing;

  update public.v2_games
  set rating_settled = true
  where id = p_game_id
    and rating_settled = false
  returning * into v_game;

  if not found then
    select * into v_game from public.v2_games where id = p_game_id;
  end if;
  return v_game;
end;
$$;

revoke all on function private.settle_v2_rating(uuid) from public, anon, authenticated;

create or replace function private.v2_game_action(
  p_action text,
  p_game_id uuid,
  p_player_id uuid,
  p_accept boolean default null
)
returns public.v2_games
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_game public.v2_games%rowtype;
  v_now timestamptz := clock_timestamp();
  v_result text;
  v_anchor timestamptz;
  v_elapsed_ms bigint;
  v_remaining bigint;
begin
  select * into v_game
  from public.v2_games g
  where g.id = p_game_id
  for update;

  if not found then
    raise exception 'game_not_found' using errcode = 'P0002';
  end if;
  if p_player_id not in (v_game.white_player_id, v_game.black_player_id) then
    raise exception 'game_not_accessible' using errcode = '42501';
  end if;

  if p_action = 'grace_end' then
    if v_game.status = 'cancelled' then
      return v_game;
    end if;
    if v_game.status <> 'matched' or v_game.ply <> 0 then
      raise exception 'grace_not_available' using errcode = '40001';
    end if;
    if v_now > least(v_game.grace_until, v_game.created_at + interval '5 seconds') then
      raise exception 'grace_expired' using errcode = '40001';
    end if;

    update public.v2_games
    set status = 'cancelled',
        termination = 'grace_cancel',
        finished_at = v_now,
        clock_anchor_at = null,
        draw_offered_by = null
    where id = p_game_id
    returning * into v_game;

    delete from private.v2_matchmaking_queue where matched_game_id = p_game_id;
    return v_game;
  end if;

  if p_action = 'offer_draw' then
    if v_game.status not in ('matched', 'active') then
      raise exception 'game_not_active' using errcode = '40001';
    end if;
    if v_game.draw_offered_by is not null and v_game.draw_offered_by <> p_player_id then
      raise exception 'opponent_draw_offer_pending' using errcode = '40001';
    end if;
    update public.v2_games
    set draw_offered_by = p_player_id
    where id = p_game_id
    returning * into v_game;
    return v_game;
  end if;

  if p_action = 'respond_draw' then
    if v_game.status not in ('matched', 'active') then
      raise exception 'game_not_active' using errcode = '40001';
    end if;
    if v_game.draw_offered_by is null or v_game.draw_offered_by = p_player_id then
      raise exception 'no_opponent_draw_offer' using errcode = '40001';
    end if;

    if coalesce(p_accept, false) then
      update public.v2_games
      set status = 'finished',
          result = '1/2-1/2',
          termination = 'draw_agreement',
          finished_at = v_now,
          clock_anchor_at = null,
          draw_offered_by = null
      where id = p_game_id
      returning * into v_game;
      delete from private.v2_matchmaking_queue where matched_game_id = p_game_id;
      return private.settle_v2_rating(p_game_id);
    end if;

    update public.v2_games
    set draw_offered_by = null
    where id = p_game_id
    returning * into v_game;
    return v_game;
  end if;

  if p_action = 'resign' then
    if v_game.status = 'finished' then
      return v_game;
    end if;
    if v_game.status not in ('matched', 'active') then
      raise exception 'game_not_active' using errcode = '40001';
    end if;

    v_result := case when p_player_id = v_game.white_player_id then '0-1' else '1-0' end;
    update public.v2_games
    set status = 'finished',
        result = v_result,
        termination = 'resign',
        finished_at = v_now,
        clock_anchor_at = null,
        draw_offered_by = null
    where id = p_game_id
    returning * into v_game;

    delete from private.v2_matchmaking_queue where matched_game_id = p_game_id;
    return private.settle_v2_rating(p_game_id);
  end if;

  if p_action = 'timeout' then
    if v_game.status = 'finished' then
      return v_game;
    end if;
    if v_game.status not in ('matched', 'active') then
      raise exception 'game_not_active' using errcode = '40001';
    end if;

    if v_game.status = 'matched' then
      if v_now <= v_game.grace_until then
        return v_game;
      end if;
      v_anchor := v_game.grace_until;
    else
      v_anchor := v_game.clock_anchor_at;
    end if;

    if v_anchor is null then
      return v_game;
    end if;

    v_elapsed_ms := greatest(0, floor(extract(epoch from (v_now - v_anchor)) * 1000)::bigint);
    v_remaining := case
      when v_game.turn = 'w' then greatest(0, v_game.white_ms - v_elapsed_ms)
      else greatest(0, v_game.black_ms - v_elapsed_ms)
    end;

    if v_remaining > 0 then
      return v_game;
    end if;

    v_result := case when v_game.turn = 'w' then '0-1' else '1-0' end;
    update public.v2_games
    set status = 'finished',
        result = v_result,
        termination = 'timeout',
        finished_at = v_now,
        clock_anchor_at = null,
        white_ms = case when v_game.turn = 'w' then 0 else v_game.white_ms end,
        black_ms = case when v_game.turn = 'b' then 0 else v_game.black_ms end,
        draw_offered_by = null
    where id = p_game_id
    returning * into v_game;

    delete from private.v2_matchmaking_queue where matched_game_id = p_game_id;
    return private.settle_v2_rating(p_game_id);
  end if;

  raise exception 'unsupported_game_action' using errcode = '22023';
end;
$$;

revoke all on function private.v2_game_action(text, uuid, uuid, boolean) from public, anon, authenticated;

create or replace function public.v2_game_action_server(
  action_value text,
  game_id uuid,
  player_id uuid,
  accept_value boolean default null
)
returns public.v2_games
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if action_value not in ('grace_end', 'resign', 'offer_draw', 'respond_draw', 'timeout') then
    raise exception 'unsupported_game_action' using errcode = '22023';
  end if;
  return private.v2_game_action(action_value, game_id, player_id, accept_value);
end;
$$;

revoke all on function public.v2_game_action_server(text, uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.v2_game_action_server(text, uuid, uuid, boolean) to service_role;

create or replace function public.commit_v2_move_server(
  game_id uuid,
  mover_player_id uuid,
  expected_ply integer,
  from_square text,
  to_square text,
  promotion text,
  san_value text,
  fen_value text,
  next_turn text,
  white_ms_value bigint,
  black_ms_value bigint,
  result_value text,
  termination_value text
)
returns public.v2_games
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_game public.v2_games%rowtype;
begin
  select private.commit_v2_move(
    game_id,
    mover_player_id,
    expected_ply,
    from_square,
    to_square,
    promotion,
    san_value,
    fen_value,
    next_turn,
    white_ms_value,
    black_ms_value,
    result_value,
    termination_value
  ) into v_game;

  if v_game.status = 'finished' then
    delete from private.v2_matchmaking_queue where matched_game_id = game_id;
    v_game := private.settle_v2_rating(game_id);
  end if;
  return v_game;
end;
$$;

revoke all on function public.commit_v2_move_server(uuid, uuid, integer, text, text, text, text, text, text, bigint, bigint, text, text)
from public, anon, authenticated;
grant execute on function public.commit_v2_move_server(uuid, uuid, integer, text, text, text, text, text, text, bigint, bigint, text, text)
to service_role;
