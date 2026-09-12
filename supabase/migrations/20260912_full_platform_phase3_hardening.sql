-- Phase 3 hardening: explicit no-direct-read moderation policy and automatic variant achievements.

drop policy if exists v3_moderation_actions_no_direct_read on public.v3_moderation_actions;
create policy v3_moderation_actions_no_direct_read
  on public.v3_moderation_actions
  for select to authenticated
  using (false);

insert into public.v2_achievements(id,title,description,icon,sort_order) values
  ('threecheck_first','Three-Check','أكمل أول مباراة Three-Check','3+',220),
  ('koth_first','ملك التل','أكمل أول مباراة King of the Hill','♔',230)
on conflict(id) do update set title=excluded.title,description=excluded.description,icon=excluded.icon,sort_order=excluded.sort_order;

create or replace function private.v3_award_finished_variant_achievements()
returns trigger
language plpgsql security definer set search_path='' as $$
declare achievement text;
begin
  if new.status<>'finished' or old.status='finished' then return new; end if;
  achievement:=case new.variant
    when 'threecheck' then 'threecheck_first'
    when 'kingofthehill' then 'koth_first'
    else null
  end;
  if achievement is not null then
    insert into public.v2_user_achievements(player_id,achievement_id)
    values(new.white_player_id,achievement),(new.black_player_id,achievement)
    on conflict(player_id,achievement_id) do nothing;
  end if;
  return new;
end;$$;
revoke all on function private.v3_award_finished_variant_achievements() from public,anon,authenticated;

drop trigger if exists v3_variant_finished_achievements on public.v3_variant_games;
create trigger v3_variant_finished_achievements
after update of status on public.v3_variant_games
for each row execute function private.v3_award_finished_variant_achievements();
