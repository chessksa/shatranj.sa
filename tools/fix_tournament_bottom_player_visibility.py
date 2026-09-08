from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace(path, old, new):
    p = ROOT / path
    text = p.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'missing expected text in {path}: {old[:80]!r}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')


# Mark live tournament pages so mobile clipping rules can be relaxed only for them.
for path in ('play-v8.js', 'play-live.js'):
    replace(
        path,
        "  if(!badge || !liveGameId || !supabase) return;\n  badge.hidden = true;",
        "  if(!badge || !liveGameId || !supabase) return;\n  document.documentElement.classList.remove('tournament-match');\n  document.body.classList.remove('tournament-match');\n  badge.hidden = true;",
    )
    replace(
        path,
        "    if(!row?.tournament_name) return;\n    if(tournamentGameNameEl)",
        "    if(!row?.tournament_name) return;\n    document.documentElement.classList.add('tournament-match');\n    document.body.classList.add('tournament-match');\n    if(tournamentGameNameEl)",
    )
    replace(
        path,
        "    console.warn('تعذر تحميل بيانات بطولة المباراة',err);\n    badge.hidden = true;",
        "    console.warn('تعذر تحميل بيانات بطولة المباراة',err);\n    document.documentElement.classList.remove('tournament-match');\n    document.body.classList.remove('tournament-match');\n    badge.hidden = true;",
    )

replace(
    'play-tournament-demo.js',
    "const sideHeadStack = document.querySelector('.side-head-stack');\n",
    "const sideHeadStack = document.querySelector('.side-head-stack');\n\ndocument.documentElement.classList.add('tournament-match');\ndocument.body.classList.add('tournament-match');\n",
)

css_rule = """

/* Tournament banner adds a row; keep the board size unchanged and let the page extend so the lower player is never clipped. */
@media(max-width:900px){
  html.tournament-match,body.live-game.tournament-match{height:auto!important;min-height:100%!important;overflow-y:auto!important;overflow-x:hidden!important}
  body.live-game.tournament-match #gamePage{height:auto!important;min-height:100dvh!important;overflow:visible!important}
  body.live-game.tournament-match #gamePage .layout{height:auto!important;min-height:100dvh!important;overflow:visible!important}
}
"""

p = ROOT / 'exact-board-v13.css'
text = p.read_text(encoding='utf-8')
if 'body.live-game.tournament-match #gamePage' not in text:
    p.write_text(text.rstrip() + css_rule + '\n', encoding='utf-8')

# Inline root override ensures the root element is scrollable even before the external CSS settles.
replace(
    'play-v10.html',
    "  </style>\n  <link rel=\"stylesheet\" href=\"exact-board-v13.css?v=20260909-tournamentboardwidth2\" />",
    "    @media(max-width:900px){html.tournament-match{height:auto!important;overflow-y:auto!important}}\n  </style>\n  <link rel=\"stylesheet\" href=\"exact-board-v13.css?v=20260909-tournamentbottomplayer1\" />",
)

# Legacy/spectator page does not load exact-board-v13.css, so give it the same tournament-only escape from clipping.
replace(
    'play.html',
    "    @media(max-width:900px){.side-head-stack{order:0;width:100%;gap:5px}.tournament-player-banner{min-height:30px;height:30px;padding:3px 8px;border-radius:15px;gap:7px}.tournament-game-cup{font-size:16px}.tournament-game-round{font-size:11px}.tournament-game-divider{height:18px}.tournament-game-title,.tournament-game-title strong{font-size:11px}.tournament-game-title #tournamentGameName{max-width:135px}}\n",
    "    @media(max-width:900px){.side-head-stack{order:0;width:100%;gap:5px}.tournament-player-banner{min-height:30px;height:30px;padding:3px 8px;border-radius:15px;gap:7px}.tournament-game-cup{font-size:16px}.tournament-game-round{font-size:11px}.tournament-game-divider{height:18px}.tournament-game-title,.tournament-game-title strong{font-size:11px}.tournament-game-title #tournamentGameName{max-width:135px}}\n    @media(max-width:900px){html.tournament-match,body.live-game.tournament-match{height:auto!important;min-height:100%!important;overflow-y:auto!important;overflow-x:hidden!important}body.live-game.tournament-match #gamePage{height:auto!important;min-height:100dvh!important;overflow:visible!important}body.live-game.tournament-match #gamePage .layout{height:auto!important;min-height:100dvh!important;overflow:visible!important}}\n",
)

print('tournament bottom-player visibility fix applied')
