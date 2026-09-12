create or replace function public.v3_variant_action_server(p_game_id uuid,p_player_id uuid,p_action text,p_accept boolean default null)
returns public.v3_variant_games
language plpgsql security definer set search_path='' as $$
declare g public.v3_variant_games%rowtype; color text; res text; elapsed_ms bigint; remaining bigint;
begin
  select * into g from public.v3_variant_games where id=p_game_id for update;
  if g.id is null then raise exception 'game_not_found'; end if;
  if g.status<>'active' then return g; end if;
  color:=case when g.white_player_id=p_player_id then 'w' when g.black_player_id=p_player_id then 'b' else null end;
  if color is null then raise exception 'not_participant'; end if;
  if p_action='resign' then
    res:=case when color='w' then '0-1' else '1-0' end;
    update public.v3_variant_games set status='finished',result=res,termination='resign',clock_anchor_at=null,finished_at=clock_timestamp() where id=g.id;
  elsif p_action='offer_draw' then
    update public.v3_variant_games set draw_offered_by=p_player_id where id=g.id;
  elsif p_action='respond_draw' then
    if g.draw_offered_by is null or g.draw_offered_by=p_player_id then raise exception 'no_opponent_draw_offer'; end if;
    if coalesce(p_accept,false) then
      update public.v3_variant_games set status='finished',result='1/2-1/2',termination='agreement',draw_offered_by=null,clock_anchor_at=null,finished_at=clock_timestamp() where id=g.id;
    else update public.v3_variant_games set draw_offered_by=null where id=g.id; end if;
  elsif p_action='timeout' then
    elapsed_ms:=greatest(0,(extract(epoch from (clock_timestamp()-g.clock_anchor_at))*1000)::bigint);
    remaining:=case when g.turn='w' then g.white_ms else g.black_ms end-elapsed_ms;
    if remaining>0 then raise exception 'clock_not_expired'; end if;
    res:=case when g.turn='w' then '0-1' else '1-0' end;
    update public.v3_variant_games set status='finished',result=res,termination='timeout',
      white_ms=case when g.turn='w' then 0 else g.white_ms end,
      black_ms=case when g.turn='b' then 0 else g.black_ms end,
      clock_anchor_at=null,finished_at=clock_timestamp() where id=g.id;
  else raise exception 'unsupported_action'; end if;
  select * into g from public.v3_variant_games where id=p_game_id;
  if g.result is not null then perform private.v3_settle_variant_rating(g.id); select * into g from public.v3_variant_games where id=g.id; end if;
  return g;
end;
$$;
revoke all on function public.v3_variant_action_server(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.v3_variant_action_server(uuid,uuid,text,boolean) to service_role;
