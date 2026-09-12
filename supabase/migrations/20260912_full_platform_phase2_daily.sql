create or replace function public.v2_create_daily_game(p_target_player_id uuid,p_days_per_move integer default 1,p_rated boolean default true)
returns uuid language plpgsql security definer set search_path=public,private,auth as $$
declare v_me uuid;v_id uuid;v_white uuid;v_black uuid;
begin
 v_me:=private.v2_current_player_id();
 if v_me is null or p_target_player_id is null or v_me=p_target_player_id then raise exception 'invalid_target' using errcode='22023'; end if;
 if p_days_per_move not between 1 and 14 then raise exception 'invalid_days_per_move' using errcode='22023'; end if;
 if not exists(select 1 from public.players where id=p_target_player_id and coalesce(is_synthetic,false)=false and coalesce(status,'') not in('banned','suspended','inactive')) then raise exception 'player_not_found' using errcode='P0002'; end if;
 if exists(select 1 from public.v2_blocks where (blocker_id=v_me and blocked_id=p_target_player_id) or (blocker_id=p_target_player_id and blocked_id=v_me)) then raise exception 'blocked' using errcode='42501'; end if;
 if random()<0.5 then v_white:=v_me;v_black:=p_target_player_id;else v_white:=p_target_player_id;v_black:=v_me;end if;
 insert into public.v2_correspondence_games(white_player_id,black_player_id,rated,variant,days_per_move,move_due_at)
 values(v_white,v_black,p_rated,'standard',p_days_per_move,clock_timestamp()+make_interval(days=>p_days_per_move)) returning id into v_id;
 insert into public.v2_notifications(player_id,kind,title,body,href) values(p_target_player_id,'challenge','مباراة يومية جديدة','بدأت مباراة Daily جديدة.','daily.html?game='||v_id::text);
 return v_id;
end $$;

create or replace function public.v2_list_daily_games()
returns table(game_id uuid,white_player_id uuid,white_name text,black_player_id uuid,black_name text,rated boolean,variant text,days_per_move integer,fen text,turn text,ply integer,status text,result text,move_due_at timestamptz,my_color text,updated_at timestamptz)
language sql stable security definer set search_path=public,private,auth as $$
 with me as(select private.v2_current_player_id() id)
 select g.id,g.white_player_id,w.name,g.black_player_id,b.name,g.rated,g.variant,g.days_per_move,g.fen,g.turn,g.ply,g.status,g.result,g.move_due_at,case when g.white_player_id=me.id then 'w' else 'b' end,g.updated_at
 from public.v2_correspondence_games g join me on me.id in(g.white_player_id,g.black_player_id) join public.players w on w.id=g.white_player_id join public.players b on b.id=g.black_player_id
 order by case when g.status='active' then 0 else 1 end,g.updated_at desc limit 100;
$$;

create or replace function public.v2_get_daily_game(p_game_id uuid)
returns table(game_id uuid,white_player_id uuid,white_name text,black_player_id uuid,black_name text,rated boolean,variant text,days_per_move integer,fen text,turn text,ply integer,status text,result text,move_due_at timestamptz,my_color text,updated_at timestamptz)
language sql stable security definer set search_path=public,private,auth as $$
 with me as(select private.v2_current_player_id() id)
 select g.id,g.white_player_id,w.name,g.black_player_id,b.name,g.rated,g.variant,g.days_per_move,g.fen,g.turn,g.ply,g.status,g.result,g.move_due_at,case when g.white_player_id=me.id then 'w' else 'b' end,g.updated_at
 from public.v2_correspondence_games g join me on me.id in(g.white_player_id,g.black_player_id) join public.players w on w.id=g.white_player_id join public.players b on b.id=g.black_player_id where g.id=p_game_id;
$$;

create or replace function public.v2_daily_commit_server(game_id uuid,mover_player_id uuid,expected_ply integer,from_square text,to_square text,promotion text,san_value text,fen_value text,next_turn text,result_value text,termination_value text)
returns public.v2_correspondence_games language plpgsql security definer set search_path=public,private as $$
declare g public.v2_correspondence_games%rowtype; mover_color text; outrow public.v2_correspondence_games%rowtype;
begin
 select * into g from public.v2_correspondence_games where id=game_id for update;
 if not found then raise exception 'game_not_found';end if;
 if g.status<>'active' then raise exception 'game_not_active';end if;
 if g.ply<>expected_ply then raise exception 'stale_game_version';end if;
 mover_color:=case when g.white_player_id=mover_player_id then 'w' when g.black_player_id=mover_player_id then 'b' else null end;
 if mover_color is null then raise exception 'not_participant';end if;
 if g.turn<>mover_color then raise exception 'wrong_turn';end if;
 if g.move_due_at<clock_timestamp() then raise exception 'move_deadline_expired';end if;
 insert into public.v2_correspondence_moves(game_id,ply,from_square,to_square,promotion,san,fen_after,mover_player_id) values(game_id,g.ply+1,from_square,to_square,promotion,san_value,fen_value,mover_player_id);
 update public.v2_correspondence_games set fen=fen_value,turn=next_turn,ply=g.ply+1,status=case when result_value is null then 'active' else 'finished' end,result=result_value,move_due_at=clock_timestamp()+make_interval(days=>g.days_per_move),updated_at=clock_timestamp(),finished_at=case when result_value is null then null else clock_timestamp() end where id=game_id returning * into outrow;
 return outrow;
end $$;

create or replace function public.v2_daily_action_server(action_value text,game_id uuid,player_id uuid)
returns public.v2_correspondence_games language plpgsql security definer set search_path=public,private as $$
declare g public.v2_correspondence_games%rowtype;outrow public.v2_correspondence_games%rowtype;winner text;
begin
 select * into g from public.v2_correspondence_games where id=game_id for update;
 if not found then raise exception 'game_not_found';end if;if g.status<>'active' then raise exception 'game_not_active';end if;
 if player_id not in(g.white_player_id,g.black_player_id) then raise exception 'not_participant';end if;
 if action_value='resign' then winner:=case when player_id=g.white_player_id then '0-1' else '1-0' end;
 elsif action_value='timeout' then if g.move_due_at>=clock_timestamp() then raise exception 'deadline_not_expired';end if;winner:=case when g.turn='w' then '0-1' else '1-0' end;
 else raise exception 'unsupported_action';end if;
 update public.v2_correspondence_games set status='finished',result=winner,updated_at=clock_timestamp(),finished_at=clock_timestamp() where id=game_id returning * into outrow;
 return outrow;
end $$;

revoke all on function public.v2_create_daily_game(uuid,integer,boolean) from public,anon;
revoke all on function public.v2_list_daily_games() from public,anon;
revoke all on function public.v2_get_daily_game(uuid) from public,anon;
revoke all on function public.v2_daily_commit_server(uuid,uuid,integer,text,text,text,text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.v2_daily_action_server(text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.v2_create_daily_game(uuid,integer,boolean) to authenticated;
grant execute on function public.v2_list_daily_games() to authenticated;
grant execute on function public.v2_get_daily_game(uuid) to authenticated;
grant execute on function public.v2_daily_commit_server(uuid,uuid,integer,text,text,text,text,text,text,text,text) to service_role;
grant execute on function public.v2_daily_action_server(text,uuid,uuid) to service_role;
