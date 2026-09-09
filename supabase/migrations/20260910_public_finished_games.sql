-- Public, read-only finished-match list for the watch page.
-- Exposes only identifiers, display names, game type, and update time.

create or replace function public.list_public_finished_games()
returns table(
  game_id uuid,
  game_type text,
  white_name text,
  black_name text,
  updated_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with finished as (
    select
      g.id as game_id,
      'human'::text as game_type,
      coalesce(g.white_name, 'الأبيض')::text as white_name,
      coalesce(g.black_name, 'الأسود')::text as black_name,
      g.updated_at
    from public.live_games g
    where g.status = 'finished'

    union all

    select
      g.id as game_id,
      'computer'::text as game_type,
      coalesce(p.name, 'لاعب')::text as white_name,
      'الكمبيوتر'::text as black_name,
      g.updated_at
    from public.computer_games g
    left join public.players p on p.id = g.player_id
    where g.status = 'finished'
  ), counted as (
    select
      game_id,
      game_type,
      white_name,
      black_name,
      updated_at,
      count(*) over() as total_count
    from finished
  )
  select *
  from counted
  order by updated_at desc nulls last
  limit 100;
$$;

revoke all on function public.list_public_finished_games() from public;
revoke all on function public.list_public_finished_games() from anon;
revoke all on function public.list_public_finished_games() from authenticated;
grant execute on function public.list_public_finished_games() to anon, authenticated;
