from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")
PLAY = (ROOT / "play-v10.html").read_text(encoding="utf-8")
COMPUTER = ROOT / "play-computer.js"
EDGE = ROOT / "supabase" / "functions" / "computer-game" / "index.ts"
MIGRATION = ROOT / "supabase" / "migrations" / "20260906_computer_game_ratings.sql"
ENGINE_JS = ROOT / "vendor" / "stockfish" / "stockfish-18-lite-single.js"
ENGINE_WASM = ROOT / "vendor" / "stockfish" / "stockfish-18-lite-single.wasm"

assert 'href="play-v10.html?computer=1"' in INDEX
assert 'اللعب ضد الكمبيوتر' in INDEX
assert "const computerMode = params.has('computer');" in PLAY

assert COMPUTER.exists(), 'play-computer.js is missing'
code = COMPUTER.read_text(encoding="utf-8")
assert "easy: { skill: 2, movetime: 140, label: 'سهل', points: 5" in code
assert "medium: { skill: 8, movetime: 320, label: 'متوسط', points: 10" in code
assert "hard: { skill: 16, movetime: 700, label: 'صعب', points: 20" in code
assert "fill','#d6cfbf','important'" in code, 'computer board light squares must match live play'
assert "fill','#246f77','important'" in code, 'computer board dark squares must match live play'
assert "forceBoardSquareColors" in code and "watchBoardSquareColors" in code
assert "supabase.functions.invoke('computer-game'" in code, 'rated games must be settled through the server function'
assert ".from('players').update" not in code, 'browser must never update rating directly'
assert "new Worker('vendor/stockfish/stockfish-18-lite-single.js')" in code, 'guest/local mode should retain Stockfish'

assert EDGE.exists(), 'server computer-game Edge Function source is missing'
edge = EDGE.read_text(encoding="utf-8")
assert "easy: 5" in edge and "medium: 10" in edge and "hard: 20" in edge
assert "action === 'start'" in edge
assert "action === 'move'" in edge
assert "action === 'resign'" in edge
assert "apply_computer_game_rating" in edge
assert "Chess" in edge, 'server must validate legal chess moves'

assert MIGRATION.exists(), 'computer-game rating migration is missing'
sql = MIGRATION.read_text(encoding="utf-8").lower()
assert 'create table if not exists public.computer_games' in sql
assert 'enable row level security' in sql
assert 'revoke all on table public.computer_games from anon, authenticated' in sql
assert 'create or replace function public.apply_computer_game_rating' in sql
assert "when 'easy' then 5" in sql
assert "when 'medium' then 10" in sql
assert "when 'hard' then 20" in sql
assert 'rating_applied' in sql
assert 'grant execute on function public.apply_computer_game_rating(uuid) to service_role' in sql

assert ENGINE_JS.exists()
assert ENGINE_WASM.exists()
assert ENGINE_WASM.stat().st_size > 1_000_000

print('computer rated mode and board colors: PASS')
