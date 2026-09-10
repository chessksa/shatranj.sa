from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase/migrations/20260911031000_open_global_signup_ranking.sql"


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_signup_accepts_nationalities_from_the_world_catalog():
    html = read("index-app.html")

    assert '<span>الجنسية</span>' in html
    assert 'id="signupNationality"' in html
    assert '<span>دولة الإقامة</span>' in html
    assert 'id="signupRegion"' in html
    assert "populateSignupNationalities" in html
    assert "WORLD_COUNTRIES.map" in html
    assert "ARAB_NATIONALITIES" not in html
    assert "region:$('#signupNationality').value" in html
    assert "country:$('#signupRegion').value" in html
    assert "p_residence_country:profileData.country" in html


def test_residence_country_still_drives_world_city_choices():
    html = read("index-app.html")

    assert "const select=$('#signupRegion');" in html
    assert "getCitiesForCountry(iso2)" in html
    assert "$('#signupRegion').addEventListener('change',async()=>" in html


def test_ranking_is_global_and_uses_the_world_country_catalog():
    html = read("index-app.html")

    assert "ترتيب اللاعبين عالميًا" in html
    assert "populateRankingCountries" in html
    assert "WORLD_COUNTRIES.map" in html
    assert ".from('public_players')" in html
    assert ".order('rating',{ascending:false})" in html


def test_database_contract_allows_any_nonempty_nationality():
    assert MIGRATION.exists(), "global signup/ranking migration is required"
    sql = MIGRATION.read_text(encoding="utf-8")

    assert "p_residence_country text" in sql
    assert "region=v_nationality" in sql
    assert "country=v_residence_country" in sql
    assert "nationality required" in sql
    assert "unsupported nationality" not in sql
    assert "v_nationality not in" not in sql


if __name__ == "__main__":
    test_signup_accepts_nationalities_from_the_world_catalog()
    test_residence_country_still_drives_world_city_choices()
    test_ranking_is_global_and_uses_the_world_country_catalog()
    test_database_contract_allows_any_nonempty_nationality()
    print("Worldwide signup and global ranking tests passed")
