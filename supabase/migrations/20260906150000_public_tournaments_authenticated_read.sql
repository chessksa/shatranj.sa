drop policy if exists "public tournaments read" on public.tournaments;

create policy "public tournaments read"
on public.tournaments
for select
to anon, authenticated
using (
  status = any (array['open'::text, 'running'::text, 'finished'::text])
);
