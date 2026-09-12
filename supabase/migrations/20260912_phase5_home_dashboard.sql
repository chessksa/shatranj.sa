-- Phase 5: one authenticated dashboard payload for the signed-in home experience.

create or replace function public.v5_home_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public','private','auth'
as $$
declare
  v_me uuid;
  v_player public.players%rowtype;
  v_active jsonb;
  v_recent jsonb;
  v_tournament jsonb;
  v_puzzle jsonb;
  v_incoming integer:=0;
  v_friends integer:=0;
  v_online integer:=0;
  v_unread integer:=0;
begin
  v_me:=private.v2_current_player_id();
  if v_me is null then
    raise exception 'player_profile_required' using errcode='42501';
  end if;

  select * into v_player
  from public.players p
  where p.id=v_me and p.status='active' and not coalesce(p.is_synthetic,false);
  if not found then
    raise exception 'active_player_required' using errcode='42501';
  end if;

  select jsonb_build_object(
    'id',g.id,
    'status',g.status,
    'base_seconds',g.base_seconds,
    'increment_seconds',g.increment_seconds,
    'rated',g.rated,
    'turn',g.turn,
    'my_color',case when g.white_player_id=v_me then 'w' else 'b' end,
    'opponent_id',case when g.white_player_id=v_me then g.black_player_id else g.white_player_id end,
    'opponent_name',opp.name,
    'opponent_rating',opp.rating,
    'created_at',g.created_at
  ) into v_active
  from public.v2_games g
  join public.players opp on opp.id=case when g.white_player_id=v_me then g.black_player_id else g.white_player_id end
  where g.status in ('matched','active') and v_me in (g.white_player_id,g.black_player_id)
  order by g.created_at desc
  limit 1;

  select count(*)::integer into v_incoming
  from public.v2_challenges c
  where c.challenged_id=v_me
    and c.challenge_type='direct'
    and c.status='pending'
    and c.expires_at>clock_timestamp();

  select count(*)::integer into v_friends
  from public.v2_friendships f
  where f.status='accepted' and v_me in (f.requester_id,f.addressee_id);

  with friend_ids as (
    select case when f.requester_id=v_me then f.addressee_id else f.requester_id end as friend_id
    from public.v2_friendships f
    where f.status='accepted' and v_me in (f.requester_id,f.addressee_id)
  )
  select count(*)::integer into v_online
  from friend_ids f
  join private.player_presence pp on pp.player_id=f.friend_id
  left join public.v5_user_settings s on s.player_id=f.friend_id
  where pp.last_seen_at>=clock_timestamp()-interval '90 seconds'
    and coalesce(s.show_online,true);

  select count(*)::integer into v_unread
  from public.v2_notifications n
  where n.player_id=v_me and n.read_at is null;

  select jsonb_build_object(
    'id',t.id,
    'name',t.name,
    'status',t.status,
    'format',t.format,
    'starts_at',t.starts_at,
    'time_control',t.time_control,
    'country',t.country,
    'city',t.city
  ) into v_tournament
  from public.tournaments t
  where t.status in ('open','running')
  order by case when t.status='running' then 0 else 1 end,
           coalesce(t.starts_at,clock_timestamp()+interval '100 years') asc,
           t.created_at desc
  limit 1;

  select jsonb_build_object(
    'id',p.id,
    'title',p.title,
    'rating',p.rating,
    'themes',p.themes,
    'daily_date',p.daily_date
  ) into v_puzzle
  from public.v2_puzzles p
  where p.is_published
    and (p.daily_date=current_date or p.daily_date is null)
  order by (p.daily_date=current_date) desc,p.daily_date desc nulls last,p.created_at desc
  limit 1;

  select jsonb_build_object(
    'id',g.id,
    'result',g.result,
    'finished_at',g.finished_at,
    'base_seconds',g.base_seconds,
    'increment_seconds',g.increment_seconds,
    'rated',g.rated,
    'my_color',case when g.white_player_id=v_me then 'w' else 'b' end,
    'opponent_id',case when g.white_player_id=v_me then g.black_player_id else g.white_player_id end,
    'opponent_name',opp.name
  ) into v_recent
  from public.v2_games g
  join public.players opp on opp.id=case when g.white_player_id=v_me then g.black_player_id else g.white_player_id end
  where g.status='finished' and v_me in (g.white_player_id,g.black_player_id)
  order by g.finished_at desc nulls last,g.created_at desc
  limit 1;

  return jsonb_build_object(
    'player',jsonb_build_object(
      'id',v_player.id,
      'name',v_player.name,
      'rating',v_player.rating,
      'games_count',v_player.games_count,
      'wins',v_player.wins,
      'draws',v_player.draws,
      'losses',v_player.losses,
      'country',v_player.country,
      'city',v_player.city
    ),
    'active_game',v_active,
    'incoming_challenges',v_incoming,
    'friends_count',v_friends,
    'online_friends',v_online,
    'unread_notifications',v_unread,
    'upcoming_tournament',v_tournament,
    'daily_puzzle',v_puzzle,
    'recent_game',v_recent,
    'server_now',clock_timestamp()
  );
end;
$$;

revoke all on function public.v5_home_dashboard() from public,anon;
grant execute on function public.v5_home_dashboard() to authenticated;
