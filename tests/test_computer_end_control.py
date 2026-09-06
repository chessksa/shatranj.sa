from pathlib import Path

code = Path('play-computer.js').read_text(encoding='utf-8')

playing_start = code.index('function setPlayingLayout')
playing_end = code.index('async function startComputerGame', playing_start)
playing = code[playing_start:playing_end]

chooser_start = code.index('function setupLevelChooser')
chooser = code[chooser_start:]

assert "if (endGraceBtn) endGraceBtn.disabled = true;" in playing, 'computer games must keep the human-opponent grace-end control disabled'
assert "endGraceBtn.onclick = null;" in chooser, 'computer chooser must clear any grace-end click handler'
assert "endGraceBtn.onclick = () => resignComputerGame({ navigate: true });" not in code, 'grace-end must never act as an unconfirmed resignation in computer mode'
assert "resignBtn?.addEventListener('click', () => resignComputerGame({ ask: true }));" in code, 'explicit resignation must remain available with confirmation'

print('computer end control: PASS')
