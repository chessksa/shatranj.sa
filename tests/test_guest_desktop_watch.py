"""Contract tests for guest desktop match spectating on the persistent board."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
home = (ROOT / "index.html").read_text(encoding="utf-8")
shell = (ROOT / "v2/home/desktop-board-shell.mjs").read_text(encoding="utf-8")
viewer = (ROOT / "v2/home/inline-tournament-spectator.mjs").read_text(encoding="utf-8")
inline_play = (ROOT / "v2/home/inline-play.mjs").read_text(encoding="utf-8")
listing = (ROOT / "watch.html").read_text(encoding="utf-8")
tune = (ROOT / "v2/home/desktop-board-shell-tune.mjs").read_text(encoding="utf-8")
tune_css = (ROOT / "v2/home/desktop-board-shell-tune.css").read_text(encoding="utf-8")

def test_guest_watch_can_open_with_zero_matches():
    assert 'data-live-matches-watch href="watch.html#current"' in home
    assert "link.setAttribute('href',watchHref);" in home
    assert "link.removeAttribute('href')" not in home
    assert "link.setAttribute('aria-disabled','true')" not in home
    assert 'class="desktop-live-stat desktop-live-stat-watch"' in tune
    assert 'data-desktop-nav="watch"' in tune
    assert 'button.desktop-live-stat-watch' in tune_css

def test_embed_sends_safe_game_selection_to_canonical_board():
    assert "data-game-id=" in listing and "data-game-type=" in listing
    assert "shatranj:watch-main-board" in listing
    assert "window.parent.postMessage(" in listing
    assert "event.source!==frame.contentWindow" in shell
    assert "event.origin!==location.origin" in shell
    assert "module.mountInlineTournamentSpectator(gameId,{gameType})" in shell
    assert "id!=='watch'" not in shell.split("const DASHBOARD_ROUTES=", 1)[1].split("restoreMovedContent()", 1)[0]
    assert "lastDashboardView" in shell

def test_read_only_guest_spectator_reuses_existing_board():
    assert "getElementById('homeBoardPreview')" in viewer
    assert "get_public_v2_spectator_game_state" in viewer
    assert "get_spectator_live_game_state" in viewer
    assert "get_public_computer_game" in viewer
    assert "rpc(rpcName,{p_game_id:id})" in viewer
    assert "previewClick?.classList.contains('inline-tournament-spectator')" in inline_play
    assert "const saved=document.createDocumentFragment()" in viewer
    assert "host.replaceChildren(live.saved)" in viewer
