create index if not exists tournament_matches_player_one_idx on private.tournament_matches(player_one_id) where player_one_id is not null;
create index if not exists tournament_matches_player_two_idx on private.tournament_matches(player_two_id) where player_two_id is not null;
create index if not exists tournament_matches_winner_idx on private.tournament_matches(winner_player_id) where winner_player_id is not null;
