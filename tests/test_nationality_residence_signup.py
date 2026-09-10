from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase/migrations/20260911020000_nationality_residence.sql"


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_signup_separates_arab_nationality_from_world_residence():
    html = read("index-app.html")

    assert '<span>الجنسية</span>' in html
    assert 'id="signupNationality"' in html
    assert '<span>دولة الإقامة</span>' in html
    assert 'id="signupRegion"' in html
    assert "populateSignupNationalities" in html
    assert "ARAB_NATIONALITIES" in html
    assert "region:$('#signupNationality').value" in html
    assert "country:$('#signupRegion').value" in html
    assert "p_residence_country:profileData.country" in html


def test_residence_country_drives_world_city_choices():
    html = read("index-app.html")

    assert "const select=$('#signupRegion');" in html
    assert "getCitiesForCountry(iso2)" in html
    assert "$('#signupRegion').addEventListener('change',async()=>" in html


def test_database_contract_stores_residence_without_changing_nationality_ranking_field():
    assert MIGRATION.exists(), "nationality/residence migration is required"
    sql = MIGRATION.read_text(encoding="utf-8")

    assert "p_residence_country text" in sql
    assert "region=v_nationality" in sql
    assert "country=v_residence_country" in sql
    assert "insert into public.players" in sql
    assert "region,city,country" in sql.replace(" ", "").replace("\n", "")
    assert "unsupported nationality" in sql


if __name__ == "__main__":
    test_signup_separates_arab_nationality_from_world_residence()
    test_residence_country_drives_world_city_choices()
    test_database_contract_stores_residence_without_changing_nationality_ranking_field()
    print("Nationality/residence signup tests passed")
