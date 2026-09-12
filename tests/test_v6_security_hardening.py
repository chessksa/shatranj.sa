from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SQL = ROOT / 'supabase/migrations/20260912_phase6_security_hardening.sql'


def sql_text():
    assert SQL.exists(), 'Phase 6 security hardening migration is missing'
    return SQL.read_text(encoding='utf-8').lower()


def test_legacy_signed_in_rpcs_revoke_anon():
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
        assert f'revoke execute on function public.{signature} from anon' in text
        assert f'grant execute on function public.{signature} to authenticated' in text


def test_public_players_view_is_security_invoker():
    text = sql_text()
    assert 'create or replace view public.public_players' in text
    assert "with (security_invoker = true)" in text
    for column in ['id','name','region','city','category','rating','rating_status','games_count','wins','draws','losses','created_at','is_synthetic']:
        assert column in text
    assert "where status = 'active'" in text or "where p.status = 'active'" in text
