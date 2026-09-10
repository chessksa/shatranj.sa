from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_world_country_catalog_and_city_loader_are_wired_to_signup():
    html = read("index-app.html")
    world_path = ROOT / "world-locations.js"

    assert world_path.exists(), "world-locations.js must provide the global signup catalog"
    world_js = world_path.read_text(encoding="utf-8")

    assert "WORLD_COUNTRIES" in world_js
    assert len(re.findall(r"\biso2:\s*['\"][A-Z]{2}['\"]", world_js)) >= 200
    for code in ["SA", "US", "GB", "FR", "DE", "JP", "CN", "IN", "BR", "ZA", "AU", "CA"]:
        assert f"iso2:'{code}'" in world_js or f'iso2:"{code}"' in world_js

    assert "countriesnow.space/api/v0.1/countries/cities/q" in world_js
    assert "getCitiesForCountry" in world_js
    assert "localStorage" in world_js

    assert "from './world-locations.js'" in html
    assert "populateSignupCountries" in html
    assert "populateSignupCities" in html
    assert "signupCityOptions" in html
    assert "$('#signupRegion').addEventListener('change'" in html


def test_world_signup_keeps_city_entry_usable_as_fallback():
    html = read("index-app.html")
    assert 'id="signupCity"' in html
    assert 'list="signupCityOptions"' in html
    assert "يمكنك كتابة المدينة" in html or "اكتب المدينة" in html or "إدخال المدينة" in html


if __name__ == "__main__":
    test_world_country_catalog_and_city_loader_are_wired_to_signup()
    test_world_signup_keeps_city_entry_usable_as_fallback()
    print("World signup locations tests passed")

# Contract intentionally runs before implementation to verify the RED stage.
