"""Safety/regression contracts for premoves, spectator audio and postgame review."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def source(path):
    return (ROOT / path).read_text(encoding="utf-8")


def test_red_premoves_are_queued_on_both_live_boards():
    for path, css_path, marker in (
        ("v2/home/inline-play.mjs", "v2/home/inline-play.css", "inline-play-square"),
        ("v2/play/app.js", "v2/play/play.css", "v2-square"),
    ):
        js, css = source(path), source(css_path)
        assert "queuedPremove" in js
        assert "const preparing" in js
        assert "if(preparing)" in js
        assert "tryPlayQueuedPremove()" in js
        assert "currentGame.turn!==queued.color" in js
        assert "Number(currentGame.ply)<=queued.ply" in js
        assert "preview?.legal===false" in js
        assert "queuedPremove=null" in js
        assert "clearPremove()" in js
        assert "target===queuedPremove.to" in js  # cancellation by tapping red destination
        assert "submitMove(" in js  # existing server validates real moves
        assert "premove-from" in css and "premove-to" in css
        assert "#e54c50" in css
        assert marker in js


def test_captured_pieces_represent_missing_starting_material():
    missing = source("v2/play/captured-pieces.mjs")
    assert "const INITIAL={p:8,n:2,b:2,r:2,q:1}" in missing
    assert "Math.max(0,INITIAL[type]-found[type])" in missing
    assert "renderCapturedPieces" in missing
    for path in (
        "v2/home/inline-play.mjs",
        "v2/home/inline-computer.mjs",
        "v2/home/desktop-board-shell.mjs",
        "v2/play/app.js",
        "human-watch.html",
        "computer-watch.html",
    ):
        assert "renderCapturedPieces" in source(path)
    assert "updateComputerCapturedPieces();" in source("v2/home/inline-computer.mjs")


def test_spectator_audio_requires_new_confirmed_move_and_user_unlock():
    spectator = source("v2/home/inline-tournament-spectator.mjs")
    listing = source("watch.html")
    sound = source("v2/board/move-sound.mjs")
    assert "previousFen&&previousFen!==row.fen" in spectator
    assert "moves.length>previousMoves" in spectator
    assert "shatranj:watch-move-audio" in spectator
    assert "shatranj:watch-move-audio" in listing
    assert "enableBoardSound()" in listing
    assert "export async function enableBoardSound()" in sound
    for path in ("human-watch.html", "computer-watch.html"):
        html = source(path)
        assert "enableWatchSound" in html
        assert "playBoardMoveSound(previous.fen" in html


def test_stockfish_reviews_are_postgame_only():
    notebook = source("v2/home/move-notebook.mjs")
    spectator = source("v2/home/inline-tournament-spectator.mjs")
    independent = source("v2/analysis/spectator-review.mjs")
    assert "completeReviewMoves" in notebook
    assert "updateMoveNotebook('spectator',moves,{finished:row.status==='finished'})" in spectator
    assert "status!=='finished'" in independent
    assert "const n=Math.min(14,sequence.length)" in independent
    assert "تقييم تقريبي" in independent
    for page in ("human-watch.html", "computer-watch.html"):
        html = source(page)
        assert "postGameAnalysis" in html
        assert "analyzeFinishedSpectator" in html


def test_new_features_are_freshly_versioned():
    home = source("index.html")
    mobile = source("play-v2.html")
    watch = source("watch.html")
    assert 'content="20261019-centered-home-stats-v2"' in home
    assert "play.css?v=20261019-adaptive-live-gold-row-v1" in mobile
    assert "app.js?v=20261019-adaptive-live-gold-row-v1" in mobile
    assert "human-watch.html?v=20261019-adaptive-live-gold-row-v1" in watch
    assert "computer-watch.html?v=20261019-adaptive-live-gold-row-v1" in watch
