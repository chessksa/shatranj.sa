-- Fix 22P02 on the first live move. The returned v2_games composite must be
-- expanded into the row variable, not assigned as a single scalar column.
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
  select * into v_game
  from private.commit_v2_move(
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
  );
  if v_game.status = 'finished' then
    delete from private.v2_matchmaking_queue where matched_game_id = game_id;
    v_game := private.settle_v2_rating(game_id);
  end if;
  return v_game;
end;
$$;

revoke all on function public.commit_v2_move_server(
  uuid, uuid, integer, text, text, text, text, text, text, bigint, bigint, text, text
) from public, anon, authenticated;
grant execute on function public.commit_v2_move_server(
  uuid, uuid, integer, text, text, text, text, text, text, bigint, bigint, text, text
) to service_role;
