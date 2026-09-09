from pathlib import Path

CSS = (Path(__file__).parents[1] / "ranking-top-three.css").read_text(encoding="utf-8")


def test_top_three_ranking_rows_have_distinct_full_row_highlights():
    assert "#ranking tbody tr:not(.ranking-placeholder):nth-child(1) > td" in CSS
    assert "#ranking tbody tr:not(.ranking-placeholder):nth-child(2) > td" in CSS
    assert "#ranking tbody tr:not(.ranking-placeholder):nth-child(3) > td" in CSS
    assert "#fff7dc" in CSS
    assert "#f2f3f5" in CSS
    assert "#f6e5d5" in CSS


def test_ranking_highlights_do_not_add_medal_icons():
    assert "🏅" not in CSS
    assert "🥇" not in CSS
    assert "🥈" not in CSS
    assert "🥉" not in CSS
