from pathlib import Path

# The home play controls must remain a balanced 2x2 grid on desktop and mobile.
page = Path('tournaments.html').read_text(encoding='utf-8')
theme = Path('home-theme.css').read_text(encoding='utf-8')
migrations = '\n'.join(
    path.read_text(encoding='utf-8')
    for path in Path('supabase/migrations').glob('*.sql')
)

assert 'TOURNAMENT TABLE NO SCROLL 20260906' in page
assert '.table-wrap{overflow:visible}' in page
assert 'min-width:0' in page
assert '<th>المسجلون</th>' in page
assert 'get_tournament_registration_counts' in page
assert 'data-registration-count' in page
assert 'registered_count' in page

assert 'HOME PLAY ACTION GRID 20260906' in theme
assert 'grid-template-columns:repeat(2,minmax(0,1fr))!important' in theme
assert 'grid-template-rows:repeat(2,88px)!important' in theme
assert 'grid-template-rows:repeat(2,66px)!important' in theme
assert '.hero-play-btn::before{content:"▶"}' in theme
assert '.home-invite-wrap>.btn::before{content:"♙＋"}' in theme
assert '.hero-computer-btn::before{content:"▣"}' in theme
assert '.hero-tournaments-btn::before{content:"♛"}' in theme
assert 'HOME PLAY ACTION STACK 20260906' not in theme

assert 'get_tournament_registration_counts' in migrations
assert 'security definer' in migrations.lower()
assert 'grant execute on function public.get_tournament_registration_counts() to anon, authenticated;' in migrations.lower()

print('tournament layout remains intact and home play actions use a responsive four-button grid')
