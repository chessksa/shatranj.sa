from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SQL=ROOT/'supabase/migrations/20260912_phase5_home_dashboard.sql'


def sql_text():
    assert SQL.exists(), 'Phase 5 home dashboard migration is missing'
    return SQL.read_text(encoding='utf-8').lower()


def test_home_dashboard_aggregates_core_member_state():
    text=sql_text()
    for token in [
        'v5_home_dashboard','active_game','incoming_challenges','friends_count',
        'online_friends','unread_notifications','upcoming_tournament','daily_puzzle',
        'recent_game','v2_games','v2_challenges','v2_friendships','v2_notifications',
        'v2_puzzles','tournaments','player_presence'
    ]:
        assert token in text
    assert 'security definer' in text
    assert 'grant execute on function public.v5_home_dashboard() to authenticated' in text
    assert 'revoke all on function public.v5_home_dashboard() from public,anon' in text
