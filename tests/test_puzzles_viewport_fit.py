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
