from pathlib import Path

theme = Path('home-theme.css').read_text(encoding='utf-8')

assert 'MOBILE PLAY ACTIONS THREE PLUS ONE 20260906' in theme
assert 'grid-template-columns:repeat(3,minmax(0,1fr))!important' in theme
assert 'grid-template-rows:repeat(2,82px)!important' in theme
assert '.home-hero .hero-tournaments-btn{grid-column:1!important;grid-row:1!important}' in theme
assert '.home-hero .hero-play-btn{grid-column:2!important;grid-row:1!important}' in theme
assert '.home-hero .home-invite-wrap{grid-column:3!important;grid-row:1!important}' in theme
assert '.home-hero .hero-computer-btn{grid-column:1/-1!important;grid-row:2!important}' in theme
assert 'height:82px!important' in theme
assert 'font-size:20px!important' in theme
assert 'white-space:nowrap!important' in theme
assert 'border-color:rgba(216,182,101,.62)!important' in theme

print('mobile play actions use three equal top buttons and one equal-height full-width computer button')
