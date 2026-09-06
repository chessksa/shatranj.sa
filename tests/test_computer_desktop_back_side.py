from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAY = (ROOT / 'play-v10.html').read_text(encoding='utf-8')

expected = '''@media(min-width:901px){
      body.computer-game.pregame .computer-chooser-header{
        direction:rtl!important;
      }
    }'''
assert expected in PLAY, 'desktop computer time chooser back button must be on the opposite/right side'
print('desktop computer back side: PASS')
