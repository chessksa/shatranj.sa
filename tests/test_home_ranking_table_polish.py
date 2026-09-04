from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
CSS = (ROOT / "home-theme.css").read_text(encoding="utf-8")


def test_ranking_title_stays_on_one_line_and_filters_are_compact():
    assert re.search(r'#rankingTitle\{[^}]*white-space:nowrap', CSS, re.S)
    assert re.search(r'#ranking \.ranking-filters\{[^}]*max-width:280px', CSS, re.S)
    assert re.search(r'#ranking \.ranking-filters select\{[^}]*height:32px', CSS, re.S)


def test_ranking_cells_are_centered_with_vertical_dividers():
    assert re.search(r'#ranking th,#ranking td\{[^}]*text-align:center!important', CSS, re.S)
    assert '#ranking th:not(:last-child),#ranking td:not(:last-child)' in CSS
    assert 'border-left:1px solid rgba(216,182,101,.18)!important' in CSS


def test_home_play_and_invite_actions_are_equal_and_compact():
    assert re.search(r'\.home-hero \.home-board-actions\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important', CSS, re.S)
    assert re.search(r'\.home-hero \.home-board-actions>\.btn,\s*\.home-hero \.home-board-actions>\.home-invite-wrap>\.btn\{[^}]*height:56px!important', CSS, re.S)
    assert re.search(r'\.hero-action-icon\{[^}]*width:26px[^}]*height:26px', CSS, re.S)
