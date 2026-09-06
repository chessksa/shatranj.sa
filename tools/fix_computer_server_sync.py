from pathlib import Path

client_path = Path('play-computer.js')
edge_path = Path('supabase/functions/computer-game/index.ts')
html_path = Path('play-v10.html')

client = client_path.read_text(encoding='utf-8')
edge = edge_path.read_text(encoding='utf-8')
html = html_path.read_text(encoding='utf-8')

old_client = """async function submitRatedMove(move) {\n  if (!ratedGameId || finished) return;\n  thinking = true;\n  setComputerStatus('يفكر…');\n  try {\n    const payload = await invokeComputer({\n      action: 'move',\n      game_id: ratedGameId,\n      from: move.from,\n      to: move.to,\n      promotion: move.promotion || 'q'\n    });\n"""
new_client = """function createRatedMoveId() {\n  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();\n  return `move-${Date.now()}-${Math.random().toString(36).slice(2)}`;\n}\n\nasync function retryRatedMove(move, moveId) {\n  const request = {\n    action: 'move',\n    game_id: ratedGameId,\n    from: move.from,\n    to: move.to,\n    promotion: move.promotion || 'q',\n    move_id: moveId\n  };\n  try {\n    return await invokeComputer(request);\n  } catch (firstError) {\n    console.warn('computer move request failed; retrying once', firstError);\n    await new Promise((resolve) => setTimeout(resolve, 250));\n    return await invokeComputer(request);\n  }\n}\n\nasync function submitRatedMove(move, moveId) {\n  if (!ratedGameId || finished) return;\n  thinking = true;\n  setComputerStatus('يفكر…');\n  try {\n    const payload = await retryRatedMove(move, moveId);\n"""
if old_client not in client:
    raise SystemExit('client submit anchor not found')
client = client.replace(old_client, new_client, 1)
client = client.replace("Promise.resolve().then(() => submitRatedMove(move));", "Promise.resolve().then(() => submitRatedMove(move, createRatedMoveId()));", 1)
client_path.write_text(client, encoding='utf-8')

old_record = """function moveRecord(side: 'player' | 'computer', move: { from: string; to: string; san: string; promotion?: string }) {\n  return {\n    side,\n    from: move.from,\n    to: move.to,\n    san: move.san,\n    promotion: move.promotion ?? null,\n  };\n}\n"""
new_record = """function moveRecord(\n  side: 'player' | 'computer',\n  move: { from: string; to: string; san: string; promotion?: string },\n  requestId: string | null = null,\n) {\n  return {\n    side,\n    from: move.from,\n    to: move.to,\n    san: move.san,\n    promotion: move.promotion ?? null,\n    request_id: requestId,\n  };\n}\n"""
if old_record not in edge:
    raise SystemExit('edge moveRecord anchor not found')
edge = edge.replace(old_record, new_record, 1)

old_move_head = """    if (action === 'move') {\n      const gameId = String(body.game_id ?? '');\n      const from = String(body.from ?? '');\n      const to = String(body.to ?? '');\n      const promotion = String(body.promotion ?? 'q').toLowerCase();\n      if (!gameId || !/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) {\n        return reply({ error: 'Invalid move' }, 400);\n      }\n\n      const row = await getGame(gameId);\n      if (!row) return reply({ error: 'Computer game not found' }, 404);\n      if (row.status !== 'active') return reply({ error: 'Computer game is finished' }, 409);\n"""
new_move_head = """    if (action === 'move') {\n      const gameId = String(body.game_id ?? '');\n      const from = String(body.from ?? '');\n      const to = String(body.to ?? '');\n      const promotion = String(body.promotion ?? 'q').toLowerCase();\n      const moveId = String(body.move_id ?? '');\n      if (!gameId || !/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to) || moveId.length > 128) {\n        return reply({ error: 'Invalid move' }, 400);\n      }\n\n      const row = await getGame(gameId);\n      if (!row) return reply({ error: 'Computer game not found' }, 404);\n\n      const storedMoves = Array.isArray(row.moves) ? row.moves : [];\n      const existingMove = moveId\n        ? storedMoves.find((entry) => {\n            if (!entry || typeof entry !== 'object') return false;\n            const record = entry as Record<string, unknown>;\n            return record.side === 'player' && record.request_id === moveId;\n          })\n        : null;\n      if (existingMove) {\n        return reply({\n          game_id: row.id,\n          fen: row.fen,\n          status: row.status,\n          result: row.result,\n          rating: row.status === 'finished' && row.result ? await settledRating(row.id) : null,\n          ...clockPayload(row),\n        });\n      }\n\n      if (row.status !== 'active') return reply({ error: 'Computer game is finished' }, 409);\n"""
if old_move_head not in edge:
    raise SystemExit('edge move action anchor not found')
edge = edge.replace(old_move_head, new_move_head, 1)
edge = edge.replace("moves.push(moveRecord('player', playerMove));", "moves.push(moveRecord('player', playerMove, moveId || null));", 1)
edge_path.write_text(edge, encoding='utf-8')

import re
match = re.search(r"play-computer\.js\?v=(\d{8})-(\d+)", html)
if not match:
    raise SystemExit('computer cache version not found')
next_version = int(match.group(2)) + 1
html = html[:match.start()] + f"play-computer.js?v={match.group(1)}-{next_version}" + html[match.end():]
html_path.write_text(html, encoding='utf-8')

print('computer server synchronization fix applied')
