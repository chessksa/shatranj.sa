from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_tournament_tables_do_not_block_pull_to_refresh():
    loader = (ROOT / "site-presence.js").read_text(encoding="utf-8")
    pull = (ROOT / "pull-to-refresh.js").read_text(encoding="utf-8")

    assert "[data-no-pull-refresh]" in pull
    assert "scroll.dataset.noPullRefresh='1';" not in loader
    assert "scroll.style.touchAction='pan-y';" in loader
