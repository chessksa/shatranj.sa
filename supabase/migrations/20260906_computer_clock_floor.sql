create or replace function public.enforce_computer_clock_floor()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_floor_ms bigint;
  v_old_moves integer;
  v_new_moves integer;
  v_actual_drop bigint;
begin
  if old.computer_time_ms is null or new.computer_time_ms is null then
    return new;
  end if;

  v_old_moves := jsonb_array_length(coalesce(old.moves, '[]'::jsonb));
  v_new_moves := jsonb_array_length(coalesce(new.moves, '[]'::jsonb));

  if v_new_moves - v_old_moves < 2 then
    return new;
  end if;

  v_floor_ms := case new.level
    when 'easy' then 900
    when 'medium' then 1200
    when 'hard' then 1600
    else 900
  end;

  v_actual_drop := old.computer_time_ms - new.computer_time_ms;
  if v_actual_drop < v_floor_ms then
    new.computer_time_ms := greatest(0, old.computer_time_ms - v_floor_ms);
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_computer_clock_floor() from public, anon, authenticated;
grant execute on function public.enforce_computer_clock_floor() to service_role;

drop trigger if exists computer_clock_floor on public.computer_games;
create trigger computer_clock_floor
before update of moves, computer_time_ms on public.computer_games
for each row
execute function public.enforce_computer_clock_floor();