-- Add a reusable tactical puzzle pack and keep the daily puzzle available every day.

insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,is_published)
select 'التقط الوزير','4k3/8/8/3q4/8/8/3Q4/4K3 w - - 0 1',array['d2d5'],array['queen','attack'],760,true
where not exists(select 1 from public.v2_puzzles where fen='4k3/8/8/3q4/8/8/3Q4/4K3 w - - 0 1');

insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,is_published)
select 'رد الهجوم','4k3/3q4/8/8/3Q4/8/8/4K3 b - - 0 1',array['d7d4'],array['queen','attack'],800,true
where not exists(select 1 from public.v2_puzzles where fen='4k3/3q4/8/8/3Q4/8/8/4K3 b - - 0 1');

insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,is_published)
select 'رخ على الصف الثامن','q5k1/8/8/8/8/8/8/R5K1 w - - 0 1',array['a1a8'],array['queen','attack'],900,true
where not exists(select 1 from public.v2_puzzles where fen='q5k1/8/8/8/8/8/8/R5K1 w - - 0 1');

insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,is_published)
select 'رخ حاسم','r5k1/8/8/8/8/8/8/Q5K1 b - - 0 1',array['a8a1'],array['queen','attack'],920,true
where not exists(select 1 from public.v2_puzzles where fen='r5k1/8/8/8/8/8/8/Q5K1 b - - 0 1');

insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,is_published)
select 'قطر مفتوح','6k1/8/7q/8/8/8/8/2B3K1 w - - 0 1',array['c1h6'],array['queen','attack'],980,true
where not exists(select 1 from public.v2_puzzles where fen='6k1/8/7q/8/8/8/8/2B3K1 w - - 0 1');

insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,is_published)
select 'الفيل يقتنص الوزير','2b3k1/8/8/8/8/7Q/8/6K1 b - - 0 1',array['c8h3'],array['queen','attack'],1000,true
where not exists(select 1 from public.v2_puzzles where fen='2b3k1/8/8/8/8/7Q/8/6K1 b - - 0 1');

insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,is_published)
select 'الحصان ينقذ الملك','4k3/8/8/4q3/8/5N2/8/4K3 w - - 0 1',array['f3e5'],array['queen','attack'],1080,true
where not exists(select 1 from public.v2_puzzles where fen='4k3/8/8/4q3/8/5N2/8/4K3 w - - 0 1');

insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,is_published)
select 'حصان مضاد','4k3/8/5n2/8/4Q3/8/8/4K3 b - - 0 1',array['f6e4'],array['queen','attack'],1100,true
where not exists(select 1 from public.v2_puzzles where fen='4k3/8/5n2/8/4Q3/8/8/4K3 b - - 0 1');

insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,is_published)
select 'ترقية مع كسب الوزير','k6q/6P1/8/8/8/8/8/K7 w - - 0 1',array['g7h8q'],array['queen','attack'],1180,true
where not exists(select 1 from public.v2_puzzles where fen='k6q/6P1/8/8/8/8/8/K7 w - - 0 1');

insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,is_published)
select 'ترقية سوداء','k7/8/8/8/8/8/6p1/K6Q b - - 0 1',array['g2h1q'],array['queen','attack'],1200,true
where not exists(select 1 from public.v2_puzzles where fen='k7/8/8/8/8/8/6p1/K6Q b - - 0 1');

insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,is_published)
select 'مات بالوزير','6k1/8/6KQ/8/8/8/8/8 w - - 0 1',array['h6g7'],array['mate','queen'],700,true
where not exists(select 1 from public.v2_puzzles where fen='6k1/8/6KQ/8/8/8/8/8 w - - 0 1');

insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,is_published)
select 'مات بالوزير للأسود','8/8/8/8/8/6kq/8/6K1 b - - 0 1',array['h3g2'],array['mate','queen'],720,true
where not exists(select 1 from public.v2_puzzles where fen='8/8/8/8/8/6kq/8/6K1 b - - 0 1');

insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,is_published)
select 'مات بالرخ','7k/8/6K1/8/8/8/8/R7 w - - 0 1',array['a1a8'],array['mate','attack'],820,true
where not exists(select 1 from public.v2_puzzles where fen='7k/8/6K1/8/8/8/8/R7 w - - 0 1');

insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,is_published)
select 'مات بالرخ للأسود','r7/8/8/8/8/6k1/8/7K b - - 0 1',array['a8a1'],array['mate','attack'],840,true
where not exists(select 1 from public.v2_puzzles where fen='r7/8/8/8/8/6k1/8/7K b - - 0 1');

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

    if p.id is null then
      select * into p from public.v2_puzzles x
      where x.is_published and x.daily_date is null
      order by md5(x.id::text || current_date::text)
      limit 1;

      if p.id is not null then
        insert into public.v2_puzzles(title,fen,solution_uci,themes,rating,daily_date,is_published)
        values(p.title,p.fen,p.solution_uci,p.themes,p.rating,current_date,true)
        on conflict (daily_date) do nothing;

        select * into p from public.v2_puzzles x
        where x.is_published and x.daily_date=current_date
        order by x.created_at desc limit 1;
      end if;
    end if;
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
