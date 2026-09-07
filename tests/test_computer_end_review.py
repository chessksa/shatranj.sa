from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JS = (ROOT / "play-computer.js").read_text(encoding="utf-8")
HTML = (ROOT / "play-v10.html").read_text(encoding="utf-8")
EDGE = (ROOT / "supabase/functions/computer-game/index.ts").read_text(encoding="utf-8")

assert "function startComputerGraceWindow" in JS, "computer games must start a five-second End grace window"
assert "function updateComputerGraceEndUI" in JS, "computer End control must update its countdown and transition"
assert "function showComputerMoveReviewMode" in JS, "computer End control must transform into move review"
assert "function rememberComputerFen" in JS, "computer games need an independent FEN review history"
assert "function stepComputerMoveReview" in JS, "computer review arrows must step backward and forward"
assert "isComputerReviewingPast()" in JS, "playing must be blocked while reviewing an older position"
assert "action: 'cancel'" in JS, "rated computer End must call a no-rating cancel action"
assert "computerGraceDeadline = performance.now() + 5000" in JS, "computer grace duration must be exactly five seconds"
assert "rememberComputerFen(game.fen())" in JS, "current computer positions must be recorded for review"
assert "play-computer.js?v=20260907-26" in HTML, "computer script cache version must be bumped"

assert "created_at" in EDGE.split("const gameSelect =", 1)[1].split(";", 1)[0], "computer game state must expose created_at for grace validation"
assert "if (action === 'cancel')" in EDGE, "edge function must support no-rating cancellation"
assert ".eq('status', 'active')" in EDGE, "cancel must only affect an active owned game"
assert "status: 'abandoned'" in EDGE, "grace cancellation must not settle a rated loss"
assert "Date.now()" in EDGE and "created_at" in EDGE, "server must enforce the five-second window"

print("computer End grace and move review: PASS")
