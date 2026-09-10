from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_watch_only_rerenders_changed_lists_and_preserves_scroll_position():
    html = read("watch.html")
    assert "function gamesSignature" in html
    assert "let currentSignature=''" in html
    assert "let finishedSignature=''" in html
    assert "const scrollTop=wrap?.scrollTop||0" in html
    assert "wrap.scrollTop=scrollTop" in html
    assert "if(currentKey!==currentSignature)" in html
    assert "if(finishedKey!==finishedSignature)" in html


def test_profile_dashboard_icons_fit_in_two_mobile_rows_without_horizontal_scroll():
    js = read("site-notifications.js")
    assert "function installCompactProfileIconGrid" in js
    assert "grid-template-columns:repeat(5,minmax(0,1fr))!important" in js
    assert "overflow-x:hidden!important" in js
    assert "white-space:normal!important" in js
    assert "installCompactProfileIconGrid();" in js
