-- Phase 6 security follow-up after classifying anonymous advisor findings.
-- Public spectator and puzzle-session endpoints remain unchanged by design.

-- Trigger helper: the auth.users trigger executes this internally; clients never need RPC access.
revoke execute on function public.reserve_username_on_auth_signup() from public, anon, authenticated;

-- Participant state requires auth.uid() and membership; expose only to signed-in clients.
revoke execute on function public.get_live_game_state(uuid) from public, anon;
grant execute on function public.get_live_game_state(uuid) to authenticated;
