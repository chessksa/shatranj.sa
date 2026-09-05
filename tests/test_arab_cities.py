from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_arab_city_catalog_is_present_and_connected_to_country_inputs():
    html = read("index.html")

    assert "import { ARAB_CITIES_DATA } from './arab-cities.js';" in html
    assert "const ARAB_CITIES=ARAB_CITIES_DATA;" in html
    assert "populateCityList" in html
    assert 'list="signupCityOptions"' in html
    assert '<select id="cityFilter"' in html
    assert 'id="cityFilterOptions"' not in html
    assert "$('#signupRegion').addEventListener('change'" in html
    assert "$('#regionFilter').addEventListener('change'" in html


def test_ranking_city_filter_is_a_visible_country_dependent_dropdown():
    html = read("index.html")

    assert '<select id="cityFilter" disabled' in html
    assert '<option value="">اختر الدولة أولًا</option>' in html
    assert "populateRankingCitySelect" in html
    assert "cityFilter.disabled=!country" in html
    assert "كل مدن الدولة" in html


def test_city_catalog_covers_all_arab_countries_with_multiple_cities():
    cities_js = read("arab-cities.js")

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
        assert f'"{country}"' in cities_js
        for city in cities:
            assert city in cities_js


if __name__ == "__main__":
    test_arab_city_catalog_is_present_and_connected_to_country_inputs()
    test_ranking_city_filter_is_a_visible_country_dependent_dropdown()
    test_city_catalog_covers_all_arab_countries_with_multiple_cities()
    print("Arab cities tests passed")
