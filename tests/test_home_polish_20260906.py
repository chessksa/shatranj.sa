from pathlib import Path

# Final regression check for the approved September 6 homepage/tournament polish.
index = Path('index.html').read_text(encoding='utf-8')
ticker = Path('home-welcome-ticker.js').read_text(encoding='utf-8')
theme = Path('home-theme.css').read_text(encoding='utf-8')
tournaments = Path('tournaments.html').read_text(encoding='utf-8')

assert '<span class="welcome-ticker-label">آخر المسجلين</span>' in index
assert '.slice(0,20);' in index
assert 'نرحب بانضمام' not in index
assert '.slice(0, 20);' in ticker
assert 'نرحب بانضمام' not in ticker

assert 'HOME PLAY ACTION TEXT ONLY 20260906' in theme
assert 'content:none!important' in theme
assert 'font-family:Arial,sans-serif!important' in theme

assert 'TOURNAMENT TABLE VERTICAL DIVIDERS 20260906' in tournaments
assert 'border-left:1px solid rgba(216,182,101,.18)' in tournaments

print('home ticker, play actions, and tournament dividers match the approved polish')
