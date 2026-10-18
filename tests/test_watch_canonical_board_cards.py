"""Watch layout: canonical board materials and read-only live player cards."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
board = (ROOT / "v2/home/inline-tournament-spectator.mjs").read_text(encoding="utf-8")
shell = (ROOT / "v2/home/desktop-board-shell.mjs").read_text(encoding="utf-8")
styles = (ROOT / "v2/home/desktop-board-shell-tune.css").read_text(encoding="utf-8")
preview = (ROOT / "v2/home/move-notebook.mjs").read_text(encoding="utf-8")
watch = (ROOT / "watch.html").read_text(encoding="utf-8")
home = (ROOT / "index.html").read_text(encoding="utf-8")

# Both sources use the canonical 64-square, a8-light board and same PNG sizing.
assert "(row+col)%2?'dark':'light'" in preview
assert "const light=(col+rank)%2===0" in board
assert "'desktop-board-square '+(light?'light':'dark')" in board
assert "desktop-board-preview-piece" in board
assert "decorateBoardCoordinate(el,(8-rank)*8+col,name)" in board
assert "data-board-theme" not in board  # Keep the user's existing preferences.
assert "host.replaceChildren(live.saved)" in board
assert ".inline-spectator-hud{display:none!important;}" in board
assert "inline-public-watch .desktop-board-square::before" in board
assert "if(live.fen===fen&&grid.children.length===64)return true;" in board

# Existing approved online-player cards are reused, only with noninteractive fields.
assert "createWatchPlayerCard('b')" in shell
assert "createWatchPlayerCard('w')" in shell
assert "className='inline-play-player-card desktop-watch-player-card'" in shell
assert "class=\"inline-play-player-name\" data-watch-name=" in shell
assert "class=\"inline-play-clock\" data-watch-clock=" in shell
assert "className='desktop-watch-match-list'" in shell
assert "embeddedPageView(list,'watch.html'" in shell
assert "shatranj:public-watch-updated" in shell
assert "module.mountInlineTournamentSpectator(gameId,{gameType,presentation:'watch'})" in shell
assert "shatranj:watch-main-board" in watch
assert "data-watch-clock=" in board
assert "querySelector('#desktopDashboardView.watch-view .desktop-dashboard-view-body')" in board
assert "watchWhiteRating" in shell and "watchBlackRating" in shell
assert "inline-play-search-button" not in shell.split("function createWatchPlayerCard(",1)[1].split("function watchView(",1)[0]
assert "inline-play-danger" not in shell.split("function createWatchPlayerCard(",1)[1].split("function watchView(",1)[0]

# Fit both cards and the embedded match list into the center column.
assert ".desktop-watch-match-list" in styles
assert ".desktop-watch-player-card[hidden]{display:none!important}" in styles
assert "--live-card-height:clamp(124px,17dvh,160px)" in styles
assert "gap:6px!important;padding:6px!important" in styles
assert "--watch-avatar-size:" in styles
assert "color:#D8B665!important" in styles
assert "font-size:clamp(20px,1.5vw,25px)!important" in styles
assert "font-size:clamp(15px,1.1vw,18px)!important" in styles
assert "min-height:clamp(74px,10dvh,100px)!important" in styles
assert "font-size:clamp(34px,2.7vw,43px)!important" in styles
assert "min-height:64px!important" in styles  # short desktop windows
assert "20261019-adaptive-live-gold-row-v1" in home

assert "data-watch-photo=" in shell
print("spectator canonical board + read-only player cards: PASS")
