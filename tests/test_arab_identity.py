from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_home_uses_arab_identity_and_country_location():
    html = read("index.html")

    assert "<title>شطرنج العرب</title>" in html
    assert "المنصة العربية للشطرنج" in html
    assert "مرحبًا بك في <span>شطرنج العرب</span>" in html
    assert "مجتمع عربي لعشاق الشطرنج" in html
    assert "ترتيب اللاعبين على مستوى العالم العربي" in html
    assert "<th>الدولة</th>" in html
    assert "<span>الدولة</span>" in html
    assert "كل الدول العربية" in html
    assert "اختر الدولة" in html
    assert "شطرنج السعودية" not in html


def test_home_supports_all_arab_countries_and_international_mobile():
    html = read("index.html")

    countries = [
        "السعودية", "الإمارات", "الكويت", "البحرين", "قطر", "عُمان",
        "اليمن", "العراق", "الأردن", "فلسطين", "لبنان", "سوريا",
        "مصر", "السودان", "ليبيا", "تونس", "الجزائر", "المغرب",
        "موريتانيا", "الصومال", "جيبوتي", "جزر القمر",
    ]
    for country in countries:
        assert f'value="{country}"' in html

    assert "normalizeInternationalMobile" in html
    assert "normalizeSaudiMobile" not in html
    assert "مفتاح الدولة" in html
    assert "fillCities(" not in html
    assert "signupCity').disabled=true" not in html


def test_secondary_pages_use_arab_brand():
    for name in ["profile.html", "player.html", "play-v10.html", "play.html", "watch.html"]:
        html = read(name)
        assert "شطرنج السعودية" not in html, name
        assert "شطرنج العرب" in html, name


def test_web_app_manifest_uses_arab_brand():
    manifest = read("manifest.webmanifest")
    assert "شطرنج العرب" in manifest
    assert "شطرنج السعودية" not in manifest


if __name__ == "__main__":
    test_home_uses_arab_identity_and_country_location()
    test_home_supports_all_arab_countries_and_international_mobile()
    test_secondary_pages_use_arab_brand()
    test_web_app_manifest_uses_arab_brand()
    print("Arab identity tests passed")
