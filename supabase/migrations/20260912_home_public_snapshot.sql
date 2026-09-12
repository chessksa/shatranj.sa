create or replace function public.get_public_home_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with registered as (
    select p.id, p.name, p.region, p.city, p.created_at
    from public.players p
    where p.status = 'active'
      and p.auth_user_id is not null
      and coalesce(p.is_synthetic, false) = false
  ),
  latest as (
    select r.name, r.region, r.city, r.created_at
    from registered r
    order by r.created_at desc
    limit 10
  ),
  live_count as (
    select
      (select count(*) from public.v2_games g where g.status = 'active')
      +
      (select count(*) from public.v3_variant_games vg where vg.status = 'active')
      as total
  )
  select jsonb_build_object(
    'registered_count', (select count(*) from registered),
    'active_matches', coalesce((select total from live_count), 0),
    'latest_members', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'name', l.name,
            'region', l.region,
            'city', l.city,
            'created_at', l.created_at
          )
          order by l.created_at desc
        )
        from latest l
      ),
      '[]'::jsonb
    )
  );
$$;

revoke all on function public.get_public_home_snapshot() from public;
grant execute on function public.get_public_home_snapshot() to anon, authenticated;
