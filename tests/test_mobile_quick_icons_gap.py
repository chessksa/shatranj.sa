from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260909-playgap1"


def final_mobile_play_action_section():
    css = (ROOT / "home-theme-base.css").read_text(encoding="utf-8")
    start = "/* MOBILE PLAY ACTIONS 60PX 18PX 20260906 */"
    end = "/* MOBILE INVITE BUTTON MATCH 20260906 */"
    assert start in css and end in css
    return css.split(start, 1)[1].split(end, 1)[0]


def test_actual_mobile_four_action_grid_uses_one_pixel_gap():
    section = final_mobile_play_action_section()
    assert "grid-template-columns:repeat(3,minmax(0,1fr))!important" in section
    assert "grid-template-rows:repeat(2,60px)!important" in section
    assert "gap:1px!important" in section
    assert "gap:10px!important" not in section


def test_fourth_invite_control_is_really_injected_into_home_actions():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    invite = (ROOT / "home-invite.js").read_text(encoding="utf-8")
    assert 'id="homeBoardActions" class="home-board-actions"' in html
    assert "document.querySelector('#homeBoardActions')" in invite
    assert "wrap.className = 'home-invite-wrap'" in invite
    assert 'id="homeInviteToggle"' in invite


def test_mobile_play_gap_stylesheets_are_cache_busted():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    theme = (ROOT / "home-theme.css").read_text(encoding="utf-8")
    assert f'href="home-theme.css?v={VERSION}"' in html
    assert f'@import url("./home-theme-base.css?v={VERSION}");' in theme


if __name__ == "__main__":
    test_actual_mobile_four_action_grid_uses_one_pixel_gap()
    test_fourth_invite_control_is_really_injected_into_home_actions()
    test_mobile_play_gap_stylesheets_are_cache_busted()
    print("actual mobile four-action gap: PASS")
