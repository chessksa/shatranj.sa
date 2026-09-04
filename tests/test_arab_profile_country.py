from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_profile_and_public_player_convert_legacy_saudi_regions_to_country():
    for name in ["profile.js", "player.js"]:
        text = read(name)
        assert "SAUDI_REGIONS" in text, name
        assert "countryForRegion" in text, name
        assert "countryForRegion(row.region)" in text or "countryForRegion(profile.region)" in text, name


def test_profile_section_uses_arab_brand():
    text = read("profile-section.js")
    assert "شطرنج السعودية" not in text
    assert "شطرنج العرب" in text


if __name__ == "__main__":
    test_profile_and_public_player_convert_legacy_saudi_regions_to_country()
    test_profile_section_uses_arab_brand()
    print("Arab profile country tests passed")
