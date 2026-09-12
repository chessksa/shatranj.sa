-- Phase 5: account/privacy preferences enforced by server-side social RPCs.

create table if not exists public.v5_user_settings (
  player_id uuid primary key references public.players(id) on delete cascade,
  allow_challenges text not null default 'everyone' check (allow_challenges in ('everyone','friends','nobody')),
  allow_messages text not null default 'everyone' check (allow_messages in ('everyone','friends','nobody')),
  show_online boolean not null default true,
  site_notifications boolean not null default true,
  sound_enabled boolean not null default true,
  language text not null default 'ar' check (language in ('ar','en')),
  timezone text not null default 'Asia/Riyadh' check (char_length(timezone) between 1 and 64),
  updated_at timestamptz not null default clock_timestamp()
);

alter table public.v5_user_settings enable row level security;
revoke all on table public.v5_user_settings from public, anon, authenticated;

create or replace function public.v5_get_my_settings()
returns table(
  allow_challenges text,
  allow_messages text,
  show_online boolean,
  site_notifications boolean,
  sound_enabled boolean,
  language text,
  timezone text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path to 'public','private','auth'
as $$
declare
  v_me uuid;
begin
  v_me:=private.v2_current_player_id();
  if v_me is null then
    raise exception 'player_profile_required' using errcode='42501';
  end if;

  insert into public.v5_user_settings(player_id)
  values(v_me)
  on conflict(player_id) do nothing;

  return query
  select s.allow_challenges,s.allow_messages,s.show_online,s.site_notifications,
         s.sound_enabled,s.language,s.timezone,s.updated_at
  from public.v5_user_settings s
  where s.player_id=v_me;
end;
$$;

create or replace function public.v5_update_my_settings(
  p_allow_challenges text,
  p_allow_messages text,
  p_show_online boolean,
  p_site_notifications boolean,
  p_sound_enabled boolean,
  p_language text,
  p_timezone text
)
returns table(
  allow_challenges text,
  allow_messages text,
  show_online boolean,
  site_notifications boolean,
  sound_enabled boolean,
  language text,
  timezone text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path to 'public','private','auth'
as $$
declare
  v_me uuid;
  v_timezone text:=coalesce(nullif(trim(p_timezone),''),'Asia/Riyadh');
begin
  v_me:=private.v2_current_player_id();
  if v_me is null then
    raise exception 'player_profile_required' using errcode='42501';
  end if;
  if p_allow_challenges not in ('everyone','friends','nobody') then
    raise exception 'invalid_challenge_privacy' using errcode='22023';
  end if;
  if p_allow_messages not in ('everyone','friends','nobody') then
    raise exception 'invalid_message_privacy' using errcode='22023';
  end if;
  if p_language not in ('ar','en') then
    raise exception 'invalid_language' using errcode='22023';
  end if;
  if char_length(v_timezone)>64 then
    raise exception 'invalid_timezone' using errcode='22023';
  end if;

  insert into public.v5_user_settings(
    player_id,allow_challenges,allow_messages,show_online,site_notifications,
    sound_enabled,language,timezone,updated_at
  ) values(
    v_me,p_allow_challenges,p_allow_messages,coalesce(p_show_online,true),
    coalesce(p_site_notifications,true),coalesce(p_sound_enabled,true),
    p_language,v_timezone,clock_timestamp()
  )
  on conflict(player_id) do update set
    allow_challenges=excluded.allow_challenges,
    allow_messages=excluded.allow_messages,
    show_online=excluded.show_online,
    site_notifications=excluded.site_notifications,
    sound_enabled=excluded.sound_enabled,
    language=excluded.language,
    timezone=excluded.timezone,
    updated_at=excluded.updated_at;

  return query
  select s.allow_challenges,s.allow_messages,s.show_online,s.site_notifications,
         s.sound_enabled,s.language,s.timezone,s.updated_at
  from public.v5_user_settings s
  where s.player_id=v_me;
end;
$$;

revoke all on function public.v5_get_my_settings() from public,anon;
revoke all on function public.v5_update_my_settings(text,text,boolean,boolean,boolean,text,text) from public,anon;
grant execute on function public.v5_get_my_settings() to authenticated;
grant execute on function public.v5_update_my_settings(text,text,boolean,boolean,boolean,text,text) to authenticated;

create or replace function public.v2_send_challenge(
  p_target_player_id uuid,
  p_base_seconds integer default 600,
  p_increment_seconds integer default 0,
  p_rated boolean default true,
  p_variant text default 'standard'
)
returns uuid
language plpgsql
security definer
set search_path to 'public','private','auth'
as $$
declare
  v_me uuid;
  v_id uuid;
  v_policy text:='everyone';
  v_notify boolean:=true;
begin
  v_me:=private.v2_current_player_id();
  if v_me is null or p_target_player_id is null or v_me=p_target_player_id then
    raise exception 'invalid_target' using errcode='22023';
  end if;
  if p_base_seconds not between 30 and 86400 or p_increment_seconds not between 0 and 60 then
    raise exception 'invalid_time_control' using errcode='22023';
  end if;
  if p_variant not in ('standard','chess960') then
    raise exception 'unsupported_variant' using errcode='22023';
  end if;
  if exists(
    select 1 from public.v2_blocks
    where (blocker_id=v_me and blocked_id=p_target_player_id)
       or (blocker_id=p_target_player_id and blocked_id=v_me)
  ) then
    raise exception 'blocked' using errcode='42501';
  end if;

  select s.allow_challenges,s.site_notifications
  into v_policy,v_notify
  from public.v5_user_settings s
  where s.player_id=p_target_player_id;
  v_policy:=coalesce(v_policy,'everyone');
  v_notify:=coalesce(v_notify,true);

  if v_policy='nobody' then
    raise exception 'challenge_not_allowed' using errcode='42501';
  end if;
  if v_policy='friends' and not exists(
    select 1 from public.v2_friendships f
    where f.status='accepted'
      and ((f.requester_id=v_me and f.addressee_id=p_target_player_id)
        or (f.requester_id=p_target_player_id and f.addressee_id=v_me))
  ) then
    raise exception 'challenge_not_allowed' using errcode='42501';
  end if;

  update public.v2_challenges
  set status='expired',updated_at=clock_timestamp()
  where status='pending' and expires_at<=clock_timestamp();

  insert into public.v2_challenges(
    challenger_id,challenged_id,base_seconds,increment_seconds,rated,variant,challenge_type
  ) values(
    v_me,p_target_player_id,p_base_seconds,p_increment_seconds,p_rated,p_variant,'direct'
  ) returning id into v_id;

  if v_notify then
    insert into public.v2_notifications(player_id,kind,title,body,href)
    values(p_target_player_id,'challenge','تحدٍ جديد','دعاك لاعب إلى مباراة.','community.html');
  end if;
  return v_id;
end;
$$;

create or replace function public.v2_send_message(p_recipient_id uuid,p_body text)
returns bigint
language plpgsql
security definer
set search_path to 'public','private','auth'
as $$
declare
  v_me uuid;
  v_id bigint;
  v_policy text:='everyone';
begin
  v_me:=private.v2_current_player_id();
  if v_me is null or p_recipient_id is null or v_me=p_recipient_id then
    raise exception 'message_not_allowed' using errcode='42501';
  end if;
  if char_length(trim(coalesce(p_body,''))) not between 1 and 2000 then
    raise exception 'invalid_message' using errcode='22023';
  end if;
  if exists(
    select 1 from public.v2_blocks
    where (blocker_id=v_me and blocked_id=p_recipient_id)
       or (blocker_id=p_recipient_id and blocked_id=v_me)
  ) then
    raise exception 'message_not_allowed' using errcode='42501';
  end if;

  select s.allow_messages into v_policy
  from public.v5_user_settings s
  where s.player_id=p_recipient_id;
  v_policy:=coalesce(v_policy,'everyone');

  if v_policy='nobody' then
    raise exception 'message_not_allowed' using errcode='42501';
  end if;
  if v_policy='friends' and not exists(
    select 1 from public.v2_friendships f
    where f.status='accepted'
      and ((f.requester_id=v_me and f.addressee_id=p_recipient_id)
        or (f.requester_id=p_recipient_id and f.addressee_id=v_me))
  ) then
    raise exception 'message_not_allowed' using errcode='42501';
  end if;

  insert into public.v2_messages(sender_id,recipient_id,body)
  values(v_me,p_recipient_id,trim(p_body))
  returning id into v_id;
  return v_id;
end;
$$;
