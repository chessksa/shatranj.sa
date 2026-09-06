-- Supabase may add explicit Data API role grants to newly created functions.
-- Keep the public bracket readable, but require authentication for participant/admin RPCs.
revoke execute on function public.admin_start_tournament(uuid) from anon;
revoke execute on function public.get_my_tournament_match_access(uuid) from anon;
revoke execute on function public.get_my_active_tournament_matches() from anon;

grant execute on function public.admin_start_tournament(uuid) to authenticated;
grant execute on function public.get_my_tournament_match_access(uuid) to authenticated;
grant execute on function public.get_my_active_tournament_matches() to authenticated;

grant execute on function public.get_tournament_bracket(uuid) to anon,authenticated;
