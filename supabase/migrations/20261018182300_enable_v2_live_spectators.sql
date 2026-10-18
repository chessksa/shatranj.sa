-- Read-only public spectator RPC and public V2 match lists.
-- Applied to Supabase production on 2026-10-18.
CREATE OR REPLACE FUNCTION public.get_public_v2_spectator_game_state(p_game_id uuid)
 RETURNS TABLE(game_id uuid, white_name text, black_name text, fen text, moves jsonb, status text, result text, white_time_ms bigint, black_time_ms bigint, turn_started_at timestamp with time zone, time_control_minutes integer, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select g.id,
         coalesce(w.name,'الأبيض')::text,
         coalesce(b.name,'الأسود')::text,
         g.fen,
         coalesce((
           select jsonb_agg(jsonb_build_object(
             'ply',m.ply,'from',m.from_square,'to',m.to_square,'san',m.san
           ) order by m.ply)
           from public.v2_game_moves m where m.game_id=g.id
         ),'[]'::jsonb),
         g.status, g.result, g.white_ms, g.black_ms,
         case when g.status='matched' then g.grace_until else g.clock_anchor_at end,
         (g.base_seconds/60)::integer,
         coalesce(g.finished_at, (select max(m.created_at) from public.v2_game_moves m where m.game_id=g.id),g.started_at,g.created_at)
  from public.v2_games g
  join public.players w on w.id=g.white_player_id
  join public.players b on b.id=g.black_player_id
  where g.id=p_game_id and g.status in ('matched','active','finished');
$function$;
revoke all on function public.get_public_v2_spectator_game_state(uuid) from public,anon,authenticated;
grant execute on function public.get_public_v2_spectator_game_state(uuid) to anon,authenticated;

CREATE OR REPLACE FUNCTION public.list_public_current_games()
 RETURNS TABLE(game_id uuid, game_type text, white_name text, black_name text, white_rating integer, black_rating integer, level text, time_control_minutes integer, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select g.id,'human'::text,g.white_name,g.black_name,
         null::integer,null::integer,null::text,g.time_control_minutes,g.created_at,g.updated_at
  from public.live_games g
  where g.status in ('playing','active','in_progress','started')
  union all
  select v.id,'human_v2'::text,coalesce(w.name,'الأبيض')::text,coalesce(b.name,'الأسود')::text,
         w.rating,b.rating,null::text,(v.base_seconds/60)::integer,v.created_at,
         coalesce((select max(m.created_at) from public.v2_game_moves m where m.game_id=v.id),v.started_at,v.created_at)
  from public.v2_games v
  join public.players w on w.id=v.white_player_id
  join public.players b on b.id=v.black_player_id
  where v.status in ('matched','active')
  union all
  select c.game_id,'computer'::text,c.player_name,'الكمبيوتر'::text,c.player_rating,
         null::integer,c.level,c.time_control_minutes,c.created_at,c.updated_at
  from public.list_public_computer_games() c
  order by created_at desc
  limit 100;
$function$;
revoke all on function public.list_public_current_games() from public,anon,authenticated;
grant execute on function public.list_public_current_games() to anon,authenticated;

CREATE OR REPLACE FUNCTION public.list_public_finished_games()
 RETURNS TABLE(game_id uuid, game_type text, white_name text, black_name text, updated_at timestamp with time zone, total_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with finished as (
    select g.id game_id,'human'::text game_type,coalesce(g.white_name,'الأبيض')::text white_name,
           coalesce(g.black_name,'الأسود')::text black_name,g.updated_at
    from public.live_games g where g.status='finished'
    union all
    select v.id,'human_v2'::text,coalesce(w.name,'الأبيض')::text,coalesce(b.name,'الأسود')::text,
           coalesce(v.finished_at,(select max(m.created_at) from public.v2_game_moves m where m.game_id=v.id),v.created_at)
    from public.v2_games v
    join public.players w on w.id=v.white_player_id
    join public.players b on b.id=v.black_player_id
    where v.status='finished'
    union all
    select g.id,'computer'::text,coalesce(p.name,'لاعب')::text,'الكمبيوتر'::text,g.updated_at
    from public.computer_games g
    left join public.players p on p.id=g.player_id
    where g.status='finished'
  ),counted as (
    select game_id,game_type,white_name,black_name,updated_at,count(*) over() as total_count
    from finished
  )
  select * from counted order by updated_at desc nulls last limit 100;
$function$;
revoke all on function public.list_public_finished_games() from public,anon,authenticated;
grant execute on function public.list_public_finished_games() to anon,authenticated;
