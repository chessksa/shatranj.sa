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


def test_header_tournaments_link_targets_live_tournaments_section():
    html = read("index.html")
    assert 'id="headerTournaments"' in html
    assert 'href="#tournaments"' in html
    assert 'id="tournaments"' in html
    assert 'id="publicTournamentsList"' in html


def test_home_loads_public_tournaments_from_supabase():
    html = read("index.html")
    assert "async function loadPublicTournaments()" in html
    assert ".from('tournaments')" in html
    assert ".in('status',['open','running','finished'])" in html
    assert "renderPublicTournaments" in html


if __name__ == "__main__":
    test_admin_js_exposes_player_moderator_and_tournament_management()
    test_owner_only_controls_are_explicit()
    test_country_city_catalog_is_reused()
    test_admin_sidebar_keeps_return_link_visible()
    test_refresh_button_forces_real_reload_and_has_feedback()
    test_header_tournaments_link_targets_live_tournaments_section()
    test_home_loads_public_tournaments_from_supabase()
    print("Admin management UI tests passed")
