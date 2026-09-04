from pathlib import Path

css = Path('play-v8.css').read_text(encoding='utf-8')

expected = '''.piece-p .piece-image{
  transform: translateY(-14%) scale(1.15);
  transform-origin: center;
}'''

assert expected in css, 'play-v8 pawn alignment must raise pawns 14% while preserving 1.15 scale'
print('play-v8 pawn alignment: PASS')
