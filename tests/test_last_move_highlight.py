from pathlib import Path
import subprocess
import textwrap

ROOT = Path(__file__).resolve().parents[1]


def require(path, *needles):
    text = (ROOT / path).read_text(encoding="utf-8")
    for needle in needles:
        assert needle in text, f"{path} is missing: {needle}"
    return text


def test_helper_behavior():
    helper = ROOT / "last-move-highlight.mjs"
    assert helper.exists(), "last-move-highlight.mjs must exist"
    script = textwrap.dedent(
        r"""
        import assert from 'node:assert/strict';
        import { fenPositionKey, inferLastMoveFromFens, squareOverlayPosition } from './last-move-highlight.mjs';

        assert.equal(fenPositionKey('8/8/8/8/8/8/8/8 w - - 0 1'), '8/8/8/8/8/8/8/8 w - -');
        assert.deepEqual(squareOverlayPosition('a8', false), {left: 0, top: 0});
        assert.deepEqual(squareOverlayPosition('h1', false), {left: 87.5, top: 87.5});
        assert.deepEqual(squareOverlayPosition('a8', true), {left: 87.5, top: 87.5});
        assert.equal(squareOverlayPosition('z9', false), null);

        class FakeChess {
          constructor(fen) { this.state = fen; }
          moves() {
            if (!this.state.startsWith('before ')) return [];
            return [
              {from: 'e2', to: 'e4'},
              {from: 'd2', to: 'd4'}
            ];
          }
          move(spec) {
            if (!this.state.startsWith('before ')) return null;
            if (spec.from === 'e2' && spec.to === 'e4') {
              this.state = 'after b KQkq e3 0 1';
              return spec;
            }
            if (spec.from === 'd2' && spec.to === 'd4') {
              this.state = 'other b KQkq d3 0 1';
              return spec;
            }
            return null;
          }
          fen() { return this.state; }
        }

        assert.deepEqual(
          inferLastMoveFromFens('before w KQkq - 0 1', 'after b KQkq e3 8 17', FakeChess),
          {from: 'e2', to: 'e4'}
        );
        assert.equal(
          inferLastMoveFromFens('before w KQkq - 0 1', 'before w KQkq - 7 12', FakeChess),
          null
        );
        """
    )
    subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=ROOT,
        check=True,
    )


def test_live_game_tracks_and_renders_last_move():
    live = require(
        "play-v8.js",
        "./last-move-highlight.mjs?v=20260908-1",
        "let lastMove = null;",
        "let ignoreNextLastMoveInference = false;",
        "function renderLastMoveHighlight()",
        "lastMove = { from: move.from, to: move.to };",
        "inferLastMoveFromFens(previousFen, row.fen, Chess)",
        "ignoreNextLastMoveInference = true;",
        "moveHintsEl.querySelectorAll('.move-hint')",
    )
    assert live.count("renderLastMoveHighlight();") >= 3


def test_computer_game_tracks_player_and_computer_moves():
    computer = require(
        "play-computer.js",
        "./last-move-highlight.mjs?v=20260908-1",
        "let lastMove = null;",
        "function renderLastMoveHighlight()",
        "function loadComputerFen(fen)",
        "inferLastMoveFromFens(previousFen, fen, window.Chess)",
        "lastMove = { from: move.from, to: move.to };",
        "moveHintsEl.querySelectorAll('.move-hint')",
    )
    assert computer.count("lastMove = { from: move.from, to: move.to };") >= 2
    assert computer.count("loadComputerFen(payload.fen)") >= 2


def test_highlight_style_and_cache_bust():
    page = require(
        "play-v10.html",
        ".last-move-highlight{",
        "background:rgba(255,180,90,.10)",
        "box-shadow:inset 0 0 0 3px rgba(255,180,90,.95)",
        "play-computer.js?v=20260908-lastmove1",
        "play-v8.js?v=20260908-lastmove1",
    )
    assert ".move-hint{position:absolute" in page


if __name__ == "__main__":
    test_helper_behavior()
    test_live_game_tracks_and_renders_last_move()
    test_computer_game_tracks_player_and_computer_moves()
    test_highlight_style_and_cache_bust()
    print("last-move highlight tests passed")
