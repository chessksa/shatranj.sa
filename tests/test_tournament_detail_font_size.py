from pathlib import Path

page = Path('tournaments.html').read_text(encoding='utf-8')

assert '@media(min-width:701px){.tournament-detail-table th,.tournament-detail-table td{font-size:14px!important}}' in page
assert '@media(max-width:700px)' in page

print('tournament detail table uses 14px on desktop without changing the mobile breakpoint')
