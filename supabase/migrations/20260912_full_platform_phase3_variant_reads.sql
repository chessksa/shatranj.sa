create or replace function public.v3_get_variant_game(p_game_id uuid)
returns table(
  game_id uuid,variant text,start_index integer,fen text,turn text,ply integer,
  white_player_id uuid,white_name text,black_player_id uuid,black_name text,my_color text,
  base_seconds integer,increment_seconds integer,white_ms bigint,black_ms bigint,clock_anchor_at timestamptz,
  draw_offered_by uuid,status text,result text,termination text,rated boolean,created_at timestamptz
)
language plpgsql stable security definer set search_path='' as $$
declare pid uuid;
begin
  pid:=public.v2_my_player_id();if pid is null then raise exception 'authentication_required';end if;
  if not exists(select 1 from public.v3_variant_games g where g.id=p_game_id and pid in(g.white_player_id,g.black_player_id)) then raise exception 'game_not_accessible';end if;
  return query select g.id,g.variant,g.start_index,g.fen,g.turn,g.ply,g.white_player_id,wp.name,g.black_player_id,bp.name,
    case when g.white_player_id=pid then 'w' else 'b' end,g.base_seconds,g.increment_seconds,g.white_ms,g.black_ms,g.clock_anchor_at,
    g.draw_offered_by,g.status,g.result,g.termination,g.rated,g.created_at
  from public.v3_variant_games g join public.players wp on wp.id=g.white_player_id join public.players bp on bp.id=g.black_player_id where g.id=p_game_id;
end;$$;
revoke all on function public.v3_get_variant_game(uuid) from public,anon;
grant execute on function public.v3_get_variant_game(uuid) to authenticated;

create or replace function public.v3_list_my_variant_games(p_limit integer default 30)
returns table(game_id uuid,variant text,start_index integer,white_player_id uuid,white_name text,black_player_id uuid,black_name text,my_color text,status text,result text,turn text,ply integer,created_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
declare pid uuid;
begin
 pid:=public.v2_my_player_id();if pid is null then raise exception 'authentication_required';end if;
 return query select g.id,g.variant,g.start_index,g.white_player_id,wp.name,g.black_player_id,bp.name,case when g.white_player_id=pid then 'w' else 'b' end,g.status,g.result,g.turn,g.ply,g.created_at
 from public.v3_variant_games g join public.players wp on wp.id=g.white_player_id join public.players bp on bp.id=g.black_player_id where pid in(g.white_player_id,g.black_player_id) order by g.created_at desc limit greatest(1,least(coalesce(p_limit,30),100));
end;$$;
revoke all on function public.v3_list_my_variant_games(integer) from public,anon;
grant execute on function public.v3_list_my_variant_games(integer) to authenticated;
