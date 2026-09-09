from pathlib import Path

html = Path('tournaments.html').read_text(encoding='utf-8')

assert '<div class="page-head-title"><h1>البطولات</h1><div id="tournamentCount" class="count">0</div></div>' in html, 'header must show البطولات with numeric count only'
assert '<div class="tournament-intro-strip">اختر البطولة للتسجيل والمشاركة والمشاهدة</div>' in html, 'extended tournament intro strip is missing'
assert 'margin-bottom:4px' in html, 'space between tournament header and intro strip must be 4px'
assert 'countEl.textContent=`${list.length}`;' in html, 'dynamic tournament count must stay numeric only'
assert 'اختر البطولة لعرض تفاصيلها والتسجيل فيها.' not in html, 'old tournament subtitle must be removed'

print('tournament header compact layout checks passed')
