from pathlib import Path

CSS = (Path(__file__).parents[1] / "ranking-top-three.css").read_text(encoding="utf-8")


def test_top_three_keep_dark_table_and_highlight_rank_only():
    assert "#fff7dc" not in CSS
    assert "#f2f3f5" not in CSS
    assert "#f6e5d5" not in CSS
    assert "#ffefb8" not in CSS
    assert "#e8eaed" not in CSS
    assert "#f0d8c3" not in CSS
    assert "background:" not in CSS
    assert "#d7b45e" in CSS
    assert "#c5ced6" in CSS
    assert "#c9875b" in CSS


def test_top_three_have_thin_side_accent_without_icons():
    assert "box-shadow:inset -3px 0" in CSS
    assert "nth-child(1) .rank-number" in CSS
    assert "nth-child(2) .rank-number" in CSS
    assert "nth-child(3) .rank-number" in CSS
    assert "🏅" not in CSS
    assert "🥇" not in CSS
    assert "🥈" not in CSS
    assert "🥉" not in CSS
