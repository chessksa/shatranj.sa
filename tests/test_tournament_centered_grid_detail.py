from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JS = (ROOT / 'site-presence.js').read_text(encoding='utf-8')

assert "function initTournamentLayoutPolish()" in JS, 'tournament layout polish initializer is required'
assert ".tournament-table th,.tournament-table td" in JS, 'tournament list cells need a dedicated centering override'
assert "text-align:center!important" in JS, 'tournament list headers and cells must be centered'
assert ".tournament-detail-table" in JS, 'opened tournament details must render as a connected grid table'
assert "border-collapse:collapse" in JS, 'detail table must use a connected grid'
assert "detailCard.querySelector('.detail-grid')" in JS, 'existing detail cards must be transformed into the grid table'
assert "detailCard.querySelector('.detail-title-row')?.remove()" in JS, 'standalone duplicate tournament title must be removed'
assert "td.appendChild(value)" in JS, 'detail values must stay in the same row as their labels without losing live registration state'
assert "client.channel('site-online-v1'" in JS, 'presence behavior must remain intact'
print('tournament centered list and connected detail grid: PASS')
