begin;

-- Retire the legacy V1 live-game write surface. The production UI now uses
-- V2/V5 matchmaking plus the live-game-v2 Edge Function for authoritative play.
revoke execute on function public.create_live_game(text) from public, anon, authenticated;
revoke execute on function public.join_live_game(text,text) from public, anon, authenticated;
revoke execute on function public.submit_live_move(uuid,text,text,text,text,text,text,text) from public, anon, authenticated;
revoke execute on function public.resign_live_game(uuid,text) from public, anon, authenticated;
revoke execute on function public.offer_live_draw(uuid,text) from public, anon, authenticated;
revoke execute on function public.respond_live_draw(uuid,text,boolean) from public, anon, authenticated;
revoke execute on function public.claim_live_timeout(uuid,text) from public, anon, authenticated;
revoke execute on function public.cancel_live_game_grace(uuid,text) from public, anon, authenticated;
revoke execute on function public.start_matchmaking(integer) from public, anon, authenticated;
revoke execute on function public.poll_matchmaking() from public, anon, authenticated;
revoke execute on function public.cancel_matchmaking() from public, anon, authenticated;

-- Remove abandoned V1 queue entries without touching V2/V5 queues.
update private.matchmaking_queue
   set status = 'cancelled',
       seat_key_cipher = null,
       matched_game_id = null,
       color = null,
       last_seen_at = clock_timestamp(),
       updated_at = clock_timestamp()
 where status = 'waiting'
   and last_seen_at < clock_timestamp() - interval '5 minutes';

commit;
