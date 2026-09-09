from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260909-rankingtitle1"
SPACING_MARKER = "/* MOBILE ALL INTERFACE SPACING 4PX 20260909 */"
RANKING_MARKER = "/* MOBILE RANKING TITLE + JOINED HEAD 20260909 */"


def css_text():
    return (ROOT / "home-theme-base.css").read_text(encoding="utf-8")


def spacing_section():
    css = css_text()
    assert SPACING_MARKER in css
    return css.split(SPACING_MARKER, 1)[1]


def ranking_fix_section():
    css = css_text()
    assert RANKING_MARKER in css
    return css.split(RANKING_MARKER, 1)[1]


def test_existing_mobile_interface_gaps_remain_four_pixels():
    section = spacing_section()
    required = [
        ".hero-live-stats{column-gap:4px!important;row-gap:4px!important}",
        ".home-feature-grid{column-gap:4px!important;row-gap:4px!important}",
        ".quick-icons{column-gap:4px!important;row-gap:4px!important}",
        ".header-live{column-gap:4px!important;row-gap:4px!important}",
        "#ranking .ranking-filters{column-gap:4px!important;row-gap:4px!important}",
        ".home-hero .home-board-actions{column-gap:4px!important;row-gap:4px!important}",
        ".compact-member-nav .nav-user{column-gap:4px!important;row-gap:4px!important}",
    ]
    for rule in required:
        assert rule in section, rule


def test_ranking_title_is_not_clipped_on_mobile():
    section = ranking_fix_section()
    assert "#rankingTitle{overflow:visible!important;text-overflow:clip!important;line-height:1.45!important;padding-block:2px!important}" in section


def test_ranking_head_is_attached_to_table_without_gap():
    section = ranking_fix_section()
    assert "#ranking .head{margin:0!important}" in section
    assert "#ranking .table-card{margin-top:0!important}" in section
    assert "#ranking .head{margin:0 0 4px!important}" not in section


def test_ranking_fix_stylesheets_are_cache_busted():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    theme = (ROOT / "home-theme.css").read_text(encoding="utf-8")
    assert f'href="home-theme.css?v={VERSION}"' in html
    assert f'@import url("./home-theme-base.css?v={VERSION}");' in theme


if __name__ == "__main__":
    test_existing_mobile_interface_gaps_remain_four_pixels()
    test_ranking_title_is_not_clipped_on_mobile()
    test_ranking_head_is_attached_to_table_without_gap()
    test_ranking_fix_stylesheets_are_cache_busted()
    print("mobile ranking title and joined table head: PASS")
