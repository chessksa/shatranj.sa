from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260909-orange82"
OLD_VERSION = "20260908-red2"


def test_home_play_links_force_fresh_play_document():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    assert f'href="play-v10.html?ui={VERSION}"' in html
    assert f'href="play-v10.html?computer=1&ui={VERSION}"' in html
    assert html.count(f'play-v10.html?ui={VERSION}') >= 2
    assert f"ui={OLD_VERSION}" not in html


if __name__ == "__main__":
    test_home_play_links_force_fresh_play_document()
    print("play entry cache-bust: PASS")
