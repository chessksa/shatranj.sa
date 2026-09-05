from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_ranking_filter_labels_and_font_size():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "home-theme.css").read_text(encoding="utf-8")

    assert '<option value="">الدولة</option>' in html
    assert "first.textContent=country?'المدينة':'اختر الدولة أولًا';" in html
    assert "#ranking .ranking-filters select" in css
    assert "font-size:12px!important;" in css


if __name__ == "__main__":
    test_ranking_filter_labels_and_font_size()
    print("Ranking filter label tests passed")
