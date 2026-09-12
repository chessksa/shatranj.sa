-- Phase 3 platform services: persisted Game Review, streaks, achievements and unified moderation.

alter table public.v2_player_stats add column if not exists activity_streak integer not null default 0 check(activity_streak>=0);
alter table public.v2_player_stats add column if not exists longest_activity_streak integer not null default 0 check(longest_activity_streak>=0);
alter table public.v2_player_stats add column if not exists last_activity_date date;

create table if not exists public.v3_game_reviews (
  id uuid primary key default gen_random_uuid(),
  owner_player_id uuid not null references public.players(id) on delete cascade,
  source_type text not null check(source_type in('v2','variant','daily')),
  source_id uuid not null,
  accuracy_white numeric(5,2) check(accuracy_white is null or accuracy_white between 0 and 100),
  accuracy_black numeric(5,2) check(accuracy_black is null or accuracy_black between 0 and 100),
  critical_count integer not null default 0 check(critical_count>=0),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique(owner_player_id,source_type,source_id)
);

create table if not exists public.v3_game_review_moves (
  review_id uuid not null references public.v3_game_reviews(id) on delete cascade,
  ply integer not null check(ply>0),
  san text,
  played_move text,
  best_move text,
  eval_before integer,
  eval_after integer,
  loss_cp integer not null default 0 check(loss_cp>=0),
  classification text not null check(classification in('book','forced','best','excellent','good','inaccuracy','mistake','blunder')),
  pv text,
  is_critical boolean not null default false,
  primary key(review_id,ply)
);
create index if not exists v3_game_reviews_owner_idx on public.v3_game_reviews(owner_player_id,updated_at desc);

alter table public.v3_game_reviews enable row level security;
alter table public.v3_game_review_moves enable row level security;
revoke all on public.v3_game_reviews,public.v3_game_review_moves from public,anon,authenticated;
grant select on public.v3_game_reviews,public.v3_game_review_moves to authenticated;
create policy v3_game_reviews_owner_read on public.v3_game_reviews for select to authenticated using(owner_player_id=public.v2_my_player_id());
create policy v3_game_review_moves_owner_read on public.v3_game_review_moves for select to authenticated using(exists(select 1 from public.v3_game_reviews r where r.id=review_id and r.owner_player_id=public.v2_my_player_id()));

create table if not exists public.v3_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_player_id uuid not null references public.players(id) on delete cascade,
  target_type text not null check(target_type in('player','message','club','game','variant_game','daily_game')),
  target_key text not null,
  reported_player_id uuid references public.players(id) on delete set null,
  reason text not null check(char_length(reason) between 3 and 500),
  details text not null default '' check(char_length(details)<=2000),
  status text not null default 'open' check(status in('open','resolved','dismissed')),
  created_at timestamptz not null default clock_timestamp(),
  resolved_at timestamptz,
  resolved_by uuid
);
create index if not exists v3_reports_status_idx on public.v3_reports(status,created_at desc);
create index if not exists v3_reports_reporter_idx on public.v3_reports(reporter_player_id,created_at desc);

create table if not exists public.v3_moderation_actions (
  id bigint generated always as identity primary key,
  report_id uuid references public.v3_reports(id) on delete set null,
  admin_auth_user_id uuid not null,
  action text not null check(action in('dismiss','warn','remove_content','suspend','restore')),
  target_type text not null,
  target_key text not null,
  reason text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp()
);

alter table public.v3_reports enable row level security;
alter table public.v3_moderation_actions enable row level security;
revoke all on public.v3_reports,public.v3_moderation_actions from public,anon,authenticated;
grant select on public.v3_reports to authenticated;
create policy v3_reports_self_read on public.v3_reports for select to authenticated using(reporter_player_id=public.v2_my_player_id());
-- Moderation actions are never directly readable through the public API; admin RPCs expose scoped audit data.

insert into public.v2_achievements(id,title,description,icon,sort_order) values
 ('first_win','أول انتصار','حقق أول فوز في شطرنج العرب','♔',100),
 ('games_10','عشر مباريات','أكمل 10 مباريات','10',110),
 ('games_100','مئة مباراة','أكمل 100 مباراة','100',120),
 ('puzzle_10','محلل تكتيكي','حل 10 ألغاز بنجاح','✦',130),
 ('puzzle_streak_7','سلسلة ألغاز','حقق سلسلة 7 ألغاز','⚡',140),
 ('lesson_5','طالب مجتهد','أكمل 5 دروس','▣',150),
 ('friend_1','أول صديق','أضف أول صديق','☷',160),
 ('club_1','عضو نادي','انضم إلى نادٍ','♜',170),
 ('daily_streak_7','سبعة أيام','نشاط متواصل لمدة 7 أيام','7',180),
 ('tournament_winner','بطل بطولة','حقق المركز الأول في بطولة','★',190),
 ('chess960_first','Chess960','أكمل أول مباراة Chess960','960',200),
 ('battle_first_win','Puzzle Battle','حقق أول فوز في Puzzle Battle','⚔',210)
on conflict(id) do update set title=excluded.title,description=excluded.description,icon=excluded.icon,sort_order=excluded.sort_order;

create or replace function public.v3_touch_activity()
returns table(activity_streak integer,longest_activity_streak integer,last_activity_date date)
language plpgsql security definer set search_path='' as $$
declare pid uuid;today date;stats public.v2_player_stats%rowtype;
begin
  pid:=public.v2_my_player_id();if pid is null then raise exception 'authentication_required';end if;
  today:=(clock_timestamp() at time zone 'Asia/Riyadh')::date;
  insert into public.v2_player_stats(player_id) values(pid) on conflict(player_id) do nothing;
  select * into stats from public.v2_player_stats where player_id=pid for update;
  if stats.last_activity_date is null then stats.activity_streak:=1;
  elsif stats.last_activity_date=today then null;
  elsif stats.last_activity_date=today-1 then stats.activity_streak:=stats.activity_streak+1;
  else stats.activity_streak:=1;end if;
  stats.longest_activity_streak:=greatest(stats.longest_activity_streak,stats.activity_streak);
  update public.v2_player_stats set activity_streak=stats.activity_streak,longest_activity_streak=stats.longest_activity_streak,last_activity_date=today,updated_at=clock_timestamp() where player_id=pid;
  return query select stats.activity_streak,stats.longest_activity_streak,today;
end;$$;
revoke all on function public.v3_touch_activity() from public,anon;
grant execute on function public.v3_touch_activity() to authenticated;

create or replace function public.v3_refresh_achievements()
returns integer language plpgsql security definer set search_path='' as $$
declare pid uuid;awarded integer:=0;before_count integer;after_count integer;ps public.v2_player_stats%rowtype;p public.players%rowtype;
begin
  pid:=public.v2_my_player_id();if pid is null then raise exception 'authentication_required';end if;
  perform public.v3_touch_activity();
  insert into public.v2_player_stats(player_id) values(pid) on conflict(player_id) do nothing;
  select * into ps from public.v2_player_stats where player_id=pid;select * into p from public.players where id=pid;
  select count(*) into before_count from public.v2_user_achievements where player_id=pid;
  insert into public.v2_user_achievements(player_id,achievement_id)
  select pid,a.id from public.v2_achievements a where
    (a.id='first_win' and p.wins>=1) or
    (a.id='games_10' and p.games_count>=10) or
    (a.id='games_100' and p.games_count>=100) or
    (a.id='puzzle_10' and (select count(*) from public.v2_puzzle_attempts x where x.player_id=pid and x.success)>=10) or
    (a.id='puzzle_streak_7' and ps.puzzle_streak>=7) or
    (a.id='lesson_5' and ps.lessons_completed>=5) or
    (a.id='friend_1' and exists(select 1 from public.v2_friendships f where f.status='accepted' and pid in(f.requester_id,f.addressee_id))) or
    (a.id='club_1' and exists(select 1 from public.v2_club_members cm where cm.player_id=pid and cm.status='active')) or
    (a.id='daily_streak_7' and ps.activity_streak>=7) or
    (a.id='tournament_winner' and exists(select 1 from public.tournaments t where t.winner_player_id=pid and t.status='finished')) or
    (a.id='chess960_first' and exists(select 1 from public.v3_variant_games g where pid in(g.white_player_id,g.black_player_id) and g.status='finished')) or
    (a.id='battle_first_win' and exists(select 1 from public.v3_puzzle_battles b where b.winner_player_id=pid and b.status='finished'))
  on conflict(player_id,achievement_id) do nothing;
  select count(*) into after_count from public.v2_user_achievements where player_id=pid;awarded:=after_count-before_count;return awarded;
end;$$;
revoke all on function public.v3_refresh_achievements() from public,anon;
grant execute on function public.v3_refresh_achievements() to authenticated;

create or replace function public.v3_save_game_review(p_source_type text,p_source_id uuid,p_accuracy_white numeric,p_accuracy_black numeric,p_summary jsonb,p_moves jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare pid uuid;rid uuid;allowed boolean:=false;item jsonb;crit integer:=0;
begin
  pid:=public.v2_my_player_id();if pid is null then raise exception 'authentication_required';end if;
  if p_source_type='v2' then select exists(select 1 from public.v2_games g where g.id=p_source_id and g.status='finished' and pid in(g.white_player_id,g.black_player_id)) into allowed;
  elsif p_source_type='variant' then select exists(select 1 from public.v3_variant_games g where g.id=p_source_id and g.status='finished' and pid in(g.white_player_id,g.black_player_id)) into allowed;
  elsif p_source_type='daily' then select exists(select 1 from public.v2_correspondence_games g where g.id=p_source_id and g.status='finished' and pid in(g.white_player_id,g.black_player_id)) into allowed;
  else raise exception 'invalid_source_type';end if;
  if not allowed then raise exception 'review_not_allowed';end if;
  if p_accuracy_white is not null and(p_accuracy_white<0 or p_accuracy_white>100) then raise exception 'invalid_accuracy';end if;
  if p_accuracy_black is not null and(p_accuracy_black<0 or p_accuracy_black>100) then raise exception 'invalid_accuracy';end if;
  if jsonb_typeof(coalesce(p_moves,'[]'::jsonb))<>'array' then raise exception 'invalid_moves';end if;
  select count(*) into crit from jsonb_array_elements(coalesce(p_moves,'[]'::jsonb)) x where coalesce((x->>'isCritical')::boolean,false);
  insert into public.v3_game_reviews(owner_player_id,source_type,source_id,accuracy_white,accuracy_black,critical_count,summary,updated_at)
  values(pid,p_source_type,p_source_id,p_accuracy_white,p_accuracy_black,crit,coalesce(p_summary,'{}'::jsonb),clock_timestamp())
  on conflict(owner_player_id,source_type,source_id) do update set accuracy_white=excluded.accuracy_white,accuracy_black=excluded.accuracy_black,critical_count=excluded.critical_count,summary=excluded.summary,updated_at=clock_timestamp()
  returning id into rid;
  delete from public.v3_game_review_moves where review_id=rid;
  for item in select value from jsonb_array_elements(coalesce(p_moves,'[]'::jsonb)) loop
    insert into public.v3_game_review_moves(review_id,ply,san,played_move,best_move,eval_before,eval_after,loss_cp,classification,pv,is_critical)
    values(rid,(item->>'ply')::integer,item->>'san',item->>'playedMove',item->>'bestMove',nullif(item->>'evalBefore','')::integer,nullif(item->>'evalAfter','')::integer,greatest(0,coalesce(nullif(item->>'lossCp','')::integer,0)),coalesce(item->>'classification','good'),item->>'pv',coalesce((item->>'isCritical')::boolean,false));
  end loop;
  return rid;
end;$$;
revoke all on function public.v3_save_game_review(text,uuid,numeric,numeric,jsonb,jsonb) from public,anon;
grant execute on function public.v3_save_game_review(text,uuid,numeric,numeric,jsonb,jsonb) to authenticated;

create or replace function public.v3_create_report(p_target_type text,p_target_key text,p_reported_player_id uuid,p_reason text,p_details text default '')
returns uuid language plpgsql security definer set search_path='' as $$
declare pid uuid;rid uuid;
begin
  pid:=public.v2_my_player_id();if pid is null then raise exception 'authentication_required';end if;
  if p_target_type not in('player','message','club','game','variant_game','daily_game') then raise exception 'invalid_target_type';end if;
  if char_length(btrim(coalesce(p_target_key,'')))<1 or char_length(btrim(coalesce(p_reason,'')))<3 then raise exception 'invalid_report';end if;
  if p_reported_player_id=pid then raise exception 'cannot_report_self';end if;
  insert into public.v3_reports(reporter_player_id,target_type,target_key,reported_player_id,reason,details) values(pid,p_target_type,btrim(p_target_key),p_reported_player_id,btrim(p_reason),left(coalesce(p_details,''),2000)) returning id into rid;
  return rid;
end;$$;
revoke all on function public.v3_create_report(text,text,uuid,text,text) from public,anon;
grant execute on function public.v3_create_report(text,text,uuid,text,text) to authenticated;

create or replace function public.admin_v3_list_reports(p_status text default 'open')
returns table(id uuid,target_type text,target_key text,reporter_player_id uuid,reporter_name text,reported_player_id uuid,reported_name text,reason text,details text,status text,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_operator();
  return query select r.id,r.target_type,r.target_key,r.reporter_player_id,rp.name,r.reported_player_id,tp.name,r.reason,r.details,r.status,r.created_at from public.v3_reports r join public.players rp on rp.id=r.reporter_player_id left join public.players tp on tp.id=r.reported_player_id where p_status is null or r.status=p_status order by r.created_at desc limit 500;
end;$$;
revoke all on function public.admin_v3_list_reports(text) from public,anon;
grant execute on function public.admin_v3_list_reports(text) to authenticated;

create or replace function public.admin_v3_resolve_report(p_report_id uuid,p_action text,p_reason text default '')
returns boolean language plpgsql security definer set search_path='' as $$
declare admin_id uuid;r public.v3_reports%rowtype;msg_id bigint;
begin
  admin_id:=private.require_operator();select * into r from public.v3_reports where id=p_report_id for update;if r.id is null then raise exception 'report_not_found';end if;
  if p_action not in('dismiss','warn','remove_content','suspend','restore') then raise exception 'invalid_moderation_action';end if;
  if p_action='suspend' then if r.reported_player_id is null then raise exception 'player_target_required';end if;update public.players set status='suspended' where id=r.reported_player_id;
  elsif p_action='restore' then if r.reported_player_id is null then raise exception 'player_target_required';end if;update public.players set status='active' where id=r.reported_player_id;
  elsif p_action='remove_content' and r.target_type='message' then begin msg_id:=r.target_key::bigint;delete from public.v2_messages where id=msg_id;exception when invalid_text_representation then raise exception 'invalid_message_target';end;
  elsif p_action='warn' and r.reported_player_id is not null then insert into public.v2_notifications(player_id,kind,title,body) values(r.reported_player_id,'moderation','تنبيه من الإدارة',left(coalesce(nullif(btrim(p_reason),''),'تمت مراجعة بلاغ متعلق بحسابك.'),500));
  end if;
  update public.v3_reports set status=case when p_action='dismiss' then 'dismissed' else 'resolved' end,resolved_at=clock_timestamp(),resolved_by=admin_id where id=r.id;
  insert into public.v3_moderation_actions(report_id,admin_auth_user_id,action,target_type,target_key,reason,metadata) values(r.id,admin_id,p_action,r.target_type,r.target_key,coalesce(p_reason,''),jsonb_build_object('reported_player_id',r.reported_player_id));
  return true;
end;$$;
revoke all on function public.admin_v3_resolve_report(uuid,text,text) from public,anon;
grant execute on function public.admin_v3_resolve_report(uuid,text,text) to authenticated;

create or replace function public.admin_v3_moderation_audit(p_limit integer default 200)
returns table(id bigint,report_id uuid,admin_auth_user_id uuid,action text,target_type text,target_key text,reason text,metadata jsonb,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_operator();
  return query select a.id,a.report_id,a.admin_auth_user_id,a.action,a.target_type,a.target_key,a.reason,a.metadata,a.created_at from public.v3_moderation_actions a order by a.created_at desc limit greatest(1,least(coalesce(p_limit,200),1000));
end;$$;
revoke all on function public.admin_v3_moderation_audit(integer) from public,anon;
grant execute on function public.admin_v3_moderation_audit(integer) to authenticated;
