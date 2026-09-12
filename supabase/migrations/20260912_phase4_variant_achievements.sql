-- Phase 4: one idempotent first-game achievement per supported variant.

insert into public.v2_achievements(id,title,description,icon,sort_order) values
  ('crazyhouse_first','Crazyhouse','أكمل أول مباراة Crazyhouse','♞',240),
  ('atomic_first','Atomic','أكمل أول مباراة Atomic','✹',250),
  ('antichess_first','Antichess','أكمل أول مباراة Antichess','↔',260),
  ('horde_first','Horde','أكمل أول مباراة Horde','♟',270),
  ('racingkings_first','Racing Kings','أكمل أول مباراة Racing Kings','♔',280)
on conflict(id) do update set
  title=excluded.title,
  description=excluded.description,
  icon=excluded.icon,
  sort_order=excluded.sort_order;

create or replace function public.v3_refresh_achievements()
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  pid uuid;
  awarded integer:=0;
  before_count integer;
  after_count integer;
  ps public.v2_player_stats%rowtype;
  p public.players%rowtype;
begin
  pid:=public.v2_my_player_id();
  if pid is null then raise exception 'authentication_required'; end if;

  perform public.v3_touch_activity();
  insert into public.v2_player_stats(player_id) values(pid) on conflict(player_id) do nothing;
  select * into ps from public.v2_player_stats where player_id=pid;
  select * into p from public.players where id=pid;
  select count(*) into before_count from public.v2_user_achievements where player_id=pid;

  insert into public.v2_user_achievements(player_id,achievement_id)
  select pid,a.id
  from public.v2_achievements a
  where
    (a.id='first_win' and p.wins>=1)
    or (a.id='games_10' and p.games_count>=10)
    or (a.id='games_100' and p.games_count>=100)
    or (a.id='puzzle_10' and (select count(*) from public.v2_puzzle_attempts x where x.player_id=pid and x.success)>=10)
    or (a.id='puzzle_streak_7' and ps.puzzle_streak>=7)
    or (a.id='lesson_5' and ps.lessons_completed>=5)
    or (a.id='friend_1' and exists(select 1 from public.v2_friendships f where f.status='accepted' and pid in(f.requester_id,f.addressee_id)))
    or (a.id='club_1' and exists(select 1 from public.v2_club_members cm where cm.player_id=pid and cm.status='active'))
    or (a.id='daily_streak_7' and ps.activity_streak>=7)
    or (a.id='tournament_winner' and exists(select 1 from public.tournaments t where t.winner_player_id=pid and t.status='finished'))
    or (a.id='chess960_first' and exists(select 1 from public.v3_variant_games g where pid in(g.white_player_id,g.black_player_id) and g.status='finished' and g.variant='chess960'))
    or (a.id='threecheck_first' and exists(select 1 from public.v3_variant_games g where pid in(g.white_player_id,g.black_player_id) and g.status='finished' and g.variant='threecheck'))
    or (a.id='koth_first' and exists(select 1 from public.v3_variant_games g where pid in(g.white_player_id,g.black_player_id) and g.status='finished' and g.variant='kingofthehill'))
    or (a.id='crazyhouse_first' and exists(select 1 from public.v3_variant_games g where pid in(g.white_player_id,g.black_player_id) and g.status='finished' and g.variant='crazyhouse'))
    or (a.id='atomic_first' and exists(select 1 from public.v3_variant_games g where pid in(g.white_player_id,g.black_player_id) and g.status='finished' and g.variant='atomic'))
    or (a.id='antichess_first' and exists(select 1 from public.v3_variant_games g where pid in(g.white_player_id,g.black_player_id) and g.status='finished' and g.variant='antichess'))
    or (a.id='horde_first' and exists(select 1 from public.v3_variant_games g where pid in(g.white_player_id,g.black_player_id) and g.status='finished' and g.variant='horde'))
    or (a.id='racingkings_first' and exists(select 1 from public.v3_variant_games g where pid in(g.white_player_id,g.black_player_id) and g.status='finished' and g.variant='racingkings'))
    or (a.id='battle_first_win' and exists(select 1 from public.v3_puzzle_battles b where b.winner_player_id=pid and b.status='finished'))
  on conflict(player_id,achievement_id) do nothing;

  select count(*) into after_count from public.v2_user_achievements where player_id=pid;
  awarded:=after_count-before_count;
  return awarded;
end;
$$;

revoke all on function public.v3_refresh_achievements() from public,anon;
grant execute on function public.v3_refresh_achievements() to authenticated;
