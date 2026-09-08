-- Read-only computer-game monitoring for active owners and moderators.
-- The moderator scope is inherited from the existing admin scope rules.

create or replace function private.can_view_computer_game(p_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.players p
    where p.id = p_player_id
      and private.admin_scope_allows(p.country, p.city)
  );
$$;

alter table public.computer_games enable row level security;

revoke all on table public.computer_games from anon;
revoke insert, update, delete on table public.computer_games from authenticated;
grant select on table public.computer_games to authenticated;

drop policy if exists computer_games_admin_read on public.computer_games;
create policy computer_games_admin_read
on public.computer_games
for select
to authenticated
using ((select private.can_view_computer_game(player_id)));
