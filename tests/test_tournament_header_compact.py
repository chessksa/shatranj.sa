from pathlib import Path

html = Path('tournaments.html').read_text(encoding='utf-8')

assert '<div class="page-head-title"><h1>البطولات</h1><div id="tournamentCount" class="count">0</div></div>' in html, 'header must show البطولات with numeric count only'
assert '<div class="tournament-intro-strip">اختر البطولة للتسجيل والمشاركة والمشاهدة</div>' in html, 'extended tournament intro strip is missing'
assert 'margin-bottom:4px' in html, 'space between tournament header and intro strip must be 4px'
assert '.tournament-intro-strip{width:100%;margin:0 0 4px;' in html, 'space between intro strip and tournament table must be 4px'
assert 'text-align:center' in html, 'tournament intro and cells must include centered alignment'
assert '.registration-message:empty{display:none}' in html, 'empty registration message must not create extra gap above tournament table'
assert '.tournament-table th,.tournament-table td{padding:13px 14px;border-bottom:1px solid rgba(216,182,101,.18);text-align:center;' in html, 'tournament table headers and cells must be centered'
assert 'countEl.textContent=`${list.length}`;' in html, 'dynamic tournament count must stay numeric only'
assert 'اختر البطولة لعرض تفاصيلها والتسجيل فيها.' not in html, 'old tournament subtitle must be removed'
assert '.page-head-title{display:grid;grid-template-columns:1fr 1fr;' in html, 'tournament header must be split into two equal halves'
assert '.page-head-title::after{content:"";position:absolute;top:0;bottom:0;left:50%;width:1px;' in html, 'tournament header needs a centered vertical divider'
assert '.count{color:var(--hero-gold-2);font-size:22px;' in html, 'tournament count must be 22px'
assert '.page-head h1{' in html and 'text-align:center' in html, 'tournament title must remain centered in the right half'

print('tournament header compact layout checks passed')