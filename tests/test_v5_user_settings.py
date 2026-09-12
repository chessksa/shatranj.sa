from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SQL=ROOT/'supabase/migrations/20260912_phase5_user_settings.sql'


def sql_text():
    assert SQL.exists(), 'Phase 5 user settings migration is missing'
    return SQL.read_text(encoding='utf-8').lower()


def test_user_settings_are_server_owned_and_complete():
    text=sql_text()
    for token in [
        'v5_user_settings','allow_challenges','allow_messages','show_online',
        'site_notifications','sound_enabled','language','timezone',
        'v5_get_my_settings','v5_update_my_settings','enable row level security'
    ]:
        assert token in text
    assert 'revoke all on table public.v5_user_settings from public, anon, authenticated' in text


def test_privacy_is_enforced_in_challenges_and_messages():
    text=sql_text()
    for token in [
        'create or replace function public.v2_send_challenge',
        'create or replace function public.v2_send_message',
        'challenge_not_allowed','message_not_allowed','v2_friendships',
        'select s.allow_challenges,s.site_notifications',
        'select s.allow_messages into v_policy',
        "if v_policy='friends'"
    ]:
        assert token in text
