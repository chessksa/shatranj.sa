from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")
THEME = (ROOT / "home-theme.css").read_text(encoding="utf-8")


def test_homepage_has_approved_hero_structure():
    assert 'id="homeHero"' in INDEX
    assert 'مرحبًا بك في' in INDEX
    assert 'شطرنج السعودية' in INDEX
    assert 'مجتمع سعودي لعشاق الشطرنج' in INDEX
    assert 'id="homeBoardPreview"' in INDEX
    assert INDEX.count('id="homeBoardPreview"') == 1


def test_homepage_has_approved_primary_actions_and_features():
    assert 'العب الآن' in INDEX
    assert 'دعوة لاعب' in INDEX
    for label in ('التصنيف', 'اللاعبون', 'البطولات', 'دليل الموقع'):
        assert label in INDEX


def test_live_stats_are_present_in_hero_without_duplicate_ids():
    assert INDEX.count('id="headerPlayersCount"') == 1
    assert INDEX.count('id="headerMatchesCount"') == 1
    assert 'لاعب مسجل' in INDEX
    assert 'مباراة حالية' in INDEX
    assert 'يشاهد الآن' in INDEX


def test_new_home_theme_matches_dark_teal_gold_reference_and_is_responsive():
    assert 'APPROVED HOME HERO 20260904' in THEME
    assert '.home-hero' in THEME
    assert '.home-hero-grid' in THEME
    assert '.hero-live-stats' in THEME
    assert '.home-feature-grid' in THEME
    assert '@media(max-width:900px)' in THEME
    assert '#082d2f' in THEME
    assert '#d4b467' in THEME
