from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'tournaments.html').read_text(encoding='utf-8')

start = HTML.index('function renderTournamentDetail(row)')
end = HTML.index('\nfunction firstRow', start)
render = HTML[start:end]

assert '<table class="tournament-detail-table"' in render, 'tournament detail must render a real table'
assert render.count('<tr>') == 4, 'tournament detail table must have exactly 4 rows'
assert render.count('<th') == 8, '4x4 detail table needs 8 label cells'
assert render.count('<td') == 8, '4x4 detail table needs 8 value cells'
assert 'data-registration-count' in render, 'live registration counter must remain in the table'
assert re.search(r'\.tournament-detail-table th\s*\{[^}]*font-size:12px!important', HTML, re.S), 'detail labels must be 12px'
assert re.search(r'\.tournament-detail-table td\s*\{[^}]*font-size:10px!important', HTML, re.S), 'detail values must be 10px'

print('tournament detail is exactly 4 rows x 4 columns with 12/10 fonts: PASS')
