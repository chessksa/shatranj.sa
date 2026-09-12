-- Shatranj V2 platform expansion: social, puzzles, learning, clubs, notifications, achievements and correspondence foundations.

alter table public.v2_games drop constraint if exists v2_games_base_seconds_check;
alter table public.v2_games add constraint v2_games_base_seconds_check check (base_seconds between 30 and 86400);
alter table public.v2_games drop constraint if exists v2_games_increment_seconds_check;
alter table public.v2_games add constraint v2_games_increment_seconds_check check (increment_seconds between 0 and 60);
alter table public.v2_games add column if not exists variant text not null default 'standard' check (variant in ('standard','chess960'));

create table if not exists public.v2_player_stats (
  player_id uuid primary key references public.players(id) on delete cascade,
  puzzle_rating integer not null default 1200 check (puzzle_rating between 100 and 4000),
  puzzle_streak integer not null default 0 check (puzzle_streak >= 0),
  daily_puzzle_streak integer not null default 0 check (daily_puzzle_streak >= 0),
  last_daily_puzzle_date date,
  lessons_completed integer not null default 0 check (lessons_completed >= 0),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.v2_friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.players(id) on delete cascade,
  addressee_id uuid not null references public.players(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint v2_friendships_distinct_players check (requester_id <> addressee_id),
  constraint v2_friendships_direction_key unique (requester_id, addressee_id)
);
create index if not exists v2_friendships_addressee_status_idx on public.v2_friendships(addressee_id,status);
create index if not exists v2_friendships_requester_status_idx on public.v2_friendships(requester_id,status);

create table if not exists public.v2_blocks (
  blocker_id uuid not null references public.players(id) on delete cascade,
  blocked_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default clock_timestamp(),
  primary key (blocker_id,blocked_id),
  constraint v2_blocks_distinct_players check (blocker_id <> blocked_id)
);

create table if not exists public.v2_notifications (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  href text,
  read_at timestamptz,
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists v2_notifications_player_created_idx on public.v2_notifications(player_id,created_at desc);
create index if not exists v2_notifications_unread_idx on public.v2_notifications(player_id,created_at desc) where read_at is null;

create table if not exists public.v2_challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references public.players(id) on delete cascade,
  challenged_id uuid not null references public.players(id) on delete cascade,
  base_seconds integer not null check (base_seconds between 30 and 86400),
  increment_seconds integer not null default 0 check (increment_seconds between 0 and 60),
  rated boolean not null default true,
  variant text not null default 'standard' check (variant in ('standard','chess960')),
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled','expired')),
  game_id uuid references public.v2_games(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp() + interval '10 minutes'),
  constraint v2_challenges_distinct_players check (challenger_id <> challenged_id)
);
create index if not exists v2_challenges_target_status_idx on public.v2_challenges(challenged_id,status,created_at desc);
create unique index if not exists v2_challenges_one_pending_pair_idx
  on public.v2_challenges(least(challenger_id,challenged_id),greatest(challenger_id,challenged_id)) where status='pending';

create table if not exists public.v2_clubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '',
  owner_id uuid not null references public.players(id) on delete restrict,
  avatar_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.v2_club_members (
  club_id uuid not null references public.v2_clubs(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  status text not null default 'active' check (status in ('active','pending','banned')),
  joined_at timestamptz not null default clock_timestamp(),
  primary key (club_id,player_id)
);
create index if not exists v2_club_members_player_idx on public.v2_club_members(player_id,status);

create table if not exists public.v2_messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references public.players(id) on delete cascade,
  recipient_id uuid references public.players(id) on delete cascade,
  club_id uuid references public.v2_clubs(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default clock_timestamp(),
  constraint v2_messages_one_target check ((recipient_id is not null)::int + (club_id is not null)::int = 1)
);
create index if not exists v2_messages_direct_idx on public.v2_messages(recipient_id,created_at desc) where recipient_id is not null;
create index if not exists v2_messages_club_idx on public.v2_messages(club_id,created_at desc) where club_id is not null;

create table if not exists public.v2_puzzles (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'لغز تكتيكي',
  fen text not null,
  solution_uci text[] not null check (cardinality(solution_uci) > 0),
  themes text[] not null default '{}',
  rating integer not null default 1200 check (rating between 100 and 4000),
  daily_date date unique,
  is_published boolean not null default true,
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists v2_puzzles_rating_idx on public.v2_puzzles(rating) where is_published;
create index if not exists v2_puzzles_daily_idx on public.v2_puzzles(daily_date) where daily_date is not null;

create table if not exists public.v2_puzzle_attempts (
  id bigint generated always as identity primary key,
  puzzle_id uuid not null references public.v2_puzzles(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  success boolean not null,
  mistakes integer not null default 0 check (mistakes >= 0),
  duration_ms integer not null default 0 check (duration_ms >= 0),
  rating_before integer not null,
  rating_after integer not null,
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists v2_puzzle_attempts_player_idx on public.v2_puzzle_attempts(player_id,created_at desc);

create table if not exists public.v2_lessons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null check (category in ('basics','opening','middlegame','endgame','tactics')),
  level text not null default 'beginner' check (level in ('beginner','intermediate','advanced')),
  summary text not null default '',
  body_md text not null default '',
  initial_fen text,
  challenge_uci text[] not null default '{}',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default clock_timestamp()
);

create table if not exists public.v2_lesson_progress (
  player_id uuid not null references public.players(id) on delete cascade,
  lesson_id uuid not null references public.v2_lessons(id) on delete cascade,
  completed boolean not null default false,
  score integer not null default 0 check (score between 0 and 100),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (player_id,lesson_id)
);

create table if not exists public.v2_achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null default '★',
  sort_order integer not null default 0
);

create table if not exists public.v2_user_achievements (
  player_id uuid not null references public.players(id) on delete cascade,
  achievement_id text not null references public.v2_achievements(id) on delete cascade,
  unlocked_at timestamptz not null default clock_timestamp(),
  primary key (player_id,achievement_id)
);

create table if not exists public.v2_correspondence_games (
  id uuid primary key default gen_random_uuid(),
  white_player_id uuid not null references public.players(id) on delete cascade,
  black_player_id uuid not null references public.players(id) on delete cascade,
  rated boolean not null default true,
  variant text not null default 'standard' check (variant in ('standard','chess960')),
  days_per_move integer not null default 1 check (days_per_move between 1 and 14),
  fen text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn text not null default 'w' check (turn in ('w','b')),
  ply integer not null default 0 check (ply >= 0),
  status text not null default 'active' check (status in ('active','finished','cancelled')),
  result text check (result is null or result in ('1-0','0-1','1/2-1/2')),
  move_due_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  finished_at timestamptz,
  constraint v2_correspondence_distinct_players check (white_player_id <> black_player_id)
);
create index if not exists v2_correspondence_player_white_idx on public.v2_correspondence_games(white_player_id,status,updated_at desc);
create index if not exists v2_correspondence_player_black_idx on public.v2_correspondence_games(black_player_id,status,updated_at desc);

create table if not exists public.v2_correspondence_moves (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.v2_correspondence_games(id) on delete cascade,
  ply integer not null check (ply > 0),
  from_square text not null check (from_square ~ '^[a-h][1-8]$'),
  to_square text not null check (to_square ~ '^[a-h][1-8]$'),
  promotion text check (promotion is null or promotion in ('q','r','b','n')),
  san text not null,
  fen_after text not null,
  mover_player_id uuid not null references public.players(id),
  created_at timestamptz not null default clock_timestamp(),
  unique(game_id,ply)
);

create or replace function public.v2_my_player_id()
returns uuid language sql stable security definer set search_path=public,private,auth as $$
  select private.v2_current_player_id();
$$;
grant execute on function public.v2_my_player_id() to authenticated;

alter table public.v2_player_stats enable row level security;
alter table public.v2_friendships enable row level security;
alter table public.v2_blocks enable row level security;
alter table public.v2_notifications enable row level security;
alter table public.v2_challenges enable row level security;
alter table public.v2_clubs enable row level security;
alter table public.v2_club_members enable row level security;
alter table public.v2_messages enable row level security;
alter table public.v2_puzzles enable row level security;
alter table public.v2_puzzle_attempts enable row level security;
alter table public.v2_lessons enable row level security;
alter table public.v2_lesson_progress enable row level security;
alter table public.v2_achievements enable row level security;
alter table public.v2_user_achievements enable row level security;
alter table public.v2_correspondence_games enable row level security;
alter table public.v2_correspondence_moves enable row level security;

revoke all on table public.v2_player_stats,public.v2_friendships,public.v2_blocks,public.v2_notifications,public.v2_challenges,public.v2_clubs,public.v2_club_members,public.v2_messages,public.v2_puzzles,public.v2_puzzle_attempts,public.v2_lessons,public.v2_lesson_progress,public.v2_achievements,public.v2_user_achievements,public.v2_correspondence_games,public.v2_correspondence_moves from anon,authenticated;
grant select on table public.v2_player_stats,public.v2_friendships,public.v2_blocks,public.v2_notifications,public.v2_challenges,public.v2_club_members,public.v2_messages,public.v2_puzzle_attempts,public.v2_lesson_progress,public.v2_user_achievements,public.v2_correspondence_games,public.v2_correspondence_moves to authenticated;
grant select on table public.v2_clubs,public.v2_puzzles,public.v2_lessons,public.v2_achievements to anon,authenticated;

create policy v2_player_stats_self_select on public.v2_player_stats for select to authenticated using (player_id = public.v2_my_player_id());
create policy v2_friendships_participant_select on public.v2_friendships for select to authenticated using (public.v2_my_player_id() in (requester_id,addressee_id));
create policy v2_blocks_self_select on public.v2_blocks for select to authenticated using (blocker_id = public.v2_my_player_id());
create policy v2_notifications_self_select on public.v2_notifications for select to authenticated using (player_id = public.v2_my_player_id());
create policy v2_challenges_participant_select on public.v2_challenges for select to authenticated using (public.v2_my_player_id() in (challenger_id,challenged_id));
create policy v2_clubs_public_select on public.v2_clubs for select to anon,authenticated using (is_public);
create policy v2_clubs_owner_select on public.v2_clubs for select to authenticated using (owner_id = public.v2_my_player_id());
create policy v2_club_members_select on public.v2_club_members for select to authenticated using (status='active' or player_id=public.v2_my_player_id());
create policy v2_messages_visible_select on public.v2_messages for select to authenticated using (
  sender_id=public.v2_my_player_id() or recipient_id=public.v2_my_player_id() or
  (club_id is not null and exists(select 1 from public.v2_club_members cm where cm.club_id=v2_messages.club_id and cm.player_id=public.v2_my_player_id() and cm.status='active'))
);
create policy v2_puzzles_public_select on public.v2_puzzles for select to anon,authenticated using (is_published);
create policy v2_puzzle_attempts_self_select on public.v2_puzzle_attempts for select to authenticated using (player_id=public.v2_my_player_id());
create policy v2_lessons_public_select on public.v2_lessons for select to anon,authenticated using (is_published);
create policy v2_lesson_progress_self_select on public.v2_lesson_progress for select to authenticated using (player_id=public.v2_my_player_id());
create policy v2_achievements_public_select on public.v2_achievements for select to anon,authenticated using (true);
create policy v2_user_achievements_self_select on public.v2_user_achievements for select to authenticated using (player_id=public.v2_my_player_id());
create policy v2_correspondence_participant_select on public.v2_correspondence_games for select to authenticated using (public.v2_my_player_id() in (white_player_id,black_player_id));
create policy v2_correspondence_moves_participant_select on public.v2_correspondence_moves for select to authenticated using (exists(select 1 from public.v2_correspondence_games g where g.id=game_id and public.v2_my_player_id() in (g.white_player_id,g.black_player_id)));

create or replace function public.v2_send_friend_request(p_target_player_id uuid)
returns uuid language plpgsql security definer set search_path=public,private,auth as $$
declare v_me uuid; v_id uuid; v_reverse uuid;
begin
  v_me:=private.v2_current_player_id();
  if v_me is null or p_target_player_id is null or v_me=p_target_player_id then raise exception 'invalid_target' using errcode='22023'; end if;
  if not exists(select 1 from public.players where id=p_target_player_id and coalesce(is_synthetic,false)=false) then raise exception 'player_not_found' using errcode='P0002'; end if;
  if exists(select 1 from public.v2_blocks where (blocker_id=v_me and blocked_id=p_target_player_id) or (blocker_id=p_target_player_id and blocked_id=v_me)) then raise exception 'blocked' using errcode='42501'; end if;
  select id into v_reverse from public.v2_friendships where requester_id=p_target_player_id and addressee_id=v_me and status='pending' for update;
  if v_reverse is not null then
    update public.v2_friendships set status='accepted',updated_at=clock_timestamp() where id=v_reverse;
    insert into public.v2_notifications(player_id,kind,title,body,href) values(p_target_player_id,'friend_accepted','تم قبول طلب الصداقة','أصبحتما صديقين.','community.html');
    return v_reverse;
  end if;
  select id into v_id from public.v2_friendships where ((requester_id=v_me and addressee_id=p_target_player_id) or (requester_id=p_target_player_id and addressee_id=v_me)) and status='accepted' limit 1;
  if v_id is not null then return v_id; end if;
  insert into public.v2_friendships(requester_id,addressee_id,status) values(v_me,p_target_player_id,'pending')
    on conflict(requester_id,addressee_id) do update set status='pending',updated_at=clock_timestamp() returning id into v_id;
  insert into public.v2_notifications(player_id,kind,title,body,href) values(p_target_player_id,'friend_request','طلب صداقة جديد','لديك طلب صداقة جديد.','community.html');
  return v_id;
end $$;

create or replace function public.v2_respond_friend_request(p_friendship_id uuid,p_accept boolean)
returns text language plpgsql security definer set search_path=public,private,auth as $$
declare v_me uuid; v_req public.v2_friendships%rowtype;
begin
 v_me:=private.v2_current_player_id();
 select * into v_req from public.v2_friendships where id=p_friendship_id for update;
 if not found or v_req.addressee_id<>v_me or v_req.status<>'pending' then raise exception 'request_not_available' using errcode='42501'; end if;
 update public.v2_friendships set status=case when p_accept then 'accepted' else 'rejected' end,updated_at=clock_timestamp() where id=p_friendship_id;
 if p_accept then insert into public.v2_notifications(player_id,kind,title,body,href) values(v_req.requester_id,'friend_accepted','تم قبول طلب الصداقة','تم قبول طلب صداقتك.','community.html'); end if;
 return case when p_accept then 'accepted' else 'rejected' end;
end $$;

create or replace function public.v2_remove_friend(p_target_player_id uuid)
returns boolean language plpgsql security definer set search_path=public,private,auth as $$
declare v_me uuid; v_count integer;
begin
 v_me:=private.v2_current_player_id();
 delete from public.v2_friendships where status='accepted' and ((requester_id=v_me and addressee_id=p_target_player_id) or (requester_id=p_target_player_id and addressee_id=v_me));
 get diagnostics v_count=row_count; return v_count>0;
end $$;

create or replace function public.v2_set_block(p_target_player_id uuid,p_block boolean)
returns boolean language plpgsql security definer set search_path=public,private,auth as $$
declare v_me uuid;
begin
 v_me:=private.v2_current_player_id();
 if v_me is null or p_target_player_id is null or v_me=p_target_player_id then raise exception 'invalid_target' using errcode='22023'; end if;
 if p_block then
  insert into public.v2_blocks(blocker_id,blocked_id) values(v_me,p_target_player_id) on conflict do nothing;
  delete from public.v2_friendships where (requester_id=v_me and addressee_id=p_target_player_id) or (requester_id=p_target_player_id and addressee_id=v_me);
  update public.v2_challenges set status='cancelled',updated_at=clock_timestamp() where status='pending' and ((challenger_id=v_me and challenged_id=p_target_player_id) or (challenger_id=p_target_player_id and challenged_id=v_me));
 else
  delete from public.v2_blocks where blocker_id=v_me and blocked_id=p_target_player_id;
 end if;
 return p_block;
end $$;

create or replace function public.v2_send_challenge(p_target_player_id uuid,p_base_seconds integer default 600,p_increment_seconds integer default 0,p_rated boolean default true,p_variant text default 'standard')
returns uuid language plpgsql security definer set search_path=public,private,auth as $$
declare v_me uuid; v_id uuid;
begin
 v_me:=private.v2_current_player_id();
 if v_me is null or p_target_player_id is null or v_me=p_target_player_id then raise exception 'invalid_target' using errcode='22023'; end if;
 if p_base_seconds not between 30 and 86400 or p_increment_seconds not between 0 and 60 then raise exception 'invalid_time_control' using errcode='22023'; end if;
 if p_variant not in ('standard','chess960') then raise exception 'unsupported_variant' using errcode='22023'; end if;
 if exists(select 1 from public.v2_blocks where (blocker_id=v_me and blocked_id=p_target_player_id) or (blocker_id=p_target_player_id and blocked_id=v_me)) then raise exception 'blocked' using errcode='42501'; end if;
 update public.v2_challenges set status='expired',updated_at=clock_timestamp() where status='pending' and expires_at<=clock_timestamp();
 insert into public.v2_challenges(challenger_id,challenged_id,base_seconds,increment_seconds,rated,variant)
 values(v_me,p_target_player_id,p_base_seconds,p_increment_seconds,p_rated,p_variant) returning id into v_id;
 insert into public.v2_notifications(player_id,kind,title,body,href) values(p_target_player_id,'challenge','تحدٍ جديد','دعاك لاعب إلى مباراة.','community.html');
 return v_id;
end $$;

create or replace function public.v2_respond_challenge(p_challenge_id uuid,p_accept boolean)
returns uuid language plpgsql security definer set search_path=public,private,auth as $$
declare v_me uuid; v_ch public.v2_challenges%rowtype; v_game uuid; v_white uuid; v_black uuid;
begin
 v_me:=private.v2_current_player_id();
 select * into v_ch from public.v2_challenges where id=p_challenge_id for update;
 if not found or v_ch.challenged_id<>v_me or v_ch.status<>'pending' or v_ch.expires_at<=clock_timestamp() then raise exception 'challenge_not_available' using errcode='42501'; end if;
 if not p_accept then update public.v2_challenges set status='rejected',updated_at=clock_timestamp() where id=p_challenge_id; return null; end if;
 if exists(select 1 from public.v2_games where status in ('matched','active') and (v_ch.challenger_id in (white_player_id,black_player_id) or v_ch.challenged_id in (white_player_id,black_player_id))) then raise exception 'player_already_in_game' using errcode='23505'; end if;
 if random()<0.5 then v_white:=v_ch.challenger_id; v_black:=v_ch.challenged_id; else v_white:=v_ch.challenged_id; v_black:=v_ch.challenger_id; end if;
 insert into public.v2_games(white_player_id,black_player_id,rated,base_seconds,increment_seconds,white_ms,black_ms,status,grace_until,variant)
 values(v_white,v_black,v_ch.rated,v_ch.base_seconds,v_ch.increment_seconds,v_ch.base_seconds::bigint*1000,v_ch.base_seconds::bigint*1000,'matched',clock_timestamp()+interval '5 seconds',v_ch.variant)
 returning id into v_game;
 update public.v2_challenges set status='accepted',game_id=v_game,updated_at=clock_timestamp() where id=p_challenge_id;
 insert into public.v2_notifications(player_id,kind,title,body,href) values(v_ch.challenger_id,'challenge_accepted','تم قبول التحدي','بدأت المباراة.','play-v2.html?game='||v_game::text);
 return v_game;
end $$;

create or replace function public.v2_mark_notification_read(p_notification_id uuid default null)
returns integer language plpgsql security definer set search_path=public,private,auth as $$
declare v_me uuid; v_count integer;
begin
 v_me:=private.v2_current_player_id();
 update public.v2_notifications set read_at=coalesce(read_at,clock_timestamp()) where player_id=v_me and (p_notification_id is null or id=p_notification_id);
 get diagnostics v_count=row_count; return v_count;
end $$;

create or replace function public.v2_submit_puzzle_attempt(p_puzzle_id uuid,p_success boolean,p_mistakes integer default 0,p_duration_ms integer default 0,p_rated boolean default true)
returns table(rating_before integer,rating_after integer,delta integer,daily_streak integer)
language plpgsql security definer set search_path=public,private,auth as $$
declare v_me uuid; v_puzzle public.v2_puzzles%rowtype; v_stats public.v2_player_stats%rowtype; v_before integer; v_after integer; v_delta integer; v_daily integer;
begin
 v_me:=private.v2_current_player_id(); if v_me is null then raise exception 'player_profile_required' using errcode='42501'; end if;
 select * into v_puzzle from public.v2_puzzles where id=p_puzzle_id and is_published; if not found then raise exception 'puzzle_not_found' using errcode='P0002'; end if;
 insert into public.v2_player_stats(player_id) values(v_me) on conflict do nothing;
 select * into v_stats from public.v2_player_stats where player_id=v_me for update;
 v_before:=v_stats.puzzle_rating;
 if p_rated then
   v_delta:=case when p_success then greatest(4,least(18,10+round((v_puzzle.rating-v_before)/100.0)::integer)) else -greatest(4,least(14,8+round((v_before-v_puzzle.rating)/140.0)::integer)) end;
 else v_delta:=0; end if;
 v_after:=greatest(100,least(4000,v_before+v_delta));
 v_daily:=v_stats.daily_puzzle_streak;
 if p_success and v_puzzle.daily_date=current_date then
   if v_stats.last_daily_puzzle_date=current_date-1 then v_daily:=v_daily+1;
   elsif v_stats.last_daily_puzzle_date is distinct from current_date then v_daily:=1; end if;
 end if;
 insert into public.v2_puzzle_attempts(puzzle_id,player_id,success,mistakes,duration_ms,rating_before,rating_after)
 values(p_puzzle_id,v_me,p_success,greatest(0,coalesce(p_mistakes,0)),greatest(0,coalesce(p_duration_ms,0)),v_before,v_after);
 update public.v2_player_stats set puzzle_rating=v_after,puzzle_streak=case when p_success then puzzle_streak+1 else 0 end,daily_puzzle_streak=v_daily,last_daily_puzzle_date=case when p_success and v_puzzle.daily_date=current_date then current_date else last_daily_puzzle_date end,updated_at=clock_timestamp() where player_id=v_me;
 if p_success then insert into public.v2_user_achievements(player_id,achievement_id) values(v_me,'first_puzzle') on conflict do nothing; end if;
 return query select v_before,v_after,v_delta,v_daily;
end $$;

create or replace function public.v2_complete_lesson(p_lesson_id uuid,p_score integer default 100)
returns boolean language plpgsql security definer set search_path=public,private,auth as $$
declare v_me uuid; v_was boolean;
begin
 v_me:=private.v2_current_player_id();
 if not exists(select 1 from public.v2_lessons where id=p_lesson_id and is_published) then raise exception 'lesson_not_found' using errcode='P0002'; end if;
 select completed into v_was from public.v2_lesson_progress where player_id=v_me and lesson_id=p_lesson_id;
 insert into public.v2_lesson_progress(player_id,lesson_id,completed,score) values(v_me,p_lesson_id,true,greatest(0,least(100,p_score)))
 on conflict(player_id,lesson_id) do update set completed=true,score=greatest(v2_lesson_progress.score,excluded.score),updated_at=clock_timestamp();
 insert into public.v2_player_stats(player_id,lessons_completed) values(v_me,1) on conflict(player_id) do update set lessons_completed=v2_player_stats.lessons_completed+case when coalesce(v_was,false) then 0 else 1 end,updated_at=clock_timestamp();
 insert into public.v2_user_achievements(player_id,achievement_id) values(v_me,'first_lesson') on conflict do nothing;
 return true;
end $$;

create or replace function public.v2_create_club(p_name text,p_description text default '')
returns uuid language plpgsql security definer set search_path=public,private,auth as $$
declare v_me uuid; v_id uuid:=gen_random_uuid(); v_slug text;
begin
 v_me:=private.v2_current_player_id(); if v_me is null then raise exception 'player_profile_required' using errcode='42501'; end if;
 if char_length(trim(p_name))<2 or char_length(trim(p_name))>80 then raise exception 'invalid_club_name' using errcode='22023'; end if;
 v_slug:='club-'||substr(replace(v_id::text,'-',''),1,12);
 insert into public.v2_clubs(id,slug,name,description,owner_id) values(v_id,v_slug,trim(p_name),left(coalesce(p_description,''),1000),v_me);
 insert into public.v2_club_members(club_id,player_id,role,status) values(v_id,v_me,'owner','active');
 return v_id;
end $$;

create or replace function public.v2_join_club(p_club_id uuid)
returns text language plpgsql security definer set search_path=public,private,auth as $$
declare v_me uuid; v_public boolean;
begin
 v_me:=private.v2_current_player_id(); select is_public into v_public from public.v2_clubs where id=p_club_id; if not found then raise exception 'club_not_found' using errcode='P0002'; end if;
 insert into public.v2_club_members(club_id,player_id,role,status) values(p_club_id,v_me,'member',case when v_public then 'active' else 'pending' end)
 on conflict(club_id,player_id) do update set status=case when excluded.status='active' then 'active' else v2_club_members.status end;
 return case when v_public then 'active' else 'pending' end;
end $$;

create or replace function public.v2_post_club_message(p_club_id uuid,p_body text)
returns bigint language plpgsql security definer set search_path=public,private,auth as $$
declare v_me uuid; v_id bigint;
begin
 v_me:=private.v2_current_player_id(); if not exists(select 1 from public.v2_club_members where club_id=p_club_id and player_id=v_me and status='active') then raise exception 'club_membership_required' using errcode='42501'; end if;
 insert into public.v2_messages(sender_id,club_id,body) values(v_me,p_club_id,trim(p_body)) returning id into v_id; return v_id;
end $$;

create or replace function public.v2_send_message(p_recipient_id uuid,p_body text)
returns bigint language plpgsql security definer set search_path=public,private,auth as $$
declare v_me uuid; v_id bigint;
begin
 v_me:=private.v2_current_player_id();
 if v_me=p_recipient_id or exists(select 1 from public.v2_blocks where (blocker_id=v_me and blocked_id=p_recipient_id) or (blocker_id=p_recipient_id and blocked_id=v_me)) then raise exception 'message_not_allowed' using errcode='42501'; end if;
 insert into public.v2_messages(sender_id,recipient_id,body) values(v_me,p_recipient_id,trim(p_body)) returning id into v_id; return v_id;
end $$;

grant execute on function public.v2_send_friend_request(uuid) to authenticated;
grant execute on function public.v2_respond_friend_request(uuid,boolean) to authenticated;
grant execute on function public.v2_remove_friend(uuid) to authenticated;
grant execute on function public.v2_set_block(uuid,boolean) to authenticated;
grant execute on function public.v2_send_challenge(uuid,integer,integer,boolean,text) to authenticated;
grant execute on function public.v2_respond_challenge(uuid,boolean) to authenticated;
grant execute on function public.v2_mark_notification_read(uuid) to authenticated;
grant execute on function public.v2_submit_puzzle_attempt(uuid,boolean,integer,integer,boolean) to authenticated;
grant execute on function public.v2_complete_lesson(uuid,integer) to authenticated;
grant execute on function public.v2_create_club(text,text) to authenticated;
grant execute on function public.v2_join_club(uuid) to authenticated;
grant execute on function public.v2_post_club_message(uuid,text) to authenticated;
grant execute on function public.v2_send_message(uuid,text) to authenticated;

insert into public.v2_achievements(id,title,description,icon,sort_order) values
 ('first_game','أول مباراة','أكمل أول مباراة في شطرنج العرب.','♟',10),
 ('first_puzzle','أول لغز','حل أول لغز تكتيكي.','◆',20),
 ('first_lesson','أول درس','أكمل أول درس تدريبي.','▣',30),
 ('ten_wins','عشرة انتصارات','حقق عشرة انتصارات.','★',40),
 ('daily_week','أسبوع الألغاز','حافظ على سلسلة اللغز اليومي سبعة أيام.','⚡',50)
on conflict(id) do update set title=excluded.title,description=excluded.description,icon=excluded.icon,sort_order=excluded.sort_order;

insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,daily_date,is_published)
select 'مات في نقلة','rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2',array['d8h4'],array['mate','queen'],700,current_date,true
where not exists(select 1 from public.v2_puzzles where daily_date=current_date);
insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,is_published)
select 'عاقب إهمال الملك','r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',array['h5f7'],array['mate','attack'],850,true
where not exists(select 1 from public.v2_puzzles where fen='r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4');

insert into public.v2_lessons(slug,title,category,level,summary,body_md,sort_order) values
 ('move-the-pieces','كيف تتحرك القطع','basics','beginner','مدخل سريع لحركة القطع وقيمة كل قطعة.','ابدأ بفهم حركة الملك والوزير والرخ والفيل والحصان والبيدق. الهدف ليس حفظ الأسماء فقط، بل معرفة المربعات التي تسيطر عليها كل قطعة.',10),
 ('opening-principles','مبادئ الافتتاح','opening','beginner','السيطرة على الوسط وتطوير القطع وتأمين الملك.','في الافتتاح ركّز على ثلاثة أمور: السيطرة على الوسط، إخراج القطع الخفيفة، والتبييت مبكرًا. لا تحرك القطعة نفسها مرات كثيرة بلا سبب.',20),
 ('basic-tactics','التكتيك الأساسي','tactics','beginner','الشوكة والتثبيت والكشف.','التكتيك يبدأ بملاحظة القطع غير المحمية والتهديدات المباشرة. افحص دائمًا الكش والأخذ والتهديد قبل أي نقلة.',30),
 ('rook-endings','نهايات الرخ','endgame','intermediate','نشاط الملك والرخ خلف البيادق.','في نهايات الرخ يكون النشاط أهم من التمسك ببيدق واحد. ضع الرخ خلف البيدق المار، وفعّل الملك بسرعة.',40)
on conflict(slug) do update set title=excluded.title,category=excluded.category,level=excluded.level,summary=excluded.summary,body_md=excluded.body_md,sort_order=excluded.sort_order,is_published=true;