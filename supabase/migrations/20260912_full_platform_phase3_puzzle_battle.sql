-- Phase 3 Puzzle Battle: one server clock, shared deterministic sequence and server scoring.

create table if not exists public.v3_puzzle_battles (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'active' check(status in('active','finished','cancelled')),
  duration_seconds integer not null default 180 check(duration_seconds between 60 and 600),
  started_at timestamptz not null default clock_timestamp(),
  ends_at timestamptz not null default (clock_timestamp()+interval '3 minutes'),
  winner_player_id uuid references public.players(id) on delete set null,
  finished_at timestamptz,
  created_at timestamptz not null default clock_timestamp()
);

create table if not exists public.v3_puzzle_battle_players (
  battle_id uuid not null references public.v3_puzzle_battles(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  seat smallint not null check(seat in(1,2)),
  score integer not null default 0 check(score>=0),
  misses integer not null default 0 check(misses>=0),
  puzzle_index integer not null default 0 check(puzzle_index>=0),
  solution_step integer not null default 0 check(solution_step>=0),
  primary key(battle_id,player_id),
  unique(battle_id,seat)
);
create index if not exists v3_puzzle_battle_players_player_idx on public.v3_puzzle_battle_players(player_id,battle_id);

create table if not exists public.v3_puzzle_battle_puzzles (
  battle_id uuid not null references public.v3_puzzle_battles(id) on delete cascade,
  seq integer not null check(seq>0),
  puzzle_id uuid not null references public.v2_puzzles(id) on delete restrict,
  primary key(battle_id,seq)
);

create table if not exists public.v3_puzzle_battle_moves (
  id bigint generated always as identity primary key,
  battle_id uuid not null references public.v3_puzzle_battles(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  puzzle_id uuid not null references public.v2_puzzles(id) on delete restrict,
  solution_step integer not null check(solution_step>0),
  move_uci text not null check(move_uci ~ '^[a-h][1-8][a-h][1-8][qrbn]?$'),
  kind text not null check(kind in('player','reply')),
  correct boolean not null,
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists v3_puzzle_battle_moves_state_idx on public.v3_puzzle_battle_moves(battle_id,player_id,puzzle_id,id);

create table if not exists public.v3_puzzle_battle_queue (
  player_id uuid primary key references public.players(id) on delete cascade,
  joined_at timestamptz not null default clock_timestamp()
);

create table if not exists public.v3_puzzle_battle_ratings (
  player_id uuid primary key references public.players(id) on delete cascade,
  rating integer not null default 1200 check(rating between 100 and 4000),
  games_count integer not null default 0 check(games_count>=0),
  updated_at timestamptz not null default clock_timestamp()
);

alter table public.v3_puzzle_battles enable row level security;
alter table public.v3_puzzle_battle_players enable row level security;
alter table public.v3_puzzle_battle_puzzles enable row level security;
alter table public.v3_puzzle_battle_moves enable row level security;
alter table public.v3_puzzle_battle_queue enable row level security;
alter table public.v3_puzzle_battle_ratings enable row level security;
revoke all on public.v3_puzzle_battles,public.v3_puzzle_battle_players,public.v3_puzzle_battle_puzzles,public.v3_puzzle_battle_moves,public.v3_puzzle_battle_queue,public.v3_puzzle_battle_ratings from public,anon,authenticated;
grant select on public.v3_puzzle_battles,public.v3_puzzle_battle_players,public.v3_puzzle_battle_ratings to authenticated;
grant select on public.v3_puzzle_battle_puzzles,public.v3_puzzle_battle_moves,public.v3_puzzle_battle_queue to authenticated;

create policy v3_puzzle_battles_participant_read on public.v3_puzzle_battles for select to authenticated using(exists(select 1 from public.v3_puzzle_battle_players bp where bp.battle_id=id and bp.player_id=public.v2_my_player_id()));
create policy v3_puzzle_battle_players_participant_read on public.v3_puzzle_battle_players for select to authenticated using(exists(select 1 from public.v3_puzzle_battle_players mine where mine.battle_id=battle_id and mine.player_id=public.v2_my_player_id()));
create policy v3_puzzle_battle_puzzles_participant_read on public.v3_puzzle_battle_puzzles for select to authenticated using(exists(select 1 from public.v3_puzzle_battle_players mine where mine.battle_id=battle_id and mine.player_id=public.v2_my_player_id()));
create policy v3_puzzle_battle_moves_participant_read on public.v3_puzzle_battle_moves for select to authenticated using(exists(select 1 from public.v3_puzzle_battle_players mine where mine.battle_id=battle_id and mine.player_id=public.v2_my_player_id()));
create policy v3_puzzle_battle_queue_self_read on public.v3_puzzle_battle_queue for select to authenticated using(player_id=public.v2_my_player_id());
create policy v3_puzzle_battle_ratings_read on public.v3_puzzle_battle_ratings for select to authenticated using(true);

create or replace function private.v3_finalize_puzzle_battle(p_battle_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare b public.v3_puzzle_battles%rowtype; p1 public.v3_puzzle_battle_players%rowtype; p2 public.v3_puzzle_battle_players%rowtype; total integer; winner uuid; d1 integer:=0;d2 integer:=0;
begin
  select * into b from public.v3_puzzle_battles where id=p_battle_id for update;
  if b.id is null then return false; end if;
  if b.status='finished' then return true; end if;
  select count(*) into total from public.v3_puzzle_battle_puzzles where battle_id=b.id;
  select * into p1 from public.v3_puzzle_battle_players where battle_id=b.id and seat=1 for update;
  select * into p2 from public.v3_puzzle_battle_players where battle_id=b.id and seat=2 for update;
  if clock_timestamp()<b.ends_at and not(coalesce(p1.puzzle_index,0)>=total and coalesce(p2.puzzle_index,0)>=total) then return false; end if;
  if p1.score>p2.score then winner:=p1.player_id;d1:=10;d2:=-10;
  elsif p2.score>p1.score then winner:=p2.player_id;d1:=-10;d2:=10;
  else winner:=null; end if;
  insert into public.v3_puzzle_battle_ratings(player_id) values(p1.player_id),(p2.player_id) on conflict(player_id) do nothing;
  update public.v3_puzzle_battle_ratings set rating=greatest(100,rating+d1),games_count=games_count+1,updated_at=clock_timestamp() where player_id=p1.player_id;
  update public.v3_puzzle_battle_ratings set rating=greatest(100,rating+d2),games_count=games_count+1,updated_at=clock_timestamp() where player_id=p2.player_id;
  update public.v3_puzzle_battles set status='finished',winner_player_id=winner,finished_at=clock_timestamp() where id=b.id;
  return true;
end;$$;
revoke all on function private.v3_finalize_puzzle_battle(uuid) from public,anon,authenticated;

create or replace function public.v3_join_puzzle_battle()
returns table(battle_id uuid,status text,opponent_id uuid,ends_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare pid uuid; q public.v3_puzzle_battle_queue%rowtype; bid uuid; pc integer;
begin
  pid:=public.v2_my_player_id();if pid is null then raise exception 'authentication_required';end if;
  if not exists(select 1 from public.players p where p.id=pid and p.status='active' and not coalesce(p.is_synthetic,false)) then raise exception 'player_unavailable';end if;
  select b.id into bid from public.v3_puzzle_battles b join public.v3_puzzle_battle_players bp on bp.battle_id=b.id where bp.player_id=pid and b.status='active' order by b.started_at desc limit 1;
  if bid is not null then return query select b.id,b.status,opp.player_id,b.ends_at from public.v3_puzzle_battles b join public.v3_puzzle_battle_players me on me.battle_id=b.id and me.player_id=pid join public.v3_puzzle_battle_players opp on opp.battle_id=b.id and opp.player_id<>pid where b.id=bid;return;end if;
  insert into public.v3_puzzle_battle_queue(player_id,joined_at) values(pid,clock_timestamp()) on conflict(player_id) do update set joined_at=excluded.joined_at;
  select x.* into q from public.v3_puzzle_battle_queue x where x.player_id<>pid and not exists(select 1 from public.v3_puzzle_battles b join public.v3_puzzle_battle_players bp on bp.battle_id=b.id where b.status='active' and bp.player_id=x.player_id) order by x.joined_at for update skip locked limit 1;
  if q.player_id is null then return query select null::uuid,'waiting'::text,null::uuid,null::timestamptz;return;end if;
  insert into public.v3_puzzle_battles(status,duration_seconds,started_at,ends_at) values('active',180,clock_timestamp(),clock_timestamp()+interval '3 minutes') returning id into bid;
  insert into public.v3_puzzle_battle_players(battle_id,player_id,seat) values(bid,q.player_id,1),(bid,pid,2);
  insert into public.v3_puzzle_battle_puzzles(battle_id,seq,puzzle_id)
  select bid,row_number() over(order by z.sort_key)::integer,z.id from (select p.id,md5(p.id::text||bid::text) sort_key from public.v2_puzzles p where p.is_published order by md5(p.id::text||bid::text) limit 30) z;
  select count(*) into pc from public.v3_puzzle_battle_puzzles where battle_id=bid;
  if pc=0 then raise exception 'no_puzzles_available';end if;
  delete from public.v3_puzzle_battle_queue where player_id in(pid,q.player_id);
  return query select b.id,b.status,q.player_id,b.ends_at from public.v3_puzzle_battles b where b.id=bid;
end;$$;
revoke all on function public.v3_join_puzzle_battle() from public,anon;
grant execute on function public.v3_join_puzzle_battle() to authenticated;

create or replace function public.v3_get_puzzle_battle_state(p_battle_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare pid uuid;b public.v3_puzzle_battles%rowtype;me public.v3_puzzle_battle_players%rowtype;opp public.v3_puzzle_battle_players%rowtype;p public.v2_puzzles%rowtype;moves jsonb;opp_name text;my_rating integer;opp_rating integer;
begin
 pid:=public.v2_my_player_id();if pid is null then raise exception 'authentication_required';end if;
 select * into b from public.v3_puzzle_battles where id=p_battle_id;if b.id is null then raise exception 'battle_not_found';end if;
 select * into me from public.v3_puzzle_battle_players where battle_id=b.id and player_id=pid;if me.player_id is null then raise exception 'not_participant';end if;
 select * into opp from public.v3_puzzle_battle_players where battle_id=b.id and player_id<>pid;
 if b.status='active' and clock_timestamp()>=b.ends_at then perform private.v3_finalize_puzzle_battle(b.id);select * into b from public.v3_puzzle_battles where id=b.id;end if;
 select vp.* into p from public.v3_puzzle_battle_puzzles bp join public.v2_puzzles vp on vp.id=bp.puzzle_id where bp.battle_id=b.id and bp.seq=me.puzzle_index+1;
 select coalesce(jsonb_agg(jsonb_build_object('move',x.move_uci,'kind',x.kind,'correct',x.correct) order by x.id),'[]'::jsonb) into moves from public.v3_puzzle_battle_moves x where x.battle_id=b.id and x.player_id=pid and (p.id is null or x.puzzle_id=p.id);
 select name into opp_name from public.players where id=opp.player_id;
 select rating into my_rating from public.v3_puzzle_battle_ratings where player_id=pid;select rating into opp_rating from public.v3_puzzle_battle_ratings where player_id=opp.player_id;
 return jsonb_build_object('battleId',b.id,'status',b.status,'endsAt',b.ends_at,'winnerPlayerId',b.winner_player_id,'score',me.score,'misses',me.misses,'opponentScore',opp.score,'opponentMisses',opp.misses,'opponentId',opp.player_id,'opponentName',opp_name,'rating',coalesce(my_rating,1200),'opponentRating',coalesce(opp_rating,1200),'puzzleIndex',me.puzzle_index,'solutionStep',me.solution_step,'puzzle',case when p.id is null then null else jsonb_build_object('id',p.id,'title',p.title,'fen',p.fen,'rating',p.rating,'themes',p.themes) end,'moves',moves);
end;$$;
revoke all on function public.v3_get_puzzle_battle_state(uuid) from public,anon;
grant execute on function public.v3_get_puzzle_battle_state(uuid) to authenticated;

create or replace function public.v3_puzzle_battle_move(p_battle_id uuid,p_move_uci text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare pid uuid;b public.v3_puzzle_battles%rowtype;me public.v3_puzzle_battle_players%rowtype;p public.v2_puzzles%rowtype;expected text;reply_move text;consumed integer;total integer;correct boolean;
begin
 pid:=public.v2_my_player_id();if pid is null then raise exception 'authentication_required';end if;
 if p_move_uci is null or p_move_uci !~ '^[a-h][1-8][a-h][1-8][qrbn]?$' then raise exception 'invalid_move';end if;
 select * into b from public.v3_puzzle_battles where id=p_battle_id for update;if b.id is null then raise exception 'battle_not_found';end if;
 select * into me from public.v3_puzzle_battle_players where battle_id=b.id and player_id=pid for update;if me.player_id is null then raise exception 'not_participant';end if;
 if b.status<>'active' or clock_timestamp()>=b.ends_at then perform private.v3_finalize_puzzle_battle(b.id);return public.v3_get_puzzle_battle_state(b.id);end if;
 select vp.* into p from public.v3_puzzle_battle_puzzles bp join public.v2_puzzles vp on vp.id=bp.puzzle_id where bp.battle_id=b.id and bp.seq=me.puzzle_index+1;
 if p.id is null then perform private.v3_finalize_puzzle_battle(b.id);return public.v3_get_puzzle_battle_state(b.id);end if;
 expected:=p.solution_uci[me.solution_step+1];correct:=lower(p_move_uci)=lower(expected);
 insert into public.v3_puzzle_battle_moves(battle_id,player_id,puzzle_id,solution_step,move_uci,kind,correct) values(b.id,pid,p.id,me.solution_step+1,lower(p_move_uci),'player',correct);
 if not correct then
   update public.v3_puzzle_battle_players set misses=misses+1,puzzle_index=puzzle_index+1,solution_step=0 where battle_id=b.id and player_id=pid;
 else
   consumed:=me.solution_step+1;
   if consumed<cardinality(p.solution_uci) then
     reply_move:=p.solution_uci[consumed+1];
     insert into public.v3_puzzle_battle_moves(battle_id,player_id,puzzle_id,solution_step,move_uci,kind,correct) values(b.id,pid,p.id,consumed+1,lower(reply_move),'reply',true);
     consumed:=consumed+1;
   end if;
   if consumed>=cardinality(p.solution_uci) then update public.v3_puzzle_battle_players set score=score+1,puzzle_index=puzzle_index+1,solution_step=0 where battle_id=b.id and player_id=pid;
   else update public.v3_puzzle_battle_players set solution_step=consumed where battle_id=b.id and player_id=pid;end if;
 end if;
 select count(*) into total from public.v3_puzzle_battle_puzzles where battle_id=b.id;
 if not exists(select 1 from public.v3_puzzle_battle_players bp where bp.battle_id=b.id and bp.puzzle_index<total) then perform private.v3_finalize_puzzle_battle(b.id);end if;
 return public.v3_get_puzzle_battle_state(b.id);
end;$$;
revoke all on function public.v3_puzzle_battle_move(uuid,text) from public,anon;
grant execute on function public.v3_puzzle_battle_move(uuid,text) to authenticated;

create or replace function public.v3_cancel_puzzle_battle_queue()
returns boolean language plpgsql security definer set search_path='' as $$declare pid uuid;begin pid:=public.v2_my_player_id();if pid is null then raise exception 'authentication_required';end if;delete from public.v3_puzzle_battle_queue where player_id=pid;return found;end;$$;
revoke all on function public.v3_cancel_puzzle_battle_queue() from public,anon;
grant execute on function public.v3_cancel_puzzle_battle_queue() to authenticated;
