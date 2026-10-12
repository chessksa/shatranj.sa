-- Public, read-only champion badges on the desktop homepage.
-- Rolling 7/30-day champion: most verified wins, ties broken by current points.
-- Site champion: highest current player points (same ranking used by homepage).
-- Only authentic, active accounts can receive an award.
create or replace function public.get_public_home_champions()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with eligible as (
    select p.id, p.name, p.rating, p.games_count, p.created_at
    from public.players p
    where p.status = 'active'
      and p.auth_user_id is not null
      and coalesce(p.is_synthetic, false) = false
  ),
  wins as (
    select c.player_id as player_id, c.finished_at as played_at
    from public.computer_games c
    where c.status = 'finished'
      and c.result = 'win'
      and c.finished_at is not null
      and c.finished_at >= now() - interval '30 days'
    union all
    select case when g.result = '1-0' then g.white_player_id else g.black_player_id end,
           g.finished_at
    from public.v2_games g
    where g.status = 'finished'
      and g.result in ('1-0', '0-1')
      and g.rated
      and g.finished_at >= now() - interval '30 days'
    union all
    select case when g.result = '1-0' then g.white_player_id else g.black_player_id end,
           g.finished_at
    from public.v3_variant_games g
    where g.status = 'finished'
      and g.result in ('1-0', '0-1')
      and g.rated
      and g.finished_at >= now() - interval '30 days'
    union all
    select case when m.result = '1-0' then m.white_player else m.black_player end,
           m.played_at
    from public.matches m
    where m.result in ('1-0', '0-1')
      and m.rated
      and m.played_at >= now() - interval '30 days'
  ),
  totals as (
    select p.id, p.name, p.rating,
           count(w.played_at) filter (where w.played_at >= now() - interval '7 days')::integer as week_wins,
           count(w.played_at)::integer as month_wins
    from eligible p
    left join wins w on w.player_id = p.id
    group by p.id, p.name, p.rating
  ),
  week_champion as (
    select t.id, t.name, t.rating, t.week_wins as wins
    from totals t
    where t.week_wins > 0
    order by t.week_wins desc, t.rating desc, t.id
    limit 1
  ),
  month_champion as (
    select t.id, t.name, t.rating, t.month_wins as wins
    from totals t
    where t.month_wins > 0
    order by t.month_wins desc, t.rating desc, t.id
    limit 1
  ),
  site_champion as (
    select p.id, p.name, p.rating
    from eligible p
    order by p.rating desc, p.games_count desc, p.created_at asc, p.id
    limit 1
  )
  select jsonb_build_object(
    'week', (select to_jsonb(w) from week_champion w),
    'month', (select to_jsonb(m) from month_champion m),
    'site', (select to_jsonb(s) from site_champion s)
  );
$$;

revoke all on function public.get_public_home_champions() from public;
grant execute on function public.get_public_home_champions() to anon, authenticated;
