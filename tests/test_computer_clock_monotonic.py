from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CODE = (ROOT / "play-computer.js").read_text(encoding="utf-8")

apply_start = CODE.index("function applyRatedComputerReply")
apply_end = CODE.index("async function resumeRatedComputerReply", apply_start)
apply_block = CODE[apply_start:apply_end]
assert "function applyRatedComputerReply(payload, computerCapMs = null)" in apply_block, (
    "final computer replies must accept the locally displayed computer clock as an upper bound"
)
assert "syncRatedClocks(payload, computerCapMs);" in apply_block, (
    "final server synchronization must not increase the computer clock above the locally displayed value"
)
assert "finishRatedResult(payload, computerCapMs)" in apply_block, (
    "finished replies must preserve the same clock cap during the final result synchronization"
)

resume_start = CODE.index("async function resumeRatedComputerReply")
resume_end = CODE.index("async function submitRatedMove", resume_start)
resume_block = CODE[resume_start:resume_end]
assert "const finalComputerRemaining = currentClockMs('computer');" in resume_block, (
    "resumed computer replies must snapshot the currently displayed computer time"
)
assert "applyRatedComputerReply(finalPayload, finalComputerRemaining);" in resume_block, (
    "resumed computer replies must apply the server response with the local clock cap"
)

submit_start = CODE.index("async function submitRatedMove")
submit_end = CODE.index("function handleBoardInput", submit_start)
submit_block = CODE[submit_start:submit_end]
assert "const finalComputerRemaining = currentClockMs('computer');" in submit_block, (
    "normal computer replies must snapshot the currently displayed computer time immediately before reconciliation"
)
assert "applyRatedComputerReply(finalPayload, finalComputerRemaining);" in submit_block, (
    "normal computer replies must never reconcile to a larger computer clock value"
)

print("computer clock never moves backward on final rated reply: PASS")
