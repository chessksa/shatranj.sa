-- Phase 3 puzzle security: hide solution arrays and make attempt scoring server-authoritative.

revoke select on table public.v2_puzzles from anon,authenticated;
revoke all on function public.v2_submit_puzzle_attempt(uuid,boolean,integer,integer,boolean) from public,anon,authenticated;

create table if not exists private.v3_puzzle_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  puzzle_id uuid not null references public.v2_puzzles(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  session_secret text not null,
  mode text not null check(mode in ('rated','daily','custom','rush')),
  rated boolean not null default false,
  solution_step integer not null default 0 check(solution_step>=0),
  mistakes integer not null default 0 check(mistakes>=0),
  completed boolean not null default false,
  success boolean,
  started_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp()+interval '30 minutes'),
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists v3_puzzle_sessions_player_idx on private.v3_puzzle_sessions(player_id,created_at desc);
create index if not exists v3_puzzle_sessions_expiry_idx on private.v3_puzzle_sessions(expires_at);
revoke all on table private.v3_puzzle_sessions from public,anon,authenticated;

create or replace function public.v3_start_puzzle_session(
  p_mode text default 'rated',
  p_theme text default null
) returns table(
  session_id uuid,
  session_secret text,
  title text,
  fen text,
  rating integer,
  themes text[],
  daily_date date
)
language plpgsql security definer set search_path='' as $$
declare
  me uuid;
  p public.v2_puzzles%rowtype;
  sid uuid;
  secret text;
  mode_value text:=lower(coalesce(p_mode,'rated'));
begin
  if mode_value not in ('rated','daily','custom','rush') then raise exception 'invalid_puzzle_mode'; end if;
  me:=private.v2_current_player_id();

  if mode_value='daily' then
    select * into p from public.v2_puzzles x
    where x.is_published and x.daily_date=current_date
    order by x.created_at desc limit 1;
  else
    select * into p from public.v2_puzzles x
    where x.is_published
      and x.daily_date is null
      and (mode_value<>'custom' or nullif(btrim(coalesce(p_theme,'')),'') is null or btrim(p_theme)=any(x.themes))
    order by random() limit 1;
    if p.id is null then
      select * into p from public.v2_puzzles x
      where x.is_published
        and (mode_value<>'custom' or nullif(btrim(coalesce(p_theme,'')),'') is null or btrim(p_theme)=any(x.themes))
      order by random() limit 1;
    end if;
  end if;

  if p.id is null then raise exception 'puzzle_not_found'; end if;
  secret:=encode(extensions.gen_random_bytes(24),'hex');
  insert into private.v3_puzzle_sessions(puzzle_id,player_id,session_secret,mode,rated,expires_at)
  values(p.id,me,secret,mode_value,mode_value='rated',clock_timestamp()+interval '30 minutes')
  returning id into sid;

  return query select sid,secret,p.title,p.fen,p.rating,p.themes,p.daily_date;
end;$$;
revoke all on function public.v3_start_puzzle_session(text,text) from public;
grant execute on function public.v3_start_puzzle_session(text,text) to anon,authenticated;

create or replace function public.v3_submit_puzzle_session_move(
  p_session_id uuid,
  p_session_secret text,
  p_move_uci text
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  s private.v3_puzzle_sessions%rowtype;
  p public.v2_puzzles%rowtype;
  me uuid;
  expected text;
  reply_move text;
  consumed integer;
  is_correct boolean;
  should_finish boolean:=false;
  finish_success boolean:=false;
  duration_ms integer;
  rating_before integer;
  rating_after integer;
  delta integer;
  daily_streak integer;
begin
  if p_move_uci is null or lower(p_move_uci) !~ '^[a-h][1-8][a-h][1-8][qrbn]?$' then raise exception 'invalid_move'; end if;
  select * into s from private.v3_puzzle_sessions where id=p_session_id for update;
  if s.id is null or s.session_secret is distinct from p_session_secret then raise exception 'puzzle_session_not_found'; end if;
  if s.completed then raise exception 'puzzle_session_completed'; end if;
  if s.expires_at<=clock_timestamp() then raise exception 'puzzle_session_expired'; end if;
  me:=private.v2_current_player_id();
  if s.player_id is not null and me is distinct from s.player_id then raise exception 'puzzle_session_not_owned'; end if;

  select * into p from public.v2_puzzles where id=s.puzzle_id and is_published;
  if p.id is null then raise exception 'puzzle_not_found'; end if;
  expected:=lower(p.solution_uci[s.solution_step+1]);
  if expected is null then raise exception 'puzzle_state_invalid'; end if;
  is_correct:=lower(p_move_uci)=expected;

  if not is_correct then
    s.mistakes:=s.mistakes+1;
    if s.mode='daily' and s.mistakes<5 then
      update private.v3_puzzle_sessions set mistakes=s.mistakes where id=s.id;
    else
      should_finish:=true;
      finish_success:=false;
      update private.v3_puzzle_sessions set mistakes=s.mistakes,completed=true,success=false where id=s.id;
    end if;
  else
    consumed:=s.solution_step+1;
    if consumed<cardinality(p.solution_uci) then
      reply_move:=lower(p.solution_uci[consumed+1]);
      consumed:=consumed+1;
    end if;
    if consumed>=cardinality(p.solution_uci) then
      should_finish:=true;
      finish_success:=true;
      update private.v3_puzzle_sessions set solution_step=consumed,completed=true,success=true where id=s.id;
    else
      update private.v3_puzzle_sessions set solution_step=consumed where id=s.id;
    end if;
  end if;

  if should_finish and s.player_id is not null then
    duration_ms:=greatest(0,least(2147483647,round(extract(epoch from(clock_timestamp()-s.started_at))*1000)::bigint))::integer;
    select a.rating_before,a.rating_after,a.delta,a.daily_streak
      into rating_before,rating_after,delta,daily_streak
    from public.v2_submit_puzzle_attempt(p.id,finish_success,s.mistakes,duration_ms,s.rated) a;
  end if;

  return jsonb_build_object(
    'correct',is_correct,
    'replyMove',reply_move,
    'completed',should_finish,
    'success',case when should_finish then finish_success else null end,
    'mistakes',s.mistakes,
    'ratingBefore',rating_before,
    'ratingAfter',rating_after,
    'delta',delta,
    'dailyStreak',daily_streak
  );
end;$$;
revoke all on function public.v3_submit_puzzle_session_move(uuid,text,text) from public;
grant execute on function public.v3_submit_puzzle_session_move(uuid,text,text) to anon,authenticated;

create or replace function public.v3_restart_puzzle_session(
  p_session_id uuid,
  p_session_secret text
) returns boolean
language plpgsql security definer set search_path='' as $$
declare s private.v3_puzzle_sessions%rowtype;me uuid;
begin
  select * into s from private.v3_puzzle_sessions where id=p_session_id for update;
  if s.id is null or s.session_secret is distinct from p_session_secret then raise exception 'puzzle_session_not_found'; end if;
  me:=private.v2_current_player_id();
  if s.player_id is not null and me is distinct from s.player_id then raise exception 'puzzle_session_not_owned'; end if;
  if s.completed then return false; end if;
  update private.v3_puzzle_sessions set solution_step=0,mistakes=0,started_at=clock_timestamp(),expires_at=clock_timestamp()+interval '30 minutes' where id=s.id;
  return true;
end;$$;
revoke all on function public.v3_restart_puzzle_session(uuid,text) from public;
grant execute on function public.v3_restart_puzzle_session(uuid,text) to anon,authenticated;
