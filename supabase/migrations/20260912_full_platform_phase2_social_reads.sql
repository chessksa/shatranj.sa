create or replace function public.v2_get_my_profile()
returns table(id uuid,name text,country text,region text,city text,rating integer,games_count integer,wins integer,draws integer,losses integer,status text)
language sql stable security definer set search_path=public,private,auth as $$
  select p.id,p.name,p.country,p.region,p.city,p.rating,p.games_count,p.wins,p.draws,p.losses,p.status
  from public.players p where p.id=private.v2_current_player_id() limit 1;
$$;

create or replace function public.v2_search_players(p_query text,p_limit integer default 20)
returns table(id uuid,name text,country text,city text,rating integer,games_count integer)
language sql stable security definer set search_path=public,private,auth as $$
  with me as (select private.v2_current_player_id() id)
  select p.id,p.name,p.country,p.city,p.rating,p.games_count
  from public.players p,me
  where me.id is not null and p.id<>me.id
    and coalesce(p.is_synthetic,false)=false
    and coalesce(p.status,'') not in ('banned','suspended','inactive')
    and (coalesce(trim(p_query),'')='' or lower(p.name) like '%'||lower(trim(p_query))||'%' or lower(coalesce(p.city,'')) like '%'||lower(trim(p_query))||'%')
    and not exists(select 1 from public.v2_blocks b where (b.blocker_id=me.id and b.blocked_id=p.id) or (b.blocker_id=p.id and b.blocked_id=me.id))
  order by p.rating desc,p.name asc limit greatest(1,least(coalesce(p_limit,20),50));
$$;

create or replace function public.v2_list_friends()
returns table(friendship_id uuid,player_id uuid,name text,country text,city text,rating integer,accepted_at timestamptz)
language sql stable security definer set search_path=public,private,auth as $$
  with me as (select private.v2_current_player_id() id), f as (
    select vf.id,case when vf.requester_id=me.id then vf.addressee_id else vf.requester_id end other_id,vf.updated_at
    from public.v2_friendships vf,me where vf.status='accepted' and me.id in (vf.requester_id,vf.addressee_id)
  )
  select f.id,p.id,p.name,p.country,p.city,p.rating,f.updated_at from f join public.players p on p.id=f.other_id order by p.name;
$$;

create or replace function public.v2_list_friend_requests()
returns table(friendship_id uuid,player_id uuid,name text,country text,city text,rating integer,created_at timestamptz)
language sql stable security definer set search_path=public,private,auth as $$
  with me as (select private.v2_current_player_id() id)
  select f.id,p.id,p.name,p.country,p.city,p.rating,f.created_at
  from public.v2_friendships f join me on f.addressee_id=me.id join public.players p on p.id=f.requester_id
  where f.status='pending' order by f.created_at desc;
$$;

create or replace function public.v2_list_challenges()
returns table(challenge_id uuid,direction text,opponent_id uuid,opponent_name text,opponent_rating integer,base_seconds integer,increment_seconds integer,rated boolean,variant text,status text,game_id uuid,created_at timestamptz,expires_at timestamptz)
language sql stable security definer set search_path=public,private,auth as $$
  with me as (select private.v2_current_player_id() id)
  select c.id,case when c.challenger_id=me.id then 'outgoing' else 'incoming' end,
    case when c.challenger_id=me.id then c.challenged_id else c.challenger_id end,
    p.name,p.rating,c.base_seconds,c.increment_seconds,c.rated,c.variant,c.status,c.game_id,c.created_at,c.expires_at
  from public.v2_challenges c join me on me.id in (c.challenger_id,c.challenged_id)
  join public.players p on p.id=case when c.challenger_id=me.id then c.challenged_id else c.challenger_id end
  where c.created_at>clock_timestamp()-interval '30 days'
  order by c.created_at desc limit 100;
$$;

create or replace function public.v2_list_notifications(p_limit integer default 50)
returns table(id uuid,kind text,title text,body text,href text,read_at timestamptz,created_at timestamptz)
language sql stable security definer set search_path=public,private,auth as $$
  select n.id,n.kind,n.title,n.body,n.href,n.read_at,n.created_at
  from public.v2_notifications n where n.player_id=private.v2_current_player_id()
  order by n.created_at desc limit greatest(1,least(coalesce(p_limit,50),100));
$$;

create or replace function public.v2_list_direct_messages(p_other_player_id uuid,p_limit integer default 100)
returns table(id bigint,sender_id uuid,recipient_id uuid,body text,created_at timestamptz)
language sql stable security definer set search_path=public,private,auth as $$
  with me as (select private.v2_current_player_id() id)
  select m.id,m.sender_id,m.recipient_id,m.body,m.created_at from public.v2_messages m,me
  where ((m.sender_id=me.id and m.recipient_id=p_other_player_id) or (m.sender_id=p_other_player_id and m.recipient_id=me.id))
  order by m.created_at asc limit greatest(1,least(coalesce(p_limit,100),300));
$$;

revoke all on function public.v2_get_my_profile() from public,anon;
revoke all on function public.v2_search_players(text,integer) from public,anon;
revoke all on function public.v2_list_friends() from public,anon;
revoke all on function public.v2_list_friend_requests() from public,anon;
revoke all on function public.v2_list_challenges() from public,anon;
revoke all on function public.v2_list_notifications(integer) from public,anon;
revoke all on function public.v2_list_direct_messages(uuid,integer) from public,anon;
grant execute on function public.v2_get_my_profile() to authenticated;
grant execute on function public.v2_search_players(text,integer) to authenticated;
grant execute on function public.v2_list_friends() to authenticated;
grant execute on function public.v2_list_friend_requests() to authenticated;
grant execute on function public.v2_list_challenges() to authenticated;
grant execute on function public.v2_list_notifications(integer) to authenticated;
grant execute on function public.v2_list_direct_messages(uuid,integer) to authenticated;
