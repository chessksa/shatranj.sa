-- Phase 5: keep privacy-enforced social writes authenticated-only after CREATE OR REPLACE.
revoke all on function public.v2_send_challenge(uuid,integer,integer,boolean,text) from public,anon;
revoke all on function public.v2_send_message(uuid,text) from public,anon;
grant execute on function public.v2_send_challenge(uuid,integer,integer,boolean,text) to authenticated;
grant execute on function public.v2_send_message(uuid,text) to authenticated;
