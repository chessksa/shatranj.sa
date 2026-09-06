drop function if exists public.register_for_tournament(uuid);

create or replace function public.register_for_tournament(p_tournament_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_player public.players%rowtype;
  v_tournament public.tournaments%rowtype;
  v_player_country text;
  v_registered_count integer;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'code', 'not_authenticated');
  end if;

  select * into v_player
  from public.players
  where auth_user_id = v_user_id and status = 'active'
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'player_not_found');
  end if;

  select * into v_tournament
  from public.tournaments
  where id = p_tournament_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'tournament_not_found');
  end if;

  if v_tournament.status <> 'open' then
    return jsonb_build_object('ok', false, 'code', 'registration_closed');
  end if;

  if v_tournament.registration_opens_at is not null and clock_timestamp() < v_tournament.registration_opens_at then
    return jsonb_build_object('ok', false, 'code', 'registration_closed');
  end if;

  if v_tournament.registration_closes_at is not null and clock_timestamp() >= v_tournament.registration_closes_at then
    return jsonb_build_object('ok', false, 'code', 'registration_closed');
  end if;

  v_player_country := coalesce(nullif(btrim(v_player.country), ''), nullif(btrim(v_player.region), ''));

  if v_tournament.scope_type = 'country' then
    if v_player_country is distinct from v_tournament.country then
      return jsonb_build_object('ok', false, 'code', 'outside_scope');
    end if;
  elsif v_tournament.scope_type = 'city' then
    if v_player_country is distinct from v_tournament.country
       or nullif(btrim(v_player.city), '') is distinct from nullif(btrim(v_tournament.city), '') then
      return jsonb_build_object('ok', false, 'code', 'outside_scope');
    end if;
  end if;

  if exists (
    select 1 from public.tournament_registrations tr
    where tr.tournament_id = p_tournament_id
      and tr.player_id = v_player.id
      and tr.status = 'registered'
  ) then
    return jsonb_build_object('ok', false, 'code', 'already_registered');
  end if;

  if v_tournament.max_players is not null then
    select count(*)::integer into v_registered_count
    from public.tournament_registrations tr
    where tr.tournament_id = p_tournament_id and tr.status = 'registered';

    if v_registered_count >= v_tournament.max_players then
      return jsonb_build_object('ok', false, 'code', 'tournament_full');
    end if;
  end if;

  insert into public.tournament_registrations(tournament_id,player_id,status,registered_at)
  values(p_tournament_id,v_player.id,'registered',clock_timestamp())
  on conflict (tournament_id, player_id)
  do update set status='registered', registered_at=excluded.registered_at;

  return jsonb_build_object('ok', true, 'code', 'registered');
end;
$$;

revoke all on function public.register_for_tournament(uuid) from public;
revoke all on function public.register_for_tournament(uuid) from anon;
grant execute on function public.register_for_tournament(uuid) to authenticated;
