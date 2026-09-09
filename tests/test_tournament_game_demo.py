from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

tournaments = (ROOT / 'tournaments.html').read_text(encoding='utf-8')
page = (ROOT / 'play-v10.html').read_text(encoding='utf-8')
demo_path = ROOT / 'play-tournament-demo.js'
play = (ROOT / 'play-v8.js').read_text(encoding='utf-8')
spectator_play = (ROOT / 'play-live.js').read_text(encoding='utf-8')

assert 'play-v10.html?demo_tournament=1&layout=header3' not in tournaments, 'tournaments page must not expose the tournament demo link'
assert 'عرض مثال مباراة بطولة' not in tournaments, 'tournaments page must not show a tournament demo example'
assert "const demoTournament = params.get('demo_tournament')==='1';" in page, 'play page must recognize demo mode'
assert 'play-tournament-demo.js?v=20260909-3' in page, 'play page must load the fixed isolated demo module'
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
    "document.querySelector('.side-head-stack')",
    "sideHeadStack.appendChild(tournamentGameBadge)",
]:
    assert marker in demo, marker

for script in [demo, play, spectator_play]:
    assert 'tournament-match-card' not in script, 'obsolete player-card tournament class must not be used'

assert 'createClient' not in demo, 'demo must not connect to Supabase'
assert ".rpc(" not in demo, 'demo must not call server RPCs'

print('tournament game visual demo: PASS')
