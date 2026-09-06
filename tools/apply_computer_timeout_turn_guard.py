from pathlib import Path

path = Path('supabase/functions/computer-game/index.ts')
text = path.read_text(encoding='utf-8')
old = """      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const playerTimeMs = Math.max(0, Number(row.player_time_ms) - elapsedMs(row.turn_started_at, nowMs));
"""
new = """      const timeoutChess = new Chess(row.fen);
      if (timeoutChess.turn() === 'b') {
        return reply(await completePendingComputerTurn(row));
      }

      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const playerTimeMs = Math.max(0, Number(row.player_time_ms) - elapsedMs(row.turn_started_at, nowMs));
"""
if new in text:
    print('timeout guard already applied')
elif old in text:
    text = text.replace(old, new, 1)
    path.write_text(text, encoding='utf-8')
    print('timeout guard applied')
else:
    raise SystemExit('timeout block anchor not found')
