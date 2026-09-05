from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")
PLAY = (ROOT / "play-v10.html").read_text(encoding="utf-8")
COMPUTER = ROOT / "play-computer.js"
ENGINE_JS = ROOT / "vendor" / "stockfish" / "stockfish-18-lite-single.js"
ENGINE_WASM = ROOT / "vendor" / "stockfish" / "stockfish-18-lite-single.wasm"

assert 'href="play-v10.html?computer=1"' in INDEX, 'home must expose computer play without protected-play login gate'
assert 'اللعب ضد الكمبيوتر' in INDEX, 'computer play button label is missing'
assert "const computerMode = params.has('computer');" in PLAY, 'play page must detect computer mode'
assert "s.src='play-computer.js?v=20260906-1'" in PLAY, 'computer mode must load its own controller'

assert COMPUTER.exists(), 'play-computer.js is missing'
code = COMPUTER.read_text(encoding="utf-8")
assert "easy: { skill: 2" in code
assert "medium: { skill: 8" in code
assert "hard: { skill: 16" in code
assert "new Worker('vendor/stockfish/stockfish-18-lite-single.js')" in code
assert "setoption name Skill Level value" in code
assert "position fen ${game.fen()}" in code
assert "bestmove" in code
assert "supabase.rpc" not in code, 'computer games must not touch rating/live-game RPCs'

assert ENGINE_JS.exists(), 'local Stockfish worker is missing'
assert ENGINE_WASM.exists(), 'local Stockfish wasm is missing'
assert ENGINE_WASM.stat().st_size > 1_000_000, 'Stockfish wasm looks incomplete'

print('computer play mode: PASS')
