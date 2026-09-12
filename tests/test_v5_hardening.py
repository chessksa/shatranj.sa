from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SQL=ROOT/'supabase/migrations/20260912_phase5_hardening.sql'


def sql_text():
    assert SQL.exists(), 'Phase 5 hardening migration is missing'
    return SQL.read_text(encoding='utf-8').lower()


def test_quick_queue_evicts_custom_queue_server_side():
    text=sql_text()
    for token in [
        'v5_clear_custom_queue_on_v2_enqueue',
        'private.v2_matchmaking_queue',
        'private.v5_matchmaking_queue',
        'create trigger',
        'before insert or update'
    ]:
        assert token in text


def test_legacy_friend_presence_respects_show_online():
    text=sql_text()
    for token in [
        'create or replace function public.get_my_friends()',
        'create or replace function public.get_my_friends_presence()',
        'v5_user_settings',
        'show_online',
        'coalesce(s.show_online,true)'
    ]:
        assert token in text
