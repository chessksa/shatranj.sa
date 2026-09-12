from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_navigation_does_not_show_puzzles():
    nav = read("v2/site/nav.mjs")
    shell = read("v2/site/shell.mjs")

    assert "id:'puzzles'" not in nav
    assert "label:'الألغاز'" not in nav
    assert "'puzzles'" not in shell.split("const coreIds =", 1)[1].split(";", 1)[0]
    assert "puzzle-battle.html" not in shell
