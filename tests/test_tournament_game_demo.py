from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

tournaments = (ROOT / 'tournaments.html').read_text(encoding='utf-8')
page = (ROOT / 'play-v10.html').read_text(encoding='utf-8')
demo_path = ROOT / 'play-tournament-demo.js'

assert 'play-v10.html?demo_tournament=1' in tournaments, 'tournaments page must link to tournament demo'
assert 'عرض مثال مباراة بطولة' in tournaments, 'demo link must be clearly labelled'
assert "const demoTournament = params.get('demo_tournament')==='1';" in page, 'play page must recognize demo mode'
assert 'play-tournament-demo.js?v=20260909-1' in page, 'play page must load isolated demo module'
assert demo_path.exists(), 'isolated tournament demo module must exist'

demo = demo_path.read_text(encoding='utf-8')
for marker in [
    "tournamentGameBadge.hidden = false",
    "tournamentGameName.textContent = 'البداية'",
    "tournamentGameRound.textContent = 'نصف النهائي'",
    "topName.textContent = 'اللاعب الأول'",
    "bottomName.textContent = 'اللاعب الثاني'",
    "topClock.textContent = '05:00'",
    "bottomClock.textContent = '05:00'",
    "location.href='tournaments.html'",
    "new Chessboard",
    "pieces/shatranj-approved-20260904.svg",
]:
    assert marker in demo, marker

assert 'createClient' not in demo, 'demo must not connect to Supabase'
assert ".rpc(" not in demo, 'demo must not call server RPCs'

print('tournament game visual demo: PASS')
