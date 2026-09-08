from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return (ROOT / name).read_text(encoding='utf-8')


def write(name, text):
    (ROOT / name).write_text(text, encoding='utf-8')


def replace_once(text, old, new, name):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'{name}: expected source not found: {old[:80]}')
    return text.replace(old, new, 1)


# Force a fresh demo URL so mobile Safari does not reuse the previous cached layout.
tournaments = read('tournaments.html')
tournaments = replace_once(
    tournaments,
    'play-v10.html?demo_tournament=1',
    'play-v10.html?demo_tournament=1&layout=header3',
    'tournaments.html',
)
write('tournaments.html', tournaments)

# Bump the isolated demo module and the live tournament script cache keys.
page = read('play-v10.html')
page = replace_once(page, 'play-tournament-demo.js?v=20260909-2', 'play-tournament-demo.js?v=20260909-3', 'play-v10.html')
page = replace_once(page, 'play-v8.js?v=20260909-tournamentbanner1', 'play-v8.js?v=20260909-tournamentbanner2', 'play-v10.html')
write('play-v10.html', page)

spectator_page = read('play.html')
spectator_page = replace_once(spectator_page, 'play-live.js?v=20260909-tournamentbanner1', 'play-live.js?v=20260909-tournamentbanner2', 'play.html')
write('play.html', spectator_page)

# The demo must explicitly put the badge in the header stack and must never mark the player card.
demo = read('play-tournament-demo.js')
demo = demo.replace("const topPlayerCard = $('topPlayerCard');\n", '')
demo = demo.replace("if(topPlayerCard) topPlayerCard.classList.add('tournament-match-card');\n", '')
anchor = "const coordsBottom = $('coordsBottom');\n"
addition = "const sideHeadStack = document.querySelector('.side-head-stack');\n"
if addition not in demo:
    if anchor not in demo:
        raise SystemExit('play-tournament-demo.js: coordsBottom anchor missing')
    demo = demo.replace(anchor, anchor + addition, 1)
placement = "if(sideHeadStack && tournamentGameBadge && tournamentGameBadge.parentElement !== sideHeadStack) sideHeadStack.appendChild(tournamentGameBadge);\n"
if placement not in demo:
    anchor2 = "if(tournamentGameBadge) tournamentGameBadge.hidden = false;\n"
    if anchor2 not in demo:
        raise SystemExit('play-tournament-demo.js: badge show anchor missing')
    demo = demo.replace(anchor2, placement + anchor2, 1)
write('play-tournament-demo.js', demo)

# Live player and spectator scripts should not couple tournament layout to the player card.
for name in ['play-v8.js', 'play-live.js']:
    text = read(name)
    text = text.replace("  topPlayerCard?.classList.remove('tournament-match-card');\n", '')
    text = text.replace("    topPlayerCard?.classList.add('tournament-match-card');\n", '')
    text = text.replace("    topPlayerCard?.classList.remove('tournament-match-card');\n", '')
    function_anchor = "async function loadTournamentGameContext(){\n  const badge=tournamentGameBadge;\n"
    ensure_line = "  const sideHeadStack=document.querySelector('.side-head-stack');\n  if(sideHeadStack && badge && badge.parentElement!==sideHeadStack) sideHeadStack.appendChild(badge);\n"
    if ensure_line not in text:
        if function_anchor not in text:
            raise SystemExit(f'{name}: tournament context anchor missing')
        text = text.replace(function_anchor, function_anchor + ensure_line, 1)
    write(name, text)

print('tournament demo/header placement fix applied')
