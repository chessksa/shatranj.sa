from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'play-v10.html').read_text(encoding='utf-8')
PVP = (ROOT / 'play-v8.js').read_text(encoding='utf-8')
COMPUTER = (ROOT / 'play-computer.js').read_text(encoding='utf-8')

# Shared styling: winner green, loser red, actions become one result banner.
assert '.player-card.result-winner' in HTML, 'winner player card style is missing'
assert '.player-card.result-loser' in HTML, 'loser player card style is missing'
assert '.actions-card.game-result-actions' in HTML, 'finished game action-area style is missing'
assert '.game-result-banner' in HTML and '.game-result-title' in HTML, 'finished game banner styles are missing'

# PvP: derive winner from 1-0 / 0-1, color the visible top/bottom cards,
# and replace the action buttons with congratulations + winner name.
for hook in ("const topPlayerCard = $('topPlayerCard');", "const bottomPlayerCard = $('bottomPlayerCard');", "const gameActions = $('gameActions');"):
    assert hook in PVP, f'PvP result UI DOM hook missing: {hook}'
assert 'function applyFinishedGameUI(result)' in PVP, 'PvP finished-state renderer is missing'
pvp_result = PVP[PVP.index('function applyFinishedGameUI(result)'):PVP.index('function applyServerState', PVP.index('function applyFinishedGameUI(result)'))]
assert "const winnerColor = result==='1-0' ? 'w' : result==='0-1' ? 'b' : null;" in pvp_result
assert "classList.add('result-winner')" in pvp_result and "classList.add('result-loser')" in pvp_result
assert "gameActions.classList.add('game-result-actions')" in pvp_result
assert "title.textContent='مبروك';" in pvp_result
assert "name.textContent=winner.name" in pvp_result
assert "title.textContent='انتهت المباراة بالتعادل';" in pvp_result
assert 'applyFinishedGameUI(row.result);' in PVP
assert 'alert(finishedMessage(row.result))' not in PVP, 'blocking alert must not cover the new result UI'

# Computer games: all normal win/loss/draw paths must carry a structured outcome
# into the same result UI, including timeout and resignation paths.
for hook in ("const bottomPlayerCard = $('bottomPlayerCard');", "const gameActions = $('gameActions');"):
    assert hook in COMPUTER, f'computer result UI DOM hook missing: {hook}'
assert 'function showGameResultUI(outcome)' in COMPUTER, 'computer finished-state renderer is missing'
computer_result = COMPUTER[COMPUTER.index('function showGameResultUI(outcome)'):COMPUTER.index('function formatClock', COMPUTER.index('function showGameResultUI(outcome)'))]
assert "classList.add('result-winner')" in computer_result and "classList.add('result-loser')" in computer_result
assert "gameActions.classList.add('game-result-actions')" in computer_result
assert "title.textContent = 'مبروك';" in computer_result
assert "title.textContent = 'انتهت المباراة بالتعادل';" in computer_result
assert 'function finishGame(message, rating = null, outcome = null)' in COMPUTER
finish_block = COMPUTER[COMPUTER.index('function finishGame'):COMPUTER.index('function finishRatedResult')]
assert 'showGameResultUI(outcome);' in finish_block
assert "win: { message: 'فزت على الكمبيوتر', outcome: 'player' }" in COMPUTER
assert "loss: { message: 'فاز الكمبيوتر', outcome: 'computer' }" in COMPUTER
assert "draw: { message: 'انتهت المباراة بالتعادل', outcome: 'draw' }" in COMPUTER
assert "finishGame('انتهى وقتك — فاز الكمبيوتر', null, 'computer');" in COMPUTER
assert "finishGame('انتهى وقت الكمبيوتر — فزت', null, 'player');" in COMPUTER
assert "finishGame('استسلمت أمام الكمبيوتر', null, 'computer');" in COMPUTER
assert re.search(r"finishGame\(game\.turn\(\) === 'b' \? 'فزت على الكمبيوتر' : 'فاز الكمبيوتر', null, game\.turn\(\) === 'b' \? 'player' : 'computer'\);", COMPUTER)
assert "finishGame('انتهت المباراة بالتعادل', null, 'draw');" in COMPUTER

print('finished game result UI: PASS')
