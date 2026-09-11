from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOADER = (ROOT / 'tournaments.html').read_text(encoding='utf-8')
FIX = ROOT / 'tournament-detail-4x4.js'

assert 'tournaments-app.html' in LOADER, 'tournaments loader must fetch the uncached app source'
assert 'tournament-detail-4x4.js' in LOADER, 'tournaments loader must inject the final detail-table module'
assert FIX.exists(), 'final tournament detail module must exist'

source = FIX.read_text(encoding='utf-8')
assert "slice(0,8)" in source, 'the table must use exactly the eight base detail fields'
assert "for(let i=0;i<8;i+=2)" in source, 'eight fields must be paired into four rows'
assert "table.className='tournament-detail-table'" in source
assert "document.createElement('tr')" in source
assert source.count("document.createElement('th')") >= 2, 'each row needs two label cells'
assert source.count("document.createElement('td')") >= 2, 'each row needs two value cells'
assert 'font-size:12px!important' in source, 'detail labels must be 12px'
assert 'font-size:10px!important' in source, 'detail values must be 10px'
assert "td.appendChild(value)" in source, 'live registration value must be preserved while moving cells'

print('tournament detail is exactly 4 rows x 4 columns with 12/10 fonts: PASS')
