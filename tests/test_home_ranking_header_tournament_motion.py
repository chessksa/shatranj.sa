from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')
wrapper = Path('site-notifications.js').read_text(encoding='utf-8')

marker = '/* Compact ranking head only: preserve the approved horizontal layout */'
assert marker in css, 'Ranking head must have a narrowly scoped compact-height override.'
compact = css.split(marker, 1)[1]
assert 'html body.home-signed-in #ranking .head{' in compact
assert 'min-height:44px!important;' in compact
assert 'flex:0 0 44px!important;' in compact
assert 'padding:4px 10px!important;' in compact
assert 'grid-template-columns' not in compact, 'Do not redesign the ranking header while reducing its blank space.'

assert 'tournament-ticker-single' in wrapper, 'Tournament loading/fallback text must use a moving track class.'
assert 'tournamentTickerSingleMove' in wrapper, 'Tournament fallback needs its own continuous marquee animation.'
assert "track.className = 'welcome-ticker-track welcome-ticker-single';" in wrapper, 'Compatibility loader must patch the original static tournament class.'
assert "track.className = 'welcome-ticker-track tournament-ticker-single';" in wrapper, 'Compatibility loader must replace the static class with the moving class.'

print('ranking header compaction and tournament ticker motion contract is present')
