from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_play_entry_loads_desktop_fit_stylesheet():
    entry = read("play-entry-v16.html")
    assert "play-desktop-fit-v20.css" in entry


def test_desktop_fit_contains_play_surface_and_matches_notification_control():
    css_path = ROOT / "play-desktop-fit-v20.css"
    assert css_path.exists(), "desktop play fit stylesheet is missing"
    css = css_path.read_text(encoding="utf-8")

    assert "@media (min-width:901px)" in css
    assert "#gamePage .layout" in css
    assert "min-width:0" in css
    assert ".board-frame" in css and "max-width:100%" in css
    assert ".side-panel" in css and ".panel-stack" in css
    assert "#siteNotificationHost" in css
    assert ".site-notification-bell" in css
    assert "width:64px" in css and "height:38px" in css
    assert ".header-tile-svg" in css
    assert "width:13px" in css and "height:13px" in css
    assert ".header-tile-label" in css
    assert "font-size:11px" in css
