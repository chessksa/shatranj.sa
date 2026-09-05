from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")
PLAY = (ROOT / "play-v10.html").read_text(encoding="utf-8")
MATCH = (ROOT / "play-v10-match.js").read_text(encoding="utf-8")
COMPUTER = ROOT / "play-computer.js"
EDGE = ROOT / "supabase" / "functions" / "computer-game" / "index.ts"
MIGRATION = ROOT / "supabase" / "migrations" / "20260906_computer_game_ratings.sql"
TIME_MIGRATION = ROOT / "supabase" / "migrations" / "20260906_time_controls_5_10_15.sql"
ENGINE_JS = ROOT / "vendor" / "stockfish" / "stockfish-18-lite-single.js"
ENGINE_WASM = ROOT / "vendor" / "stockfish" / "stockfish-18-lite-single.wasm"

assert 'href="play-v10.html?computer=1"' in INDEX
assert 'اللعب ضد الكمبيوتر' in INDEX
assert "const computerMode = params.has('computer');" in PLAY

# Every visible normal-play time choice is 5 / 10 / 15 only.
assert 'data-minutes="3"' not in PLAY, '3-minute games must be removed from the current play UI'
for minutes in (5, 10, 15):
    assert f'data-minutes="{minutes}"' in PLAY, f'{minutes}-minute option is missing from play UI'
assert 'startMatchmaking(btn.dataset.minutes)' in MATCH

assert COMPUTER.exists(), 'play-computer.js is missing'
code = COMPUTER.read_text(encoding="utf-8")
assert "easy: { skill: 8, movetime: 250, label: 'سهل', points: 5" in code
assert "medium: { skill: 14, movetime: 600, label: 'متوسط', points: 10" in code
assert "hard: { skill: 20, movetime: 1200, label: 'صعب', points: 20" in code
assert "const TIME_CONTROLS = [5, 10, 15];" in code
assert "function setupTimeChooser" in code, 'computer flow must choose time after level'
assert "startComputerGame(levelKey, minutes)" in code, 'computer game start must receive level and time'
assert "action: 'start', level: levelKey, minutes" in code, 'rated computer start must send time to server'
assert "action: 'timeout'" in code, 'rated computer clock expiry must be adjudicated by server'
assert "action: 'state'" in code, 'rated move errors must reconcile with authoritative server state before reverting the board'
assert "function formatClock" in code and "function startClockLoop" in code
assert "fill','#d6cfbf','important'" in code, 'computer board light squares must match live play'
assert "fill','#246f77','important'" in code, 'computer board dark squares must match live play'
assert "forceBoardSquareColors" in code and "watchBoardSquareColors" in code
assert "supabase.functions.invoke('computer-game'" in code, 'rated games must be settled through the server function'
assert ".from('players').update" not in code, 'browser must never update rating directly'
assert "new Worker('vendor/stockfish/stockfish-18-lite-single.js')" in code, 'guest/local mode should retain Stockfish'

validate_start = code.index("if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {")
validate_end = code.index("if (event.type === INPUT_EVENT_TYPE.moveInputCanceled)", validate_start)
validate_block = code[validate_start:validate_end]
assert "renderBoard(false);" not in validate_block, 'accepted drag must be left to cm-chessboard instead of being redrawn mid-drop'
assert "if (ratedMode) {\n      switchClock('computer');" in validate_block, 'rated computer clock must visibly run while the server computes its move'
assert "clockActiveSide = null" not in validate_block, 'rated move submission must not freeze the computer clock'

assert "function syncRatedClocks(payload, computerCapMs = null)" in code, 'rated clock sync must support a monotonic computer-time cap'
assert "Math.min(serverComputerTimeMs, computerCapMs)" in code, 'server sync must never increase the computer clock after visible thinking time elapsed'
assert "const localComputerRemaining = currentClockMs('computer');" in code, 'client must capture visible computer time before applying the server response'
assert "syncRatedClocks(payload, localComputerRemaining);" in code, 'move response must preserve the lower visible computer clock'

assert EDGE.exists(), 'server computer-game Edge Function source is missing'
edge = EDGE.read_text(encoding="utf-8")
assert "easy: 5" in edge and "medium: 10" in edge and "hard: 20" in edge
assert "new Set([5, 10, 15])" in edge, 'server must allow only 5/10/15 computer games'
assert "action === 'start'" in edge
assert "action === 'move'" in edge
assert "action === 'state'" in edge, 'server must expose authoritative game state for safe reconciliation'
assert "action === 'timeout'" in edge
assert "action === 'resign'" in edge
assert "time_control_minutes" in edge
assert "player_time_ms" in edge and "computer_time_ms" in edge and "turn_started_at" in edge
assert "apply_computer_game_rating" in edge
assert "Chess" in edge, 'server must validate legal chess moves'
assert "if (level === 'easy') return randomItem(moves);" not in edge, 'easy must not choose a completely random legal move'
assert "const LEVEL_SEARCH" in edge, 'server difficulty must be explicit and bounded'
assert "easy: { depth: 1" in edge
assert "medium: { depth: 1" in edge
assert "hard: { depth: 2" in edge
assert "function positionalBonus" in edge, 'server engine needs positional evaluation, not material-only play'
assert "function orderMoves" in edge, 'server search must order forcing moves before quiet moves'
assert "const MIN_THINK_MS" in edge, 'rated computer clock must include a real minimum thinking interval'
assert "easy: 900" in edge and "medium: 1200" in edge and "hard: 1600" in edge
assert "await new Promise((resolve) => setTimeout(resolve, waitMs));" in edge, 'server must wait out the remaining thinking interval before finalizing computer elapsed time'
assert "const computerElapsed = Math.max(1, Date.now() - computerStartedAt);" in edge, 'server must deduct total thinking wall time, not just search CPU time'

assert MIGRATION.exists(), 'computer-game rating migration is missing'
sql = MIGRATION.read_text(encoding="utf-8").lower()
assert 'create table if not exists public.computer_games' in sql
assert 'enable row level security' in sql
assert 'revoke all on table public.computer_games from public, anon, authenticated' in sql
assert 'create or replace function public.apply_computer_game_rating' in sql
assert "when 'easy' then 5" in sql
assert "when 'medium' then 10" in sql
assert "when 'hard' then 20" in sql
assert 'rating_applied' in sql
assert 'grant execute on function public.apply_computer_game_rating(uuid) to service_role' in sql

assert TIME_MIGRATION.exists(), '5/10/15 time-control migration is missing'
time_sql = TIME_MIGRATION.read_text(encoding="utf-8").lower().replace(' ', '')
assert 'p_minutesnotin(5,10,15)' in time_sql
assert 'time_control_minutes' in time_sql
assert 'player_time_ms' in time_sql and 'computer_time_ms' in time_sql and 'turn_started_at' in time_sql

assert ENGINE_JS.exists()
assert ENGINE_WASM.exists()
assert ENGINE_WASM.stat().st_size > 1_000_000

print('computer board stability, monotonic clocks, strength, and 5/10/15 controls: PASS')