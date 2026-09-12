from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def test_variant_schema_contract():
    sql = read('supabase/migrations/20260912_full_platform_phase3_variants.sql')
    for token in ['v3_variant_games', 'v3_variant_moves', 'v3_variant_queue', 'chess960', 'row level security']:
        assert token in sql.lower()


def test_puzzle_battle_schema_contract():
    sql = read('supabase/migrations/20260912_full_platform_phase3_puzzle_battle.sql')
    for token in ['v3_puzzle_battles', 'v3_puzzle_battle_players', 'v3_puzzle_battle_moves', 'v3_join_puzzle_battle', 'v3_puzzle_battle_move']:
        assert token in sql


def test_tournament_format_contract():
    sql = read('supabase/migrations/20260912_full_platform_phase3_tournaments.sql')
    for token in ["format", "arena", "swiss", 'v3_arena_request_pairing', 'v3_tournament_standings']:
        assert token in sql.lower()


def test_review_achievement_moderation_contract():
    sql = read('supabase/migrations/20260912_full_platform_phase3_platform.sql')
    for token in ['v3_game_reviews', 'v3_game_review_moves', 'activity_streak', 'v3_moderation_actions', 'v3_refresh_achievements']:
        assert token in sql.lower()
