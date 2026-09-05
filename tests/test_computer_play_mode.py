from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")
PLAY = (ROOT / "play-v10.html").read_text(encoding="utf-8")
MATCH = (ROOT / "play-v10-match.js").read_text(encoding="utf-8")
COMPUTER = ROOT / "play-computer.js"
EDGE = ROOT / "supabase" / "functions" / "computer-game" / "index.ts"
MIGRATION = ROOT / "supabase" / "migrations" / "20260906_computer_game_ratings.sql"
TIME_MIGRATION = ROOT / "supabase" / "migrations" / "20260906_time_controls_5_10_15.sql"
CLOCK_MIGRATION = ROOT / "supabase" / "migrations" / "20260906_computer_clock_floor.sql"
ENGINE_JS = ROOT / "vendor" / "stockfish" / "stockfish-18-lite-single.js"
ENGINE_WASM = ROOT / "vendor" / "stockfish" / "stockfish-18-lite-single.wasm"

assert 'href="play-v10.html?computer=1"' in INDEX
assert 'اللعب ضد الكمبيوتر' in INDEX
assert "const computerMode = params.has('computer');" in PLAY

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
assert "function setupTimeChooser" in code
assert "function addTimeChooserBack" in code, 'time chooser must expose a dedicated back action'
assert "setupLevelChooser();" in code[code.index("function addTimeChooserBack"):code.index("function setupTimeChooser")], 'back action must return to level chooser'
assert "computer-time-back" in code, 'time chooser back control needs a stable hook'
back_block = code[code.index("function addTimeChooserBack"):code.index("function applyChooserTitle")]
assert '<span>رجوع</span>' in back_block, 'back control must show a text label beside the icon'
assert "back.innerHTML = '<span aria-hidden=\"true\">›</span><span>رجوع</span>';" in back_block, 'back control should combine the RTL chevron with the رجوع label'
assert 'position:absolute' not in back_block, 'back control must not overlap the title'
assert "header.style.gridTemplateColumns = 'auto minmax(0, 1fr)'" in back_block and "header.insertBefore(back, title)" in back_block, 'back control must occupy a dedicated left column beside the title'
assert 'min-width:72px' in back_block and 'height:36px' in back_block, 'back control should remain compact'
assert 'border:1px solid rgba(224,181,103,.4)' in back_block and 'background:rgba(2,28,33,.44)' in back_block, 'back control should match the chooser style'

assert "function applyChooserTitle(title, text)" in code, 'level and time choosers must share one title style'
title_block = code[code.index("function applyChooserTitle"):code.index("function setupTimeChooser")]
assert "font-size', 'clamp(11px, 2.5vw, 17px)'" in title_block, 'chooser titles must use the same compact single-line size'
assert "white-space', 'nowrap'" in title_block, 'chooser titles must remain on one line'
assert "text-align', 'center'" in title_block, 'chooser titles must remain centered'
assert "overflow', 'hidden'" in title_block, 'single-line chooser title must stay inside its own column'
time_block = code[code.index("function setupTimeChooser"):code.index("function setupLevelChooser")]
level_block = code[code.index("function setupLevelChooser"):]
assert "applyChooserTitle(title, `اختر زمن المباراة — مستوى ${level.label}`);" in time_block
assert "applyChooserTitle(title, 'اختر مستوى الكمبيوتر — النقاط للمسجلين');" in level_block
assert "title.style.setProperty('font-size'" not in time_block, 'time chooser must not override the shared title size'
assert "title.style.removeProperty" not in level_block, 'level chooser must not revert to a different title size'
assert "options.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';" in time_block, 'all three time choices must stay in one bounded row'
assert "options.style.width = '100%';" in time_block and "options.style.minWidth = '0';" in time_block, 'time choices must remain inside the panel width'
assert "button.style.minWidth = '0';" in time_block, 'individual time cards must be allowed to shrink'
assert "startComputerGame(levelKey, minutes)" in code
assert "action: 'start', level: levelKey, minutes" in code
assert "action: 'timeout'" in code
assert "action: 'state'" in code
assert "function formatClock" in code and "function startClockLoop" in code
assert "fill','#d6cfbf','important'" in code
assert "fill','#246f77','important'" in code
assert "forceBoardSquareColors" in code and "watchBoardSquareColors" in code
assert "supabase.functions.invoke('computer-game'" in code
assert ".from('players').update" not in code
assert "new Worker('vendor/stockfish/stockfish-18-lite-single.js')" in code

validate_start = code.index("if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {")
validate_end = code.index("if (event.type === INPUT_EVENT_TYPE.moveInputCanceled)", validate_start)
validate_block = code[validate_start:validate_end]
assert "renderBoard(false);" not in validate_block
assert re.search(r"if\s*\(ratedMode\)\s*\{\s*switchClock\('computer'\);", validate_block), 'rated computer clock must visibly run while the server computes its move'
assert "clockActiveSide = null" not in validate_block, 'rated move submission must not freeze the computer clock'

assert "function syncRatedClocks(payload, computerCapMs = null)" in code
assert "computerCapMs !== null" in code, 'null must mean no cap; Number(null) must never collapse computer time to zero'
assert "Math.min(serverComputerTimeMs, computerCapMs)" in code
assert "const localComputerRemaining = currentClockMs('computer');" in code
assert "syncRatedClocks(payload, localComputerRemaining);" in code

assert EDGE.exists(), 'server computer-game Edge Function source is missing'
edge = EDGE.read_text(encoding="utf-8")
assert "easy: 5" in edge and "medium: 10" in edge and "hard: 20" in edge
assert "new Set([5, 10, 15])" in edge
assert "action === 'start'" in edge
assert "action === 'move'" in edge
assert "action === 'state'" in edge
assert "action === 'timeout'" in edge
assert "action === 'resign'" in edge
assert "time_control_minutes" in edge
assert "player_time_ms" in edge and "computer_time_ms" in edge and "turn_started_at" in edge
assert "apply_computer_game_rating" in edge
assert "Chess" in edge
assert "if (level === 'easy') return randomItem(moves);" not in edge
assert "const LEVEL_SEARCH" in edge
assert "easy: { depth: 1" in edge
assert "medium: { depth: 1" in edge
assert "hard: { depth: 2" in edge
assert "function positionalBonus" in edge
assert "function orderMoves" in edge
assert "const MIN_THINK_MS" in edge
assert "easy: 900" in edge and "medium: 1200" in edge and "hard: 1600" in edge
assert "await new Promise((resolve) => setTimeout(resolve, waitMs));" in edge
assert "const computerElapsed = Math.max(1, Date.now() - computerStartedAt);" in edge

assert MIGRATION.exists()
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

assert TIME_MIGRATION.exists()
time_sql = TIME_MIGRATION.read_text(encoding="utf-8").lower().replace(' ', '')
assert 'p_minutesnotin(5,10,15)' in time_sql
assert 'time_control_minutes' in time_sql
assert 'player_time_ms' in time_sql and 'computer_time_ms' in time_sql and 'turn_started_at' in time_sql

assert CLOCK_MIGRATION.exists(), 'database clock floor migration is missing'
clock_sql = CLOCK_MIGRATION.read_text(encoding="utf-8").lower()
assert 'create or replace function public.enforce_computer_clock_floor' in clock_sql
assert "when 'easy' then 900" in clock_sql
assert "when 'medium' then 1200" in clock_sql
assert "when 'hard' then 1600" in clock_sql
assert 'create trigger computer_clock_floor' in clock_sql
assert 'new.computer_time_ms' in clock_sql and 'old.computer_time_ms' in clock_sql

assert ENGINE_JS.exists()
assert ENGINE_WASM.exists()
assert ENGINE_WASM.stat().st_size > 1_000_000

print('computer chooser simple back icon, unified titles, board stability, clocks, strength, and 5/10/15 controls: PASS')