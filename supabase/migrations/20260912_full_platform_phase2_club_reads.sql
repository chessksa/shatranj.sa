create or replace function public.v2_list_clubs(p_limit integer default 100)
returns table(id uuid,slug text,name text,description text,owner_id uuid,owner_name text,is_public boolean,member_count bigint,my_status text)
language sql stable security definer set search_path=public,private,auth as $$
  with me as (select private.v2_current_player_id() id)
  select c.id,c.slug,c.name,c.description,c.owner_id,p.name,c.is_public,
    (select count(*) from public.v2_club_members cm where cm.club_id=c.id and cm.status='active') as member_count,
    (select cm.status from public.v2_club_members cm,me where cm.club_id=c.id and cm.player_id=me.id limit 1) as my_status
  from public.v2_clubs c join public.players p on p.id=c.owner_id
  where c.is_public or c.owner_id=(select id from me) or exists(select 1 from public.v2_club_members cm,me where cm.club_id=c.id and cm.player_id=me.id)
  order by member_count desc,c.created_at desc limit greatest(1,least(coalesce(p_limit,100),200));
$$;

create or replace function public.v2_get_club(p_club_id uuid)
returns table(id uuid,slug text,name text,description text,owner_id uuid,owner_name text,is_public boolean,member_count bigint,my_role text,my_status text)
language sql stable security definer set search_path=public,private,auth as $$
  with me as (select private.v2_current_player_id() id)
  select c.id,c.slug,c.name,c.description,c.owner_id,p.name,c.is_public,
    (select count(*) from public.v2_club_members cm where cm.club_id=c.id and cm.status='active') as member_count,
    (select cm.role from public.v2_club_members cm,me where cm.club_id=c.id and cm.player_id=me.id limit 1) as my_role,
    (select cm.status from public.v2_club_members cm,me where cm.club_id=c.id and cm.player_id=me.id limit 1) as my_status
  from public.v2_clubs c join public.players p on p.id=c.owner_id
  where c.id=p_club_id and (c.is_public or c.owner_id=(select id from me) or exists(select 1 from public.v2_club_members cm,me where cm.club_id=c.id and cm.player_id=me.id));
$$;

create or replace function public.v2_list_club_members(p_club_id uuid)
returns table(player_id uuid,name text,rating integer,country text,city text,role text,joined_at timestamptz)
language sql stable security definer set search_path=public,private,auth as $$
  select p.id,p.name,p.rating,p.country,p.city,cm.role,cm.joined_at
  from public.v2_club_members cm join public.players p on p.id=cm.player_id
  where cm.club_id=p_club_id and cm.status='active'
  order by case cm.role when 'owner' then 0 when 'admin' then 1 else 2 end,p.rating desc,p.name;
$$;

create or replace function public.v2_list_club_messages(p_club_id uuid,p_limit integer default 150)
returns table(id bigint,sender_id uuid,sender_name text,body text,created_at timestamptz)
language plpgsql stable security definer set search_path=public,private,auth as $$
declare v_me uuid;
begin
  v_me:=private.v2_current_player_id();
  if not exists(select 1 from public.v2_club_members where club_id=p_club_id and player_id=v_me and status='active') then raise exception 'club_membership_required' using errcode='42501'; end if;
  return query select m.id,m.sender_id,p.name,m.body,m.created_at from public.v2_messages m join public.players p on p.id=m.sender_id where m.club_id=p_club_id order by m.created_at asc limit greatest(1,least(coalesce(p_limit,150),300));
end $$;

revoke all on function public.v2_list_clubs(integer) from public,anon;
revoke all on function public.v2_get_club(uuid) from public,anon;
revoke all on function public.v2_list_club_members(uuid) from public,anon;
revoke all on function public.v2_list_club_messages(uuid,integer) from public,anon;
grant execute on function public.v2_list_clubs(integer) to authenticated;
grant execute on function public.v2_get_club(uuid) to authenticated;
grant execute on function public.v2_list_club_members(uuid) to authenticated;
grant execute on function public.v2_list_club_messages(uuid,integer) to authenticated;
