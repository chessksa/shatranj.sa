create or replace function public.get_tournament_registration_counts()
returns table(tournament_id uuid, registered_count bigint)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select t.id as tournament_id,
         count(tr.player_id)::bigint as registered_count
  from public.tournaments t
  left join public.tournament_registrations tr
    on tr.tournament_id = t.id
   and tr.status = 'registered'
  where t.status in ('open','running','finished')
  group by t.id;
$$;

revoke all on function public.get_tournament_registration_counts() from public;
revoke all on function public.get_tournament_registration_counts() from anon;
revoke all on function public.get_tournament_registration_counts() from authenticated;
grant execute on function public.get_tournament_registration_counts() to anon, authenticated;
