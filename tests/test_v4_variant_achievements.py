from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SQL=ROOT/'supabase/migrations/20260912_phase4_variant_achievements.sql'


def test_each_advanced_variant_has_first_game_achievement():
    text=SQL.read_text(encoding='utf-8').lower()
    for achievement in [
        'crazyhouse_first','atomic_first','antichess_first','horde_first','racingkings_first'
    ]:
        assert achievement in text


def test_refresh_achievements_checks_finished_variant_games_idempotently():
    text=SQL.read_text(encoding='utf-8').lower()
    assert 'v3_refresh_achievements' in text
    assert 'v3_variant_games' in text
    assert "status='finished'" in text
    assert 'on conflict(player_id,achievement_id) do nothing' in text
