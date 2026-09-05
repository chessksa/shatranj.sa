-- Internal synthetic/test accounts used to seed the Arab-wide ranking.
-- They are disclosed on the public player profile and excluded from the real subscriber count.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter table public.players
  add column if not exists is_synthetic boolean not null default false;

create table if not exists private.synthetic_player_catalog (
  sort_order integer primary key,
  country text not null unique,
  cities text[] not null,
  male_first_names text[] not null,
  female_first_names text[] not null,
  family_names text[] not null
);
revoke all on table private.synthetic_player_catalog from public, anon, authenticated;

insert into private.synthetic_player_catalog(sort_order,country,cities,male_first_names,female_first_names,family_names) values
  (1,'السعودية',array['الرياض','جدة','الدمام'],array['أحمد','سلمان','فهد','عبدالله','خالد','ناصر'],array['نورة','سارة','ريم','الجوهرة','هند','ليان'],array['العتيبي','القحطاني','الشمري','الحربي','الدوسري','الزهراني']),
  (2,'الإمارات',array['دبي','أبوظبي','الشارقة'],array['راشد','حمد','سعيد','خالد','ماجد','سلطان'],array['مريم','فاطمة','شيخة','نورة','لطيفة','عائشة'],array['المنصوري','المزروعي','النعيمي','الكتبي','الشامسي','السويدي']),
  (3,'الكويت',array['مدينة الكويت','الجهراء','حولي'],array['بدر','يوسف','فهد','ناصر','عبدالعزيز','محمد'],array['دانة','سارة','نوف','فرح','ريم','شهد'],array['العازمي','المطيري','الشمري','العجمي','الرشيدي','الهاجري']),
  (4,'البحرين',array['المنامة','المحرق','الرفاع'],array['علي','حسن','عبدالله','محمد','سلمان','يوسف'],array['مريم','فاطمة','زينب','نور','سارة','هبة'],array['الزياني','المؤيد','فخرو','البستكي','الصفار','العلوي']),
  (5,'قطر',array['الدوحة','الريان','الوكرة'],array['تميم','خالد','ناصر','محمد','جاسم','حمد'],array['نورة','مريم','العنود','دانة','شيخة','هند'],array['الكعبي','المري','الهاجري','الكواري','النعيمي','المهندي']),
  (6,'عُمان',array['مسقط','صلالة','صحار'],array['هيثم','أحمد','خالد','مازن','سالم','ناصر'],array['أمل','مريم','عائشة','مزون','سارة','نوال'],array['الحارثي','البوسعيدي','البلوشي','الهنائي','الرواحي','الشحي']),
  (7,'اليمن',array['صنعاء','عدن','تعز'],array['وليد','محمد','أنس','مازن','عمار','خالد'],array['أروى','بلقيس','سارة','ريم','هدى','مها'],array['الحميري','الصبري','الآنسي','الحضرمي','العدني','اليافعي']),
  (8,'العراق',array['بغداد','البصرة','الموصل'],array['علي','حيدر','مصطفى','كرار','سيف','أحمد'],array['زهراء','نور','مريم','سارة','شهد','رنا'],array['التميمي','الجبوري','العبيدي','السامرائي','الدليمي','الراوي']),
  (9,'الأردن',array['عمّان','إربد','الزرقاء'],array['يزن','حمزة','معاذ','أحمد','ليث','عمر'],array['لين','دانا','سارة','نور','يارا','رُبى'],array['الخطيب','العبادي','المجالي','الطراونة','الزعبي','الخصاونة']),
  (10,'فلسطين',array['القدس','غزة','نابلس'],array['محمود','ياسر','أدهم','وسيم','سامر','رامي'],array['ليان','ريم','سلمى','مريم','رنا','ديمة'],array['البرغوثي','التميمي','الخطيب','القدسي','النابلسي','الغزاوي']),
  (11,'لبنان',array['بيروت','طرابلس','صيدا'],array['جاد','رامي','كريم','زياد','نديم','فادي'],array['ريتا','مايا','لينا','رنا','نور','سارة'],array['الخوري','حداد','نعمة','حبيب','سعادة','مراد']),
  (12,'سوريا',array['دمشق','حلب','حمص'],array['سامر','مجد','يزن','قصي','أنس','لؤي'],array['شام','لارا','رنا','لمى','نور','سارة'],array['الخطيب','الحلبي','الدمشقي','الحموي','الأتاسي','الرفاعي']),
  (13,'مصر',array['القاهرة','الإسكندرية','الجيزة'],array['عمر','محمود','أحمد','كريم','يوسف','مروان'],array['منة','نور','سلمى','ياسمين','ريم','هنا'],array['المصري','الشريف','حسن','منصور','عبدالحميد','النجار']),
  (14,'السودان',array['الخرطوم','أم درمان','بورتسودان'],array['معتصم','محمد','طارق','مصعب','أنس','وليد'],array['إسراء','مها','آلاء','سارة','مي','رُبى'],array['إدريس','عثمان','الطيب','حمد','بشير','فضل']),
  (15,'ليبيا',array['طرابلس','بنغازي','مصراتة'],array['معتز','أيمن','محمد','أنس','سند','خالد'],array['سندس','رؤى','مريم','سارة','هبة','نور'],array['الورفلي','الزوي','الطرابلسي','المصراتي','العبيدي','البرعصي']),
  (16,'تونس',array['تونس','صفاقس','سوسة'],array['مهدي','أيمن','معز','سيف','ياسين','رامي'],array['آمنة','ريم','إيناس','سارة','مريم','رانية'],array['بن سالم','الطرابلسي','الجبالي','الهمامي','المنصوري','العبيدي']),
  (17,'الجزائر',array['الجزائر','وهران','قسنطينة'],array['ياسين','أمين','رياض','مراد','سفيان','وليد'],array['إيمان','أمينة','ريم','سارة','نسرين','ليلى'],array['بن عمر','بوشارب','قاسمي','بلقاسم','منصوري','رحماني']),
  (18,'المغرب',array['الرباط','الدار البيضاء','مراكش'],array['ياسين','أيوب','حمزة','سفيان','أنس','مهدي'],array['سلمى','إيمان','غزلان','سارة','مريم','هناء'],array['الإدريسي','العلوي','بناني','المريني','العماري','المنصوري']),
  (19,'موريتانيا',array['نواكشوط','نواذيبو','روصو'],array['محمد','سيدي','أحمد','الشيخ','المختار','إسماعيل'],array['مريم','خديجة','آمنة','زينب','فاطمة','سارة'],array['ولد أحمد','ولد محمد','ولد سيدي','ولد سالم','ولد المختار','ولد بلال']),
  (20,'الصومال',array['مقديشو','هرجيسا','بوصاصو'],array['محمد','عبدالله','حسن','عمر','يوسف','إسماعيل'],array['فاطمة','خديجة','آمنة','مريم','سارة','حليمة'],array['علي','حسن','نور','فارح','جامع','عبدي']),
  (21,'جيبوتي',array['جيبوتي','علي صبيح','تاجورة'],array['إسماعيل','حسن','محمد','علي','ياسين','عمر'],array['مريم','فاطمة','سارة','آمنة','خديجة','ليلى'],array['علي','حسن','محمد','يوسف','إبراهيم','عمر']),
  (22,'جزر القمر',array['موروني','موتسامودو','فومبوني'],array['سعيد','أحمد','محمد','يوسف','علي','سليم'],array['فاطمة','مريم','سارة','آمنة','ليلى','نور'],array['عبدالله','سعيد','محمد','عثمان','علي','سليم'])
on conflict (sort_order) do update set
  country=excluded.country,
  cities=excluded.cities,
  male_first_names=excluded.male_first_names,
  female_first_names=excluded.female_first_names,
  family_names=excluded.family_names;

create or replace view public.public_players as
select id,name,region,city,category,rating,rating_status,games_count,wins,draws,losses,created_at,is_synthetic
from public.players
where status='active';

drop function if exists public.get_public_player_profile(uuid);
create function public.get_public_player_profile(p_player_id uuid)
returns table(
  id uuid,name text,username text,city text,region text,rating integer,rating_status text,
  games_count integer,wins integer,draws integer,losses integer,created_at timestamptz,
  friend_count integer,avatar_path text,is_synthetic boolean
)
language sql
stable
security definer
set search_path=''
as $$
  select p.id,p.name,ur.username,p.city,p.region,p.rating,p.rating_status,
         p.games_count,p.wins,p.draws,p.losses,p.created_at,
         public.get_public_friend_count(p.id),
         case
           when exists(select 1 from storage.objects o where o.bucket_id='avatars' and o.name=p.id::text||'/avatar.webp') then p.id::text||'/avatar.webp'
           when p.auth_user_id is not null and exists(select 1 from storage.objects o where o.bucket_id='avatars' and o.name=p.auth_user_id::text||'/avatar.webp') then p.auth_user_id::text||'/avatar.webp'
           else p.id::text||'/avatar.webp'
         end,
         p.is_synthetic
  from public.players p
  left join public.username_registry ur on ur.user_id=p.auth_user_id
  where p.id=p_player_id and p.status='active'
  limit 1;
$$;
grant execute on function public.get_public_player_profile(uuid) to anon, authenticated;

create or replace function private.add_synthetic_player()
returns uuid
language plpgsql
security definer
set search_path='public','private','pg_temp'
as $$
declare
  v_total bigint;
  v_country_count bigint;
  v_row private.synthetic_player_catalog%rowtype;
  v_firsts text[];
  v_first_count integer;
  v_family_count integer;
  v_first_index integer;
  v_family_index integer;
  v_round integer;
  v_second_index integer;
  v_name text;
  v_city text;
  v_gender text;
  v_mobile text;
  v_id uuid;
  v_attempt integer := 0;
begin
  select count(*) into v_total from public.players where is_synthetic=true;
  select * into v_row
  from private.synthetic_player_catalog
  order by sort_order
  offset mod(v_total,22)
  limit 1;

  if v_row.country is null then
    raise exception 'synthetic player catalog is empty';
  end if;

  select count(*) into v_country_count
  from public.players
  where is_synthetic=true and region=v_row.country;

  v_gender := case when mod(v_country_count,2)=0 then 'male' else 'female' end;
  v_firsts := case when v_gender='male' then v_row.male_first_names else v_row.female_first_names end;
  v_first_count := cardinality(v_firsts);
  v_family_count := cardinality(v_row.family_names);
  v_first_index := mod(v_country_count,v_first_count)+1;
  v_family_index := mod(v_country_count / v_first_count,v_family_count)+1;
  v_round := (v_country_count / (v_first_count*v_family_count))::integer;
  v_second_index := mod(v_first_index+v_round,v_first_count)+1;

  v_name := v_firsts[v_first_index]
            || case when v_round>0 then ' '||v_firsts[v_second_index] else '' end
            || ' '||v_row.family_names[v_family_index];
  v_city := v_row.cities[mod(v_country_count,cardinality(v_row.cities))+1];

  loop
    v_attempt := v_attempt+1;
    v_mobile := '+999'||lpad((floor(random()*1000000000000)::bigint)::text,12,'0');
    begin
      insert into public.players(name,mobile,region,city,category,rating,rating_status,status,gender,is_synthetic)
      values(v_name,v_mobile,v_row.country,v_city,'open',1500,'provisional','active',v_gender,true)
      returning id into v_id;
      exit;
    exception when unique_violation then
      if v_attempt>=5 then raise; end if;
    end;
  end loop;

  return v_id;
end;
$$;
revoke all on function private.add_synthetic_player() from public, anon, authenticated;

create extension if not exists pg_cron;
do $$
declare v_jobid bigint;
begin
  for v_jobid in select jobid from cron.job where jobname='shatranj-add-synthetic-player-30m'
  loop
    perform cron.unschedule(v_jobid);
  end loop;
end;
$$;
select cron.schedule(
  'shatranj-add-synthetic-player-30m',
  '*/30 * * * *',
  $cron$select private.add_synthetic_player();$cron$
);
