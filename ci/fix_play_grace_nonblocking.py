from pathlib import Path

path = Path('play-v8.js')
text = path.read_text(encoding='utf-8')
text = text.replace('await loadGraceEndWindow();', 'loadGraceEndWindow();')
path.write_text(text, encoding='utf-8')
