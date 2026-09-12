from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SQL=ROOT/'supabase/migrations/20260912_full_platform_phase3_tournaments.sql'


def test_formats_extend_existing_tournaments():
    text=SQL.read_text(encoding='utf-8').lower()
    for token in ["add column if not exists format", "'knockout'", "'arena'", "'swiss'", 'private.tournament_matches']:
        assert token in text


def test_swiss_and_arena_engines_exist():
    text=SQL.read_text(encoding='utf-8').lower()
    for token in ['v3_start_swiss_core','v3_create_swiss_round','v3_start_arena_core','v3_arena_request_pairing','v3_tournament_standings','process_tournament_live_game']:
        assert token in text
    assert 'for update skip locked' in text
