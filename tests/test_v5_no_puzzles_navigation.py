from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_navigation_shows_puzzles_as_primary_mobile_destination():
    nav = read("v2/site/nav.mjs")
    shell = read("v2/site/shell.mjs")

    assert "id:'puzzles',label:'الألغاز',icon:'◆',href:'puzzles.html'" in nav
    assert "'puzzles.html':'puzzles'" in shell
    assert "const coreIds = ['home','play','puzzles','profile'];" in shell
    assert "label:'Puzzle Battle'" not in shell
