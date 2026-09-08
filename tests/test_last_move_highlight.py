from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def require(path, *needles):
    text = (ROOT / path).read_text(encoding="utf-8")
    for needle in needles:
        assert needle in text, f"{path} is missing: {needle}"
    return text


def test_helper_behavior():
    with tempfile.TemporaryDirectory() as td:
        script = Path(td) / "test.mjs"
        script.write_text(
            f"""
import assert from 'node:assert/strict';
import {{ fenPositionKey, inferLastMoveFromFens, latestMoveFromServerMoves, squareOverlayPosition }} from {repr((ROOT / 'last-move-highlight.mjs').as_uri())};

assert.equal(
  fenPositionKey('8/8/8/8/8/8/8/8 w - - 0 1'),
  '8/8/8/8/8/8/8/8 w -'
);

class FakeChess {{
  constructor(fen) {{ this.state = fen; }}
  moves() {{
    if (!this.state.startsWith('before ')) return [];
    return [
      {{from: 'e2', to: 'e4'}},
      {{from: 'd2', to: 'd4'}}
    ];
  }}
  move(spec) {{
    if (!this.state.startsWith('before ')) return null;
    if (spec.from === 'e2' && spec.to === 'e4') {{
      this.state = 'after b KQkq e3 0 1';
      return spec;
    }}
    if (spec.from === 'd2' && spec.to === 'd4') {{
      this.state = 'other b KQkq d3 0 1';
      return spec;
    }}
    return null;
  }}
  fen() {{ return this.state; }}
}}

assert.deepEqual(
  inferLastMoveFromFens('before w KQkq - 0 1', 'after b KQkq e3 8 17', FakeChess),
  {{from: 'e2', to: 'e4'}}
);
assert.deepEqual(
  inferLastMoveFromFens('before w KQkq - 0 1', 'after b KQkq - 8 17', FakeChess),
  {{from: 'e2', to: 'e4'}}
);
assert.deepEqual(
  latestMoveFromServerMoves([{{from:'e2',to:'e4'}},{{from:'e7',to:'e5'}}]),
  {{from:'e7',to:'e5'}}
);
assert.deepEqual(
  latestMoveFromServerMoves([{{from:'e2',to:'e4'}},{{from:'e7',to:'e5'}},{{from:'g1',to:'f3'}}]),
  {{from:'g1',to:'f3'}}
);
assert.equal(latestMoveFromServerMoves([]), null);
assert.equal(latestMoveFromServerMoves(null), null);
assert.deepEqual(squareOverlayPosition('a8', false), {{left:0,top:0}});
assert.deepEqual(squareOverlayPosition('h1', false), {{left:87.5,top:87.5}});
assert.deepEqual(squareOverlayPosition('a8', true), {{left:87.5,top:87.5}});
assert.equal(squareOverlayPosition('z9', false), null);
""",
            encoding="utf-8",
        )
        subprocess.run(["node", str(script)], check=True, cwd=ROOT)


def test_live_game_uses_native_markers():
    live = require(
        "play-v8.js",
        "class:Markers",
        "sprite:'last-move-markers.svg'",
        "board.removeMarkers(LAST_MOVE_MARKER)",
        "board.addMarker(LAST_MOVE_MARKER,lastMove.from)",
        "board.addMarker(LAST_MOVE_MARKER,lastMove.to)",
        "let lastMove = null;",
        "inferLastMoveFromFens(previousFen, row.fen, Chess)",
        "latestMoveFromServerMoves(row.moves)",
        "last-move-highlight.mjs?v=20260908-3",
    )
    assert "squareOverlayPosition } from './last-move-highlight.mjs" not in live
    assert "document.createElement('span')" not in live[live.index("function renderLastMoveHighlight()") : live.index("function showMoveHints(")]


def test_computer_game_uses_native_markers():
    computer = require(
        "play-computer.js",
        "class:Markers",
        "sprite:'last-move-markers.svg'",
        "board.removeMarkers(LAST_MOVE_MARKER)",
        "board.addMarker(LAST_MOVE_MARKER, lastMove.from)",
        "board.addMarker(LAST_MOVE_MARKER, lastMove.to)",
        "let lastMove = null;",
        "inferLastMoveFromFens(previousFen, fen, window.Chess)",
        "last-move-highlight.mjs?v=20260908-2",
    )
    assert "squareOverlayPosition } from './last-move-highlight.mjs" not in computer
    assert "document.createElement('span')" not in computer[computer.index("function renderLastMoveHighlight()") : computer.index("function showMoveHints(")]


def test_native_marker_style_sprite_and_cache_bust():
    page = require(
        "play-v10.html",
        ".marker-frame-last-move",
        "stroke:#ff6b6b",
        "stroke-width:1px",
        "opacity:1",
        "play-computer.js?v=20260909-stalereply1",
        "play-v8.js?v=20260909-tournamentbadge1",
    )
    sprite = require("assets/last-move-markers.svg", 'id="markerFrame"', '<rect')
    assert 'width="40"' in sprite
    assert ".last-move-highlight{" not in page
    assert ".move-hint{position:absolute" in page


if __name__ == "__main__":
    test_helper_behavior()
    test_live_game_uses_native_markers()
    test_computer_game_uses_native_markers()
    test_native_marker_style_sprite_and_cache_bust()
    print("last-move highlight: PASS")
