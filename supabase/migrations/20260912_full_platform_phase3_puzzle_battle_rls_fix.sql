drop policy if exists v3_puzzle_battles_participant_read on public.v3_puzzle_battles;
drop policy if exists v3_puzzle_battle_players_participant_read on public.v3_puzzle_battle_players;
drop policy if exists v3_puzzle_battle_puzzles_participant_read on public.v3_puzzle_battle_puzzles;
drop policy if exists v3_puzzle_battle_moves_participant_read on public.v3_puzzle_battle_moves;

-- Battle metadata is non-sensitive; detailed opponent state is exposed only through guarded RPCs.
create policy v3_puzzle_battles_authenticated_read on public.v3_puzzle_battles for select to authenticated using(true);
create policy v3_puzzle_battle_players_self_read on public.v3_puzzle_battle_players for select to authenticated using(player_id=public.v2_my_player_id());
create policy v3_puzzle_battle_puzzles_authenticated_read on public.v3_puzzle_battle_puzzles for select to authenticated using(true);
create policy v3_puzzle_battle_moves_self_read on public.v3_puzzle_battle_moves for select to authenticated using(player_id=public.v2_my_player_id());
