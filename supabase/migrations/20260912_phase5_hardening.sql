-- Phase 5 hardening: keep legacy/quick and custom queues mutually exclusive,
-- and make legacy friend-presence RPCs respect the user's show_online preference.

create or replace function private.v5_clear_custom_queue_on_v2_enqueue()
returns trigger
language plpgsql
security definer
set search_path to 'private','public'
as $$
begin
  delete from private.v5_matchmaking_queue
  where player_id = new.player_id;
  return new;
end;
$$;

revoke all on function private.v5_clear_custom_queue_on_v2_enqueue() from public, anon, authenticated;

drop trigger if exists trg_v5_clear_custom_queue_on_v2_enqueue on private.v2_matchmaking_queue;
create trigger trg_v5_clear_custom_queue_on_v2_enqueue
before insert or update on private.v2_matchmaking_queue
for each row
execute function private.v5_clear_custom_queue_on_v2_enqueue();

create or replace function public.get_my_friends()
returns table(
  friend_id uuid,
  name text,
  city text,
  region text,
  rating integer,
  games_count integer,
  wins integer,
  draws integer,
  losses integer,
  is_online boolean
)
language sql
stable
security definer
set search_path to ''
as $$
  with me as (
    select private.current_player_id() as id
  ),
  ids as (
    select case when f.player_a = me.id then f.player_b else f.player_a end as friend_id
    from private.friendships f
    cross join me
    where f.player_a = me.id or f.player_b = me.id
  )
  select
    p.id,
    p.name,
    p.city,
    p.region,
    p.rating,
    p.games_count,
    p.wins,
    p.draws,
    p.losses,
    (
      coalesce(s.show_online,true)
      and coalesce(pp.last_seen_at >= clock_timestamp() - interval '90 seconds', false)
    ) as is_online
  from ids i
  join public.players p on p.id = i.friend_id
  left join private.player_presence pp on pp.player_id = i.friend_id
  left join public.v5_user_settings s on s.player_id = i.friend_id
  where p.status = 'active'
  order by p.name, p.id;
$$;

create or replace function public.get_my_friends_presence()
returns table(player_id uuid, is_online boolean)
language sql
stable
security definer
set search_path to ''
as $$
  with me as (
    select private.current_player_id() as id
  ),
  ids as (
    select case when f.player_a = me.id then f.player_b else f.player_a end as friend_id
    from private.friendships f
    cross join me
    where f.player_a = me.id or f.player_b = me.id
  )
  select
    i.friend_id,
    (
      coalesce(s.show_online,true)
      and coalesce(pp.last_seen_at >= clock_timestamp() - interval '90 seconds', false)
    ) as is_online
  from ids i
  left join private.player_presence pp on pp.player_id = i.friend_id
  left join public.v5_user_settings s on s.player_id = i.friend_id;
$$;

-- Preserve these RPCs for signed-in users only.
revoke all on function public.get_my_friends() from public, anon;
revoke all on function public.get_my_friends_presence() from public, anon;
grant execute on function public.get_my_friends() to authenticated;
grant execute on function public.get_my_friends_presence() to authenticated;
