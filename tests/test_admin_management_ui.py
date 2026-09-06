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


if __name__ == "__main__":
    test_admin_js_exposes_player_moderator_and_tournament_management()
    test_owner_only_controls_are_explicit()
    test_country_city_catalog_is_reused()
    print("Admin management UI tests passed")
