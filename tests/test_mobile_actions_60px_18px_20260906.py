from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')

marker = '/* MOBILE PLAY ACTIONS 60PX 18PX 20260906 */'
assert marker in css
block = css.split(marker, 1)[1]

assert 'grid-template-columns:repeat(3,minmax(0,1fr))!important' in block
assert 'grid-template-rows:repeat(2,60px)!important' in block
assert '.home-hero .hero-computer-btn{grid-column:1/-1!important;grid-row:2!important}' in block
assert 'height:60px!important' in block
assert 'min-height:60px!important' in block
assert 'font-family:Arial,sans-serif!important' in block
assert 'font-size:18px!important' in block
assert 'align-items:center!important' in block
assert 'justify-content:center!important' in block
assert 'text-align:center!important' in block
assert 'white-space:nowrap!important' in block
assert '.home-hero .home-invite-wrap>.btn' in block
assert 'background:linear-gradient(145deg,rgba(9,68,70,.96),rgba(6,47,49,.96))!important' in block
assert 'border-color:rgba(216,182,101,.62)!important' in block
