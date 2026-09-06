from pathlib import Path

INDEX = Path('index.html')
TICKER = Path('home-welcome-ticker.js')
THEME = Path('home-theme.css')
TOURNAMENTS = Path('tournaments.html')

index = INDEX.read_text(encoding='utf-8')
index = index.replace(
    '<span class="welcome-ticker-label">آخر المسجلين في شطرنج العرب</span>',
    '<span class="welcome-ticker-label">آخر المسجلين</span>',
    1,
)
if '.slice(0,20);' not in index:
    raise SystemExit('inline ticker is not limited to 20 registrants')
INDEX.write_text(index, encoding='utf-8')

ticker = TICKER.read_text(encoding='utf-8')
ticker = ticker.replace('.slice(0, 10);', '.slice(0, 20);')
ticker = ticker.replace(
    "? `نرحب بانضمام ${name} — ${country}، ${city}`\n        : `نرحب بانضمام ${name} — ${country}`;",
    "? `${name} — ${country}، ${city}`\n        : `${name} — ${country}`;",
)
TICKER.write_text(ticker, encoding='utf-8')

theme = THEME.read_text(encoding='utf-8').rstrip() + '\n'
marker = '/* HOME PLAY ACTION TEXT ONLY 20260906 */'
if marker not in theme:
    theme += '''\n/* HOME PLAY ACTION TEXT ONLY 20260906 */
.home-hero .home-board-actions>.btn,
.home-hero .home-invite-wrap>.btn{
  font-family:Arial,sans-serif!important;
  font-weight:900!important;
}
.home-hero .home-board-actions>.btn::before,
.home-hero .home-invite-wrap>.btn::before{
  content:none!important;
  display:none!important;
}
'''
THEME.write_text(theme, encoding='utf-8')

tournaments = TOURNAMENTS.read_text(encoding='utf-8')
tournament_marker = '/* TOURNAMENT TABLE VERTICAL DIVIDERS 20260906 */'
if tournament_marker not in tournaments:
    block = '''\n/* TOURNAMENT TABLE VERTICAL DIVIDERS 20260906 */
@media(min-width:701px){
  th:not(:last-child),td:not(:last-child){border-left:1px solid rgba(216,182,101,.18)}
}
@media(max-width:700px){
  tbody td:nth-child(odd):not(:nth-child(11)){border-left:1px solid rgba(216,182,101,.18)}
  tbody td:nth-child(2),tbody td:nth-child(11){border-left:0}
}
'''
    tournaments = tournaments.replace('</style>', block + '</style>', 1)
TOURNAMENTS.write_text(tournaments, encoding='utf-8')
