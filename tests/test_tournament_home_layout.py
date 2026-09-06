from pathlib import Path

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

assert 'HOME PLAY ACTION STACK 20260906' in theme
assert 'grid-template-rows:repeat(3,56px)!important' in theme
assert 'grid-row:1/4!important' in theme
assert '.home-invite-wrap{grid-column:2!important;grid-row:1!important}' in theme
assert '.hero-computer-btn{grid-column:2!important;grid-row:2!important}' in theme
assert '.hero-tournaments-btn{grid-column:2!important;grid-row:3!important}' in theme

assert 'get_tournament_registration_counts' in migrations
assert 'security definer' in migrations.lower()
assert 'grant execute on function public.get_tournament_registration_counts() to anon, authenticated;' in migrations.lower()

print('tournament table fits without horizontal scroll, shows registration count, and play action spans three buttons')
