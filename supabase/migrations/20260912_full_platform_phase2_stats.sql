create or replace function public.v2_stats_summary()
returns table(
  rating integer,total_games bigint,wins bigint,draws bigint,losses bigint,
  white_games bigint,white_wins bigint,black_games bigint,black_wins bigint,
  puzzle_rating integer,puzzle_attempts bigint,puzzle_solves bigint,puzzle_streak integer,daily_puzzle_streak integer,
  lessons_completed integer,achievements_unlocked bigint
)
language sql stable security definer set search_path=public,private,auth as $$
with me as (select private.v2_current_player_id() id),
g as (
 select vg.* from public.v2_games vg,me where vg.status='finished' and me.id in(vg.white_player_id,vg.black_player_id)
), ps as (
 select s.* from public.v2_player_stats s,me where s.player_id=me.id
), pa as (
 select count(*) attempts,count(*) filter(where a.success) solves from public.v2_puzzle_attempts a,me where a.player_id=me.id
), ach as (
 select count(*) unlocked from public.v2_user_achievements ua,me where ua.player_id=me.id
)
select p.rating,
 count(g.id),
 count(g.id) filter(where (g.white_player_id=me.id and g.result='1-0') or (g.black_player_id=me.id and g.result='0-1')),
 count(g.id) filter(where g.result='1/2-1/2'),
 count(g.id) filter(where (g.white_player_id=me.id and g.result='0-1') or (g.black_player_id=me.id and g.result='1-0')),
 count(g.id) filter(where g.white_player_id=me.id),
 count(g.id) filter(where g.white_player_id=me.id and g.result='1-0'),
 count(g.id) filter(where g.black_player_id=me.id),
 count(g.id) filter(where g.black_player_id=me.id and g.result='0-1'),
 coalesce(max(ps.puzzle_rating),1200),coalesce(max(pa.attempts),0),coalesce(max(pa.solves),0),coalesce(max(ps.puzzle_streak),0),coalesce(max(ps.daily_puzzle_streak),0),
 coalesce(max(ps.lessons_completed),0),coalesce(max(ach.unlocked),0)
from me join public.players p on p.id=me.id left join g on true left join ps on true left join pa on true left join ach on true group by p.rating;
$$;

create or replace function public.v2_stats_time_controls()
returns table(base_seconds integer,increment_seconds integer,games bigint,wins bigint,draws bigint,losses bigint)
language sql stable security definer set search_path=public,private,auth as $$
 with me as (select private.v2_current_player_id() id)
 select g.base_seconds,g.increment_seconds,count(*),
 count(*) filter(where (g.white_player_id=me.id and g.result='1-0') or (g.black_player_id=me.id and g.result='0-1')),
 count(*) filter(where g.result='1/2-1/2'),
 count(*) filter(where (g.white_player_id=me.id and g.result='0-1') or (g.black_player_id=me.id and g.result='1-0'))
 from public.v2_games g,me where g.status='finished' and me.id in(g.white_player_id,g.black_player_id)
 group by g.base_seconds,g.increment_seconds order by g.base_seconds,g.increment_seconds;
$$;

create or replace function public.v2_stats_rating_history(p_limit integer default 100)
returns table(created_at timestamptz,rating_after integer,delta integer,result text)
language sql stable security definer set search_path=public,private,auth as $$
 select h.created_at,h.rating_after,h.delta,h.result from private.v2_rating_history h where h.player_id=private.v2_current_player_id() order by h.created_at asc limit greatest(1,least(coalesce(p_limit,100),500));
$$;

create or replace function public.v2_list_achievements()
returns table(id text,title text,description text,icon text,unlocked boolean,unlocked_at timestamptz)
language sql stable security definer set search_path=public,private,auth as $$
 select a.id,a.title,a.description,a.icon,(ua.player_id is not null),ua.unlocked_at
 from public.v2_achievements a left join public.v2_user_achievements ua on ua.achievement_id=a.id and ua.player_id=private.v2_current_player_id()
 order by a.sort_order,a.id;
$$;

revoke all on function public.v2_stats_summary() from public,anon;
revoke all on function public.v2_stats_time_controls() from public,anon;
revoke all on function public.v2_stats_rating_history(integer) from public,anon;
revoke all on function public.v2_list_achievements() from public,anon;
grant execute on function public.v2_stats_summary() to authenticated;
grant execute on function public.v2_stats_time_controls() to authenticated;
grant execute on function public.v2_stats_rating_history(integer) to authenticated;
grant execute on function public.v2_list_achievements() to authenticated;
