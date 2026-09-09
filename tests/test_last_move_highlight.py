from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def require(path, *needles):
    text = (ROOT / path).read_text(encoding="utf-8")
    for needle in needles:
        assert needle in text, f"{path} is missing: {needle}"
    return text


def run_node_helper(source):
    helper = (ROOT / "last-move-highlight.mjs").resolve().as_uri()
    source = source.replace("__HELPER__", helper)
    with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False, encoding="utf-8") as handle:
        handle.write(source)
        script = handle.name
    result = subprocess.run(["node", script], capture_output=True, text=True)
    if result.returncode:
        raise AssertionError(result.stdout + result.stderr)


def test_helper_behavior():
    run_node_helper(
        r'''
import {inferLastMoveFromFens, latestMoveFromServerMoves} from '__HELPER__';

class FakeChess {
  constructor(fen){ this.fenValue=fen; }
  moves(){
    if(this.fenValue==='start') return [{from:'e2',to:'e4',san:'e4'},{from:'g1',to:'f3',san:'Nf3'}];
    return [];
  }
  move(move){
    if(this.fenValue==='start' && move.from==='e2' && move.to==='e4'){
      this.fenValue='after-e4';
      return {from:'e2',to:'e4'};
    }
    if(this.fenValue==='start' && move.from==='g1' && move.to==='f3'){
      this.fenValue='after-nf3';
      return {from:'g1',to:'f3'};
    }
    return null;
  }
  fen(){ return this.fenValue; }
}

const exact=inferLastMoveFromFens('start','after-e4',FakeChess);
if(!exact || exact.from!=='e2' || exact.to!=='e4') throw new Error('failed to infer exact move');
if(inferLastMoveFromFens('start','missing',FakeChess)!==null) throw new Error('must reject unknown transition');
const server=latestMoveFromServerMoves([{from:'e2',to:'e4'},{from:'e7',to:'e5'}]);
if(!server || server.from!=='e7' || server.to!=='e5') throw new Error('must prefer last server move');
'''
    )


def test_live_game_uses_native_markers():
    live = require(
        "play-v8.js",
        "const LAST_MOVE_MARKER",
        "class: 'marker-frame-last-move'",
        "board.removeMarkers(LAST_MOVE_MARKER)",
        "board.addMarker(LAST_MOVE_MARKER,lastMove.from)",
        "board.addMarker(LAST_MOVE_MARKER,lastMove.to)",
        "let lastMove = null;",
        "latestMoveFromServerMoves(row.moves)",
        "lastMove=serverLastMove || inferredLastMove;",
        "last-move-highlight.mjs?v=20260909-pawnhighlight1",
    )
    assert "squareOverlayPosition } from './last-move-highlight.mjs" not in live
    assert "document.createElement('span')" not in live[live.index("function renderLastMoveHighlight()") : live.index("function showMoveHints(")]


def test_computer_game_uses_native_markers():
    computer = require(
        "play-computer.js",
        "const LAST_MOVE_MARKER",
        "class: Markers",
        "sprite: 'last-move-markers.svg'",
        "board.removeMarkers(LAST_MOVE_MARKER)",
        "board.addMarker(LAST_MOVE_MARKER, lastMove.from)",
        "board.addMarker(LAST_MOVE_MARKER, lastMove.to)",
        "let lastMove = null;",
        "inferLastMoveFromFens(previousFen, fen, window.Chess)",
        "last-move-highlight.mjs?v=20260909-pawnhighlight1",
    )
    assert "squareOverlayPosition } from './last-move-highlight.mjs" not in computer
    assert "document.createElement('span')" not in computer[computer.index("function renderLastMoveHighlight()") : computer.index("function showMoveHints(")]


def test_native_marker_and_capture_hint_style():
    orange = "#ff7a00"
    square_capture = f'.square.capture::after{{content:"";position:absolute;inset:5px;border:2px solid {orange};border-radius:50%}}'
    marker_selector = f'.cm-chessboard .markers .marker.marker-frame-last-move{{stroke:{orange}!important;stroke-width:2px!important'
    page = require(
        "play-v10.html",
        marker_selector,
        "opacity:1",
        ".move-hint.capture::after",
        f"border:2px solid {orange}",
        square_capture,
        "play-computer.js?v=20260909-pawnhighlight1",
        "play-v8.js?v=20260909-pawnhighlight1",
    )
    legacy_page = require("play.html", square_capture)
    sprite = require("assets/last-move-markers.svg", 'id="markerFrame"', '<rect')
    assert 'width="40"' in sprite
    assert ".cm-board-host .cm-chessboard .marker.marker-frame-last-move" not in page
    assert "stroke:#ff0000!important;stroke-width:2px" not in page
    assert "border:2px solid #ff0000;box-shadow:none" not in page
    assert '.square.capture::after{content:"";position:absolute;inset:8px;border:2px solid #ff0000;border-radius:50%}' not in page
    assert '.square.capture::after{content:"";position:absolute;inset:8px;border:2px solid #ff0000;border-radius:50%}' not in legacy_page
    assert ".last-move-highlight{" not in page
    assert ".move-hint{position:absolute" in page


if __name__ == "__main__":
    test_helper_behavior()
    test_live_game_uses_native_markers()
    test_computer_game_uses_native_markers()
    test_native_marker_and_capture_hint_style()
    print("last-move and capture highlight: PASS")
