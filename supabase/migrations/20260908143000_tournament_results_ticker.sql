-- Store the public tournament winner on the tournament row so the home ticker can read it efficiently.

alter table public.tournaments
  add column if not exists winner_player_id uuid references public.players(id) on delete set null;

alter table public.tournaments
  add column if not exists finished_at timestamptz;

create index if not exists tournaments_finished_ticker_idx
  on public.tournaments(finished_at desc)
  where status = 'finished' and winner_player_id is not null;

create index if not exists tournaments_winner_player_idx
  on public.tournaments(winner_player_id)
  where winner_player_id is not null;

create or replace function private.sync_tournament_winner_to_public()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.winner_player_id is null or new.status not in ('finished','bye') then
    return new;
  end if;

  -- A match is the final when there is no parent match in the following round.
  if exists (
    select 1
    from private.tournament_matches parent
    where parent.tournament_id = new.tournament_id
      and parent.round_no = new.round_no + 1
      and parent.match_no = ((new.match_no + 1) / 2)::integer
  ) then
    return new;
  end if;

  update public.tournaments
     set winner_player_id = new.winner_player_id,
         finished_at = coalesce(new.finished_at, clock_timestamp()),
         status = 'finished'
   where id = new.tournament_id;

  return new;
end;
$$;

revoke all on function private.sync_tournament_winner_to_public() from public, anon, authenticated;

drop trigger if exists trg_sync_tournament_winner_to_public on private.tournament_matches;
create trigger trg_sync_tournament_winner_to_public
after insert or update of winner_player_id,status,finished_at on private.tournament_matches
for each row
execute function private.sync_tournament_winner_to_public();

-- Backfill any tournaments that finished before this migration.
with finals as (
  select distinct on (tm.tournament_id)
         tm.tournament_id,
         tm.winner_player_id,
         tm.finished_at
  from private.tournament_matches tm
  where tm.winner_player_id is not null
    and tm.status in ('finished','bye')
    and not exists (
      select 1
      from private.tournament_matches parent
      where parent.tournament_id = tm.tournament_id
        and parent.round_no = tm.round_no + 1
        and parent.match_no = ((tm.match_no + 1) / 2)::integer
    )
  order by tm.tournament_id, tm.round_no desc, tm.match_no
)
update public.tournaments t
   set winner_player_id = f.winner_player_id,
       finished_at = coalesce(f.finished_at, t.registration_closes_at, t.starts_at, t.created_at)
  from finals f
 where t.id = f.tournament_id
   and t.status = 'finished';
