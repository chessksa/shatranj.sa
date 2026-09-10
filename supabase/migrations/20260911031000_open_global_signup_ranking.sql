-- Open registration to every nationality while keeping one global rating pool.
-- `region` stores nationality, `country` stores country of residence.

create or replace function public.claim_player_profile(
  p_name text,
  p_mobile text,
  p_region text,
  p_city text,
  p_category text,
  p_residence_country text
)
returns table(
  id uuid,
  name text,
  mobile text,
  region text,
  city text,
  category text,
  rating integer,
  rating_status text,
  games_count integer,
  wins integer,
  draws integer,
  losses integer
)
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare
  v_uid uuid;
  v_email_confirmed timestamptz;
  v_mobile text;
  v_metadata_gender text;
  v_nationality text;
  v_residence_country text;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'not authenticated'; end if;

  select u.email_confirmed_at,
         case when u.raw_user_meta_data->>'gender' in ('male','female')
              then u.raw_user_meta_data->>'gender' else null end
    into v_email_confirmed,v_metadata_gender
  from auth.users u
  where u.id=v_uid;

  if v_email_confirmed is null then raise exception 'email not confirmed'; end if;

  v_mobile := regexp_replace(btrim(coalesce(p_mobile,'')), '[[:space:]()-]', '', 'g');
  if v_mobile ~ '^00[1-9][0-9]{7,14}$' then
    v_mobile := chr(43) || substring(v_mobile from 3);
  end if;
  if v_mobile ~ '^[+]9665[0-9]{8}$' then
    v_mobile := '0' || substring(v_mobile from 5);
  elsif v_mobile !~ '^05[0-9]{8}$' and v_mobile !~ '^[+][1-9][0-9]{7,14}$' then
    raise exception 'invalid mobile';
  end if;

  if char_length(btrim(p_name))<2 or char_length(btrim(p_name))>60 then
    raise exception 'invalid player name';
  end if;

  v_nationality := btrim(coalesce(p_region,''));
  v_residence_country := btrim(coalesce(p_residence_country,''));

  if v_nationality = '' then raise exception 'nationality required'; end if;
  if v_residence_country = '' then raise exception 'residence country required'; end if;
  if btrim(coalesce(p_city,'')) = '' then raise exception 'city required'; end if;

  if p_category not in ('open','u18','u14','u10') then p_category := 'open'; end if;

  if exists(select 1 from public.players p where p.auth_user_id=v_uid) then
    update public.players p
       set name=btrim(p_name),
           mobile=v_mobile,
           region=v_nationality,
           city=btrim(p_city),
           country=v_residence_country,
           category=p_category,
           gender=coalesce(p.gender,v_metadata_gender)
     where p.auth_user_id=v_uid;

    return query
      select p.id,p.name,p.mobile,p.region,p.city,p.category,p.rating,p.rating_status,p.games_count,p.wins,p.draws,p.losses
      from public.players p where p.auth_user_id=v_uid limit 1;
    return;
  end if;

  if exists(select 1 from public.players p where p.mobile=v_mobile and p.auth_user_id is null) then
    raise exception 'mobile belongs to legacy player; admin link required';
  end if;
  if exists(select 1 from public.players p where p.mobile=v_mobile and p.auth_user_id is not null and p.auth_user_id<>v_uid) then
    raise exception 'mobile already linked to another account';
  end if;

  insert into public.players(auth_user_id,name,mobile,region,city,country,category,gender)
  values(v_uid,btrim(p_name),v_mobile,v_nationality,btrim(p_city),v_residence_country,p_category,v_metadata_gender);

  return query
    select p.id,p.name,p.mobile,p.region,p.city,p.category,p.rating,p.rating_status,p.games_count,p.wins,p.draws,p.losses
    from public.players p where p.auth_user_id=v_uid limit 1;
end;
$$;

grant execute on function public.claim_player_profile(text,text,text,text,text,text) to anon, authenticated, service_role;
