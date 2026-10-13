-- Include actual player rating as homepage play points in personal statistics.
-- Authenticated player's actual recorded achievements for the desktop homepage.
-- Counts historic player counters separately from completed game records; excludes active/unsettled games.
create or replace function public.get_my_home_statistics()
returns jsonb
language sql stable security definer
set search_path = ''
as $function$
with viewer as (
  select p.id, greatest(coalesce(p.rating, 1500), 0) as points, greatest(coalesce(p.games_count, 0), 0) as historic_games,
         greatest(coalesce(p.wins, 0), 0) as historic_wins
  from public.players p
  where p.auth_user_id = auth.uid() and p.status = 'active'
  limit 1
), finished as (
  select g.base_seconds + (40 * g.increment_seconds) as duration_seconds,
         case
           when (g.result = '1-0' and g.white_player_id = v.id)
             or (g.result = '0-1' and g.black_player_id = v.id) then 'win'
           when g.result = '1/2-1/2' then 'draw'
           else 'loss'
         end as verdict
  from public.v2_games g cross join viewer v
  where g.status = 'finished' and (g.white_player_id = v.id or g.black_player_id = v.id)
  union all
  select c.time_control_minutes * 60,
         case when c.result = 'win' then 'win'
              when c.result = 'draw' then 'draw' else 'loss' end
  from public.computer_games c join viewer v on c.player_id = v.id
  where c.status = 'finished'
  union all
  select g.base_seconds + (40 * g.increment_seconds),
         case
           when (g.result = '1-0' and g.white_player_id = v.id)
             or (g.result = '0-1' and g.black_player_id = v.id) then 'win'
           when g.result = '1/2-1/2' then 'draw'
           else 'loss'
         end
  from public.v3_variant_games g cross join viewer v
  where g.status = 'finished' and (g.white_player_id = v.id or g.black_player_id = v.id)
  union all
  select null::integer,
         case
           when (m.result = '1-0' and m.white_player = v.id)
             or (m.result = '0-1' and m.black_player = v.id) then 'win'
           when m.result = '1/2-1/2' then 'draw'
           else 'loss'
         end
  from public.matches m cross join viewer v
  where m.white_player = v.id or m.black_player = v.id
), game_totals as (
  select count(*)::integer as games,
         count(*) filter (where verdict = 'win')::integer as wins,
         count(*) filter (where duration_seconds >= 600)::integer as rapid,
         count(*) filter (where duration_seconds >= 180 and duration_seconds < 600)::integer as blitz,
         count(*) filter (where duration_seconds < 180)::integer as bullet
  from finished
)
select jsonb_build_object(
  'games', v.historic_games + g.games,
  'points', v.points,
  'wins', v.historic_wins + g.wins,
  'rapid', g.rapid,
  'blitz', g.blitz,
  'bullet', g.bullet,
  'puzzles', (select count(distinct a.puzzle_id)::integer from public.v2_puzzle_attempts a where a.player_id = v.id and a.success),
  'lessons', (select count(distinct lp.lesson_id)::integer from public.v2_lesson_progress lp where lp.player_id = v.id and lp.completed),
  'achievements', (select count(*)::integer from public.v2_user_achievements ua where ua.player_id = v.id)
) from viewer v cross join game_totals g;
$function$;

revoke all on function public.get_my_home_statistics() from public, anon;
grant execute on function public.get_my_home_statistics() to authenticated;