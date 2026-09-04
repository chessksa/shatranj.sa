from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_arab_city_catalog_is_present_and_connected_to_country_selects():
    html = read("index.html")

    assert "const ARAB_CITIES" in html
    assert "populateCitySelect" in html
    assert "signupRegion.addEventListener('change'" in html
    assert "regionFilter.addEventListener('change'" in html


def test_city_catalog_covers_all_arab_countries_with_multiple_cities():
    html = read("index.html")

    samples = {
        "السعودية": ["الرياض", "جدة", "طريف"],
        "الإمارات": ["أبوظبي", "دبي", "الشارقة"],
        "الكويت": ["مدينة الكويت", "الجهراء", "الفروانية"],
        "البحرين": ["المنامة", "المحرق", "الرفاع"],
        "قطر": ["الدوحة", "الريان", "الوكرة"],
        "عُمان": ["مسقط", "صلالة", "صحار"],
        "اليمن": ["صنعاء", "عدن", "تعز"],
        "العراق": ["بغداد", "البصرة", "الموصل"],
        "الأردن": ["عمّان", "الزرقاء", "إربد"],
        "فلسطين": ["القدس", "غزة", "نابلس"],
        "لبنان": ["بيروت", "طرابلس", "صيدا"],
        "سوريا": ["دمشق", "حلب", "حمص"],
        "مصر": ["القاهرة", "الإسكندرية", "الجيزة"],
        "السودان": ["الخرطوم", "أم درمان", "بورتسودان"],
        "ليبيا": ["طرابلس", "بنغازي", "مصراتة"],
        "تونس": ["تونس", "صفاقس", "سوسة"],
        "الجزائر": ["الجزائر", "وهران", "قسنطينة"],
        "المغرب": ["الرباط", "الدار البيضاء", "مراكش"],
        "موريتانيا": ["نواكشوط", "نواذيبو", "كيفه"],
        "الصومال": ["مقديشو", "هرجيسا", "بوصاصو"],
        "جيبوتي": ["جيبوتي", "علي صبيح", "تاجورة"],
        "جزر القمر": ["موروني", "موتسامودو", "فومبوني"],
    }

    for country, cities in samples.items():
        assert f'"{country}"' in html
        for city in cities:
            assert city in html


if __name__ == "__main__":
    test_arab_city_catalog_is_present_and_connected_to_country_selects()
    test_city_catalog_covers_all_arab_countries_with_multiple_cities()
    print("Arab cities tests passed")
