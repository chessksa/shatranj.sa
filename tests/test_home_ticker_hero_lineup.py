from pathlib import Path

wrapper = Path('site-notifications.js').read_text(encoding='utf-8')

assert '#tournamentResultsTicker .welcome-ticker-track' in wrapper, (
    'Tournament results ticker must override the shared 60s welcome ticker speed.'
)
assert 'animation-duration:52s!important;' in wrapper, (
    'Tournament ticker must run at 52s so it is only slightly faster than the 60s welcome ticker.'
)
assert 'installHeroTitleLineup' in wrapper, 'Hero title alignment styles must be installed.'
assert 'white-space:nowrap!important;' in wrapper, 'Hero welcome title must stay on one line.'
assert '.home-hero h1 span{display:inline!important}' in wrapper, (
    'The Shatranj Al Arab span must stay inline with the welcome phrase.'
)
assert '.home-hero .hero-live-stats{' in wrapper
assert 'max-width:760px!important;' in wrapper, (
    'Hero title and stats/icons must share the same 760px visual width.'
)

print('tournament speed and one-line hero title contract is present')
