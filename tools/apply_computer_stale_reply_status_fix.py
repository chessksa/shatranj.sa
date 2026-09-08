from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
play_path = ROOT / 'play-computer.js'
page_path = ROOT / 'play-v10.html'

code = play_path.read_text(encoding='utf-8')
page = page_path.read_text(encoding='utf-8')

old = """let ratedTimeoutPending = false;\nlet clockTimer = null;\n"""
new = """let ratedTimeoutPending = false;\nlet activeRatedMoveId = null;\nlet clockTimer = null;\n"""
assert old in code
code = code.replace(old, new, 1)

old = """async function waitForRatedMoveAck(moveId, attempts = 8) {\n  for (let attempt = 0; attempt < attempts; attempt += 1) {\n"""
new = """function isCurrentRatedReply(moveId) {\n  return Boolean(moveId && activeRatedMoveId === moveId && ratedGameId && !finished);\n}\n\nfunction retireRatedReply(moveId) {\n  if (activeRatedMoveId === moveId) activeRatedMoveId = null;\n}\n\nasync function waitForRatedMoveAck(moveId, attempts = 8) {\n  for (let attempt = 0; attempt < attempts; attempt += 1) {\n    if (!isCurrentRatedReply(moveId)) return null;\n"""
assert old in code
code = code.replace(old, new, 1)

old = """async function waitForRatedComputerReply(moveId, initialPayload = null, attempts = 12) {\n  let payload = initialPayload;\n  for (let attempt = 0; attempt < attempts && !finished; attempt += 1) {\n"""
new = """async function waitForRatedComputerReply(moveId, initialPayload = null, attempts = 12) {\n  let payload = initialPayload;\n  for (let attempt = 0; attempt < attempts && !finished; attempt += 1) {\n    if (!isCurrentRatedReply(moveId)) return null;\n"""
assert old in code
code = code.replace(old, new, 1)

old = """async function resumeRatedComputerReply(moveId) {\n  if (!ratedGameId || finished) return;\n  setComputerStatus('يفكر…');\n  const finalPayload = await waitForRatedComputerReply(moveId, null, 12);\n  if (finished) return;\n  if (finalPayload?.fen && ratedPayloadMatchesMove(finalPayload, moveId)) {\n    const finalComputerRemaining = currentClockMs('computer');\n    applyRatedComputerReply(finalPayload, finalComputerRemaining);\n    return;\n  }\n  if (clockActiveSide === 'computer' && currentClockMs('computer') <= 0) {\n    await requestRatedTimeout();\n    if (finished) return;\n  }\n  setTimeout(() => resumeRatedComputerReply(moveId), 650);\n}\n"""
new = """async function resumeRatedComputerReply(moveId) {\n  if (!isCurrentRatedReply(moveId)) return;\n  if (game.turn() === 'w') {\n    retireRatedReply(moveId);\n    setComputerStatus('جاهز');\n    return;\n  }\n  setComputerStatus('يفكر…');\n  const finalPayload = await waitForRatedComputerReply(moveId, null, 12);\n  if (finished || !isCurrentRatedReply(moveId)) return;\n  if (finalPayload?.fen && ratedPayloadMatchesMove(finalPayload, moveId)) {\n    const finalComputerRemaining = currentClockMs('computer');\n    retireRatedReply(moveId);\n    applyRatedComputerReply(finalPayload, finalComputerRemaining);\n    return;\n  }\n  if (clockActiveSide === 'computer' && currentClockMs('computer') <= 0) {\n    await requestRatedTimeout();\n    if (finished || !isCurrentRatedReply(moveId)) return;\n  }\n  if (isCurrentRatedReply(moveId)) setTimeout(() => resumeRatedComputerReply(moveId), 650);\n}\n"""
assert old in code
code = code.replace(old, new, 1)

old = """async function submitRatedMove(move, moveId) {\n  if (!ratedGameId || finished) return;\n  thinking = true;\n"""
new = """async function submitRatedMove(move, moveId) {\n  if (!ratedGameId || finished) return;\n  activeRatedMoveId = moveId;\n  thinking = true;\n"""
assert old in code
code = code.replace(old, new, 1)

code = code.replace(
    """      setTimeout(() => resumeRatedComputerReply(moveId), 450);\n      return;\n""",
    """      if (isCurrentRatedReply(moveId)) setTimeout(() => resumeRatedComputerReply(moveId), 450);\n      return;\n""",
    1,
)

old = """    if (finalPayload?.fen && ratedPayloadMatchesMove(finalPayload, moveId)) {\n      const finalComputerRemaining = currentClockMs('computer');\n    applyRatedComputerReply(finalPayload, finalComputerRemaining);\n      return;\n    }\n    setComputerStatus('يفكر…');\n    setTimeout(() => resumeRatedComputerReply(moveId), 650);\n  } catch (error) {\n    console.error(error);\n    setComputerStatus('يفكر…');\n    setTimeout(() => resumeRatedComputerReply(moveId), 650);\n"""
new = """    if (finalPayload?.fen && ratedPayloadMatchesMove(finalPayload, moveId)) {\n      const finalComputerRemaining = currentClockMs('computer');\n      retireRatedReply(moveId);\n      applyRatedComputerReply(finalPayload, finalComputerRemaining);\n      return;\n    }\n    if (isCurrentRatedReply(moveId)) {\n      setComputerStatus('يفكر…');\n      setTimeout(() => resumeRatedComputerReply(moveId), 650);\n    }\n  } catch (error) {\n    console.error(error);\n    if (isCurrentRatedReply(moveId)) {\n      setComputerStatus('يفكر…');\n      setTimeout(() => resumeRatedComputerReply(moveId), 650);\n    }\n"""
assert old in code
code = code.replace(old, new, 1)

old = """    syncRatedClocks(payload);\n    if (payload?.status === 'finished') finishRatedResult(payload);\n"""
new = """    syncRatedClocks(payload);\n    if (payload?.status === 'finished') {\n      activeRatedMoveId = null;\n      finishRatedResult(payload);\n    } else if (ratedPayloadTurn(payload) === 'w') {\n      activeRatedMoveId = null;\n      setComputerStatus('جاهز');\n    }\n"""
assert old in code
code = code.replace(old, new, 1)

old = """  finished = true;\n  thinking = false;\n"""
new = """  finished = true;\n  thinking = false;\n  activeRatedMoveId = null;\n"""
assert old in code
code = code.replace(old, new, 1)

old = """    ratedTimeoutPending = false;\n\n    if (ratedMode) {\n"""
new = """    ratedTimeoutPending = false;\n    activeRatedMoveId = null;\n\n    if (ratedMode) {\n"""
assert old in code
code = code.replace(old, new, 1)

old_cache = "play-computer.js?v=20260908-lastmove3"
new_cache = "play-computer.js?v=20260909-stalereply1"
assert old_cache in page
page = page.replace(old_cache, new_cache, 1)

play_path.write_text(code, encoding='utf-8')
page_path.write_text(page, encoding='utf-8')
print('stale rated computer reply status fix applied')
