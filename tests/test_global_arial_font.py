from pathlib import Path
import re

files = [p for p in Path('.').iterdir() if p.is_file() and p.suffix in {'.html', '.css', '.js'}]
assert files, 'no production web files found'

bad = []
font_declarations = 0
for path in files:
    text = path.read_text(encoding='utf-8')
    for match in re.finditer(r'font-family\s*:\s*([^;}]+)', text, flags=re.I):
        font_declarations += 1
        value = re.sub(r'\s+', '', match.group(1)).strip('"\'').lower()
        if value not in {'arial,sans-serif'}:
            bad.append(f'{path}: font-family:{match.group(1).strip()}')
    if re.search(r'\bTahoma\b|Segoe UI', text, flags=re.I):
        bad.append(f'{path}: legacy font name remains')

assert font_declarations > 0, 'expected explicit font-family declarations'
assert not bad, 'site font is not fully Arial:\n' + '\n'.join(bad)
print(f'global Arial font: PASS ({font_declarations} declarations)')
