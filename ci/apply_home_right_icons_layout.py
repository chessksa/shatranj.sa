from pathlib import Path

path = Path('home-theme.css')
css = path.read_text(encoding='utf-8')

replacements = [
    (
        '#rankingTitle{margin:0!important;color:var(--hero-gold)!important;font-size:0!important;line-height:1!important}\n#rankingTitle::after{content:"ترتيب اللاعبين";font-size:20px;font-weight:900}',
        '#rankingTitle{margin:0!important;color:var(--hero-gold)!important;font-size:18px!important;line-height:1.35!important;font-weight:900}'
    ),
    (
        '  #ranking{grid-column:2;grid-row:2}\n  .home-features{grid-column:2/4;grid-row:3}\n  .home-features>.wrap{width:100%!important;margin:0!important}',
        '  #ranking{grid-column:2;grid-row:2/4}\n  .home-features{grid-column:3;grid-row:3}\n  .home-features>.wrap{width:100%!important;margin:0!important}\n  .home-feature-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}'
    ),
    (
        '  #rankingTitle::after{font-size:18px}\n',
        '  #rankingTitle{font-size:16px!important}\n'
    ),
    (
        '  body.home-signed-in #ranking{grid-row:2;height:100%;padding:16px 0 10px!important;overflow:hidden;align-self:stretch}',
        '  body.home-signed-in #ranking{grid-row:2/4;height:100%;padding:16px 0 10px!important;overflow:hidden;align-self:stretch}'
    ),
    (
        '  body.home-signed-in .home-feature-grid{gap:10px!important;height:88px}\n  body.home-signed-in .home-feature-card{min-height:0;height:88px;padding:8px 10px;border-radius:15px}\n  body.home-signed-in .feature-icon{margin-bottom:5px;font-size:24px}\n  body.home-signed-in .home-feature-card strong{font-size:15px}\n  body.home-signed-in .home-feature-card small{margin-top:3px;font-size:10px}',
        '  body.home-signed-in .home-feature-grid{gap:8px!important;height:88px;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-template-rows:repeat(2,minmax(0,1fr))!important}\n  body.home-signed-in .home-feature-card{min-height:0;height:auto;padding:4px 8px;border-radius:13px;flex-direction:row;gap:6px}\n  body.home-signed-in .feature-icon{margin:0;font-size:19px}\n  body.home-signed-in .home-feature-card strong{font-size:12px}\n  body.home-signed-in .home-feature-card small{display:none}'
    ),
]

for old, new in replacements:
    if old not in css:
        raise SystemExit(f'expected CSS block not found:\n{old[:160]}')
    css = css.replace(old, new, 1)

path.write_text(css, encoding='utf-8')
print('applied home right-icons layout')
