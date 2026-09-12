from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SQL = ROOT / 'supabase/migrations/20260912_phase6_security_hardening.sql'
FOLLOWUP = ROOT / 'supabase/migrations/20260912_phase6_security_followup.sql'


def sql_text():
    assert SQL.exists(), 'Phase 6 security hardening migration is missing'
    return SQL.read_text(encoding='utf-8').lower()


def followup_text():
    assert FOLLOWUP.exists(), 'Phase 6 security follow-up migration is missing'
    return FOLLOWUP.read_text(encoding='utf-8').lower()


def test_legacy_signed_in_rpcs_revoke_public_and_anon():
    text = sql_text()
    targets = [
        'cancel_matchmaking()',
        'claim_player_profile(text,text,text,text,text)',
        'claim_player_profile(text,text,text,text,text,text)',
        'claim_player_profile_v2(text,text,text,text,text,text)',
        'get_my_player_profile()',
        'get_my_player_profile_v2()',
        'poll_matchmaking()',
        'send_player_challenge(uuid,integer)',
        'set_my_gender_once(text)',
        'start_matchmaking(integer)',
        'start_matchmaking_v2(integer,text)',
    ]
    for signature in targets:
        assert f'revoke execute on function public.{signature} from public, anon' in text
        assert f'grant execute on function public.{signature} to authenticated' in text


def test_public_players_view_is_security_invoker_and_not_client_dml():
    text = sql_text()
    assert 'create or replace view public.public_players' in text
    assert "with (security_invoker = true)" in text
    for column in ['id','name','region','city','category','rating','rating_status','games_count','wins','draws','losses','created_at','is_synthetic']:
        assert column in text
    assert "where status = 'active'" in text or "where p.status = 'active'" in text
    assert 'revoke all on public.public_players from public, anon, authenticated' in text
    assert 'grant select on public.public_players to service_role' in text


def test_internal_trigger_helper_is_not_exposed_as_rpc():
    text = followup_text()
    assert 'revoke execute on function public.reserve_username_on_auth_signup() from public, anon, authenticated' in text


def test_participant_live_state_requires_authenticated_role():
    text = followup_text()
    assert 'revoke execute on function public.get_live_game_state(uuid) from public, anon' in text
    assert 'grant execute on function public.get_live_game_state(uuid) to authenticated' in text
