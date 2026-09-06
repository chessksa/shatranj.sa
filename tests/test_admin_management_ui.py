from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_admin_js_exposes_player_moderator_and_tournament_management():
    text = read("admin.js")
    for token in [
        "admin_get_access",
        "admin_list_players_v3",
        "admin-management",
        "إضافة لاعب",
        "حذف اللاعب",
        "المشرفون",
        "admin_list_moderators",
        "admin_add_moderator",
        "البطولات",
        "admin_list_tournaments",
        "admin_create_tournament",
    ]:
        assert token in text, token


def test_owner_only_controls_are_explicit():
    text = read("admin.js")
    assert "owner-only" in text
    assert "state.access?.role==='owner'" in text or 'state.access?.role === "owner"' in text


def test_country_city_catalog_is_reused():
    text = read("admin.js")
    assert "ARAB_CITIES_DATA" in text
    assert "./arab-cities.js" in text


def test_admin_sidebar_keeps_return_link_visible():
    html = read("admin.html")
    assert ".nav-list" in html and "overflow-y:auto" in html
    assert ".sidebar-foot" in html and "position:sticky" in html and "bottom:0" in html


def test_refresh_button_forces_real_reload_and_has_feedback():
    js = read("admin.js")
    assert "async function handleRefresh()" in js
    assert "state.allPlayers=[]" in js
    assert "جارٍ التحديث" in js
    assert "addEventListener('click',handleRefresh)" in js


def test_tournaments_button_moves_from_header_beside_computer_play():
    html = read("index.html")
    header = html.split("</header>", 1)[0]
    actions = html.split('id="homeBoardActions"', 1)[1].split("</div>", 1)[0]
    assert 'id="headerTournaments"' not in header
    assert 'hero-computer-btn' in actions
    assert 'href="tournaments.html"' in actions
    assert '>البطولات<' in actions


def test_home_does_not_render_duplicate_tournaments_section():
    html = read("index.html")
    assert '<section id="tournaments"' not in html
    assert 'id="publicTournamentStyles"' not in html
    assert 'publicTournamentsList' not in html
    assert 'loadPublicTournaments' not in html


def test_tournaments_page_has_numbered_table_and_registration_column():
    html = read("tournaments.html")
    assert '<table' in html
    assert 'id="tournamentRows"' in html
    for heading in ["#", "اسم البطولة", "النطاق", "الدولة", "المدينة", "نظام الوقت", "الموعد", "السعة", "الحالة", "التسجيل"]:
        assert heading in html
    assert "index+1" in html or "index + 1" in html


def test_tournaments_page_uses_home_interface_palette():
    html = read("tournaments.html")
    for token in [
        "--hero-deep:#062f31",
        "--hero-deeper:#042628",
        "--hero-panel:#0b4143",
        "--hero-gold:#d8b665",
        "--hero-gold-2:#efcf7c",
        "--hero-cream:#f4eddc",
        "linear-gradient(145deg,var(--hero-deeper),var(--hero-deep) 50%,#07383a)",
    ]:
        assert token in html, token


def test_tournament_table_text_is_larger():
    html = read("tournaments.html")
    assert "th{background:rgba(4,38,40,.62);color:#d9c58f;font-size:15px" in html
    assert "td{color:var(--hero-cream);font-size:16px" in html


def test_tournament_registration_button_is_light_orange_and_uses_rpc():
    html = read("tournaments.html")
    assert ".register-btn" in html
    assert "background:#f6b26b" in html
    assert "سجّل الآن" in html
    assert "التسجيل مغلق" in html
    assert ".rpc('register_for_tournament'" in html
    assert "already_registered" in html


def test_tournament_registration_rpc_migration_enforces_rules():
    sql = read("supabase/migrations/20260906183000_tournament_registration_rpc.sql")
    for token in [
        "create or replace function public.register_for_tournament",
        "auth.uid()",
        "status <> 'open'",
        "registration_opens_at",
        "registration_closes_at",
        "max_players",
        "scope_type = 'country'",
        "scope_type = 'city'",
        "on conflict (tournament_id, player_id)",
        "grant execute on function public.register_for_tournament(uuid) to authenticated",
    ]:
        assert token in sql, token


def test_tournaments_page_loads_public_tournaments_from_supabase():
    html = read("tournaments.html")
    assert "createClient" in html
    assert ".from('tournaments')" in html
    assert ".in('status',['open','running','finished'])" in html
    assert "renderTournaments" in html


if __name__ == "__main__":
    test_admin_js_exposes_player_moderator_and_tournament_management()
    test_owner_only_controls_are_explicit()
    test_country_city_catalog_is_reused()
    test_admin_sidebar_keeps_return_link_visible()
    test_refresh_button_forces_real_reload_and_has_feedback()
    test_tournaments_button_moves_from_header_beside_computer_play()
    test_home_does_not_render_duplicate_tournaments_section()
    test_tournaments_page_has_numbered_table_and_registration_column()
    test_tournaments_page_uses_home_interface_palette()
    test_tournament_table_text_is_larger()
    test_tournament_registration_button_is_light_orange_and_uses_rpc()
    test_tournament_registration_rpc_migration_enforces_rules()
    test_tournaments_page_loads_public_tournaments_from_supabase()
    print("Admin management and tournament registration UI tests passed")
