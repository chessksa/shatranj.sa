from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SQL=ROOT/'supabase/migrations/20260912_full_platform_phase3_platform.sql'


def test_game_review_persistence_contract():
    text=SQL.read_text(encoding='utf-8').lower()
    for token in ['v3_game_reviews','v3_game_review_moves','v3_save_game_review','accuracy_white','loss_cp','classification']:
        assert token in text


def test_streak_and_achievement_contract():
    text=SQL.read_text(encoding='utf-8').lower()
    for token in ['activity_streak','longest_activity_streak','last_activity_date','v3_touch_activity','v3_refresh_achievements','daily_streak_7','games_100']:
        assert token in text


def test_moderation_is_audited_and_admin_guarded():
    text=SQL.read_text(encoding='utf-8').lower()
    for token in ['v3_reports','v3_moderation_actions','private.require_operator','admin_v3_list_reports','admin_v3_resolve_report','suspend']:
        assert token in text
    assert 'enable row level security' in text
