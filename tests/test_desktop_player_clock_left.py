from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_desktop_player_cards_place_clock_on_left():
    css = (ROOT / "play-desktop-fit-v20.css").read_text(encoding="utf-8")

    assert 'grid-template-areas:"clock info avatar"' in css
    assert "direction:ltr!important" in css
    assert ".player-card .clock-box" in css and "grid-area:clock!important" in css
    assert ".player-card .avatar" in css and "grid-area:avatar!important" in css
    assert ".player-card .player-info" in css and "grid-area:info!important" in css
    assert "direction:rtl!important" in css


def test_desktop_matchmaking_panel_stays_rtl():
    css = (ROOT / "play-desktop-fit-v20.css").read_text(encoding="utf-8")

    assert ".opponent-search-panel" in css
    assert "direction:rtl!important" in css
