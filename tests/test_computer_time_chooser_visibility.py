from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CODE = (ROOT / 'play-computer.js').read_text(encoding='utf-8')
PLAY = (ROOT / 'play-v10.html').read_text(encoding='utf-8')

start = CODE.index('function setupTimeChooser')
end = CODE.index('function setupLevelChooser', start)
time_block = CODE[start:end]

assert "opponentSearchSetup.style.overflow = 'hidden'" not in time_block, (
    'computer time chooser must not clip the 5/10/15 minute buttons after a level is selected'
)
assert "s.src='play-computer.js?v=20260907-20';" in PLAY, (
    'computer controller cache version must advance so the visibility fix reaches browsers'
)
print('computer time chooser visibility: PASS')
