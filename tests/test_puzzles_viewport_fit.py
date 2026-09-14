from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_puzzles_page_fits_viewport_without_page_scroll():
    html = (ROOT / 'puzzles.html').read_text(encoding='utf-8')

    assert 'Puzzle viewport fit 20260914' in html
    assert 'body.platform-page.puzzle-fit-page' in html
    assert 'overflow:hidden!important' in html
    assert 'height:100dvh' in html
    assert 'min-height:0' in html
    assert '.puzzle-layout' in html
    assert 'grid-template-rows:minmax(0,1fr)' in html
    assert '.puzzle-board' in html
    assert 'max-height:100%' in html


def test_puzzles_mobile_keeps_board_and_controls_in_one_viewport():
    html = (ROOT / 'puzzles.html').read_text(encoding='utf-8')

    marker = html.split('Puzzle viewport fit 20260914', 1)[1]
    assert '@media(max-width:900px)' in marker
    assert 'overflow:hidden!important' in marker
    assert 'grid-template-columns:1fr' in marker
    assert 'grid-template-rows:auto minmax(0,1fr) auto' in marker
    assert 'max-height:min(58dvh,100%)' in marker
    assert '.puzzle-side' in marker
    assert 'overflow:hidden' in marker


def test_puzzle_side_stays_in_second_desktop_grid_column():
    html = (ROOT / 'puzzles.html').read_text(encoding='utf-8')

    assert '.puzzle-board-wrap{grid-column:1;grid-row:1' in html
    assert '.puzzle-side{grid-column:2;grid-row:1' in html
    mobile = html.split('@media(max-width:900px)', 1)[1]
    assert '.puzzle-board-wrap{grid-column:1;grid-row:1' in mobile
    assert '.puzzle-side{grid-column:1;grid-row:2' in mobile


def test_puzzles_desktop_matches_play_board_geometry_and_style():
    html = (ROOT / 'puzzles.html').read_text(encoding='utf-8')

    desktop = html.split('Puzzle play-layout alignment 20260914', 1)[1]
    desktop = desktop.split('@media(max-width:900px)', 1)[0]

    assert 'grid-template-columns:minmax(0,1fr) clamp(340px,29vw,440px)' in desktop
    assert '.puzzle-layout{display:contents!important}' in desktop
    assert '.puzzle-board-wrap{grid-column:1;grid-row:1/4' in desktop
    assert 'place-items:center end' in desktop
    assert '.puzzle-board-frame{width:min(100%,calc(100dvh - 34px),920px)' in desktop
    assert '<div class="puzzle-board-frame">' in html
    assert '.puzzle-square.light{background:#d6cfbf}' in html
    assert '.puzzle-square.dark{background:#246f77}' in html


def test_puzzles_board_is_right_aligned_and_has_uniform_squares():
    html = (ROOT / 'puzzles.html').read_text(encoding='utf-8')

    desktop = html.split('Puzzle play-layout alignment 20260914', 1)[1]
    desktop = desktop.split('@media(max-width:900px)', 1)[0]

    assert 'direction:ltr!important' in desktop
    assert 'justify-self:end' in desktop
    assert 'grid-template-columns:repeat(8,minmax(0,1fr))' in html
    assert 'grid-template-rows:repeat(8,minmax(0,1fr))' in html
    assert 'box-shadow:inset 0 0 0 .5px rgba(2,47,51,.26)' in html
