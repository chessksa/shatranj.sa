from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path, old, new):
    p = ROOT / path
    text = p.read_text(encoding='utf-8')
    if new and new in text:
        return
    if old not in text:
        raise SystemExit(f'{path}: expected source block not found')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')


old_css = """    .tournament-game-badge{position:absolute;z-index:18;top:8px;left:50%;transform:translateX(-50%);max-width:min(78%,520px);min-height:29px;padding:4px 10px;border:1px solid rgba(224,181,103,.78);border-radius:10px;background:rgba(3,43,48,.95);box-shadow:0 6px 16px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;gap:7px;direction:rtl;white-space:nowrap;font-size:11px;line-height:1.15}
    .tournament-game-badge strong{color:#ffbd73;font-size:11px;font-weight:900}.tournament-game-context{display:flex;align-items:center;gap:5px;min-width:0;color:#f4efe6;font-weight:800}.tournament-game-context #tournamentGameName{max-width:250px;overflow:hidden;text-overflow:ellipsis}.tournament-game-context #tournamentGameRound{color:#efcf7c}
    @media(max-width:900px){.tournament-game-badge{top:5px;max-width:82%;min-height:25px;padding:3px 8px;font-size:10px}.tournament-game-badge strong{font-size:10px}.tournament-game-context #tournamentGameName{max-width:140px}}
"""

new_css = """    #topPlayerCard.tournament-match-card{position:relative;padding-bottom:48px}
    .tournament-player-banner{position:absolute;z-index:8;left:14px;right:96px;bottom:10px;min-height:36px;padding:5px 12px;border:1px solid rgba(224,181,103,.82);border-radius:18px;background:linear-gradient(90deg,rgba(3,43,48,.98),rgba(5,62,67,.96));box-shadow:0 5px 14px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.04);display:flex;align-items:center;gap:10px;direction:ltr;white-space:nowrap;overflow:hidden;line-height:1.1}
    .tournament-game-cup{flex:0 0 auto;font-size:20px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}.tournament-game-round{flex:0 0 auto;color:#f4efe6;font-size:13px;font-weight:800;direction:rtl}.tournament-game-divider{flex:0 0 1px;width:1px;height:22px;background:rgba(224,181,103,.72)}.tournament-game-title{margin-left:auto;min-width:0;overflow:hidden;text-overflow:ellipsis;color:#f4efe6;font-size:14px;font-weight:900;direction:rtl}.tournament-game-title strong{color:#ffbd73;font-size:14px;font-weight:900}.tournament-game-title #tournamentGameName{color:#ffbd73;max-width:220px;overflow:hidden;text-overflow:ellipsis}
    @media(max-width:900px){body.live-game #topPlayerCard.tournament-match-card,#topPlayerCard.tournament-match-card{min-height:132px!important;height:132px!important;flex:0 0 132px!important;padding:7px 8px 42px!important}.tournament-player-banner{left:8px;right:98px;bottom:7px;min-height:30px;height:30px;padding:3px 8px;border-radius:15px;gap:7px}.tournament-game-cup{font-size:16px}.tournament-game-round{font-size:11px}.tournament-game-divider{height:18px}.tournament-game-title,.tournament-game-title strong{font-size:11px}.tournament-game-title #tournamentGameName{max-width:115px}}
"""

for path in ['play-v10.html', 'play.html']:
    replace_once(path, old_css, new_css)

old_board_badge = """        <div class=\"tournament-game-badge\" id=\"tournamentGameBadge\" hidden aria-label=\"مباراة بطولة\">
          <strong>بطولة</strong>
          <span class=\"tournament-game-context\"><span id=\"tournamentGameName\">—</span><span aria-hidden=\"true\">·</span><span id=\"tournamentGameRound\">—</span></span>
        </div>
"""
for path in ['play-v10.html', 'play.html']:
    replace_once(path, old_board_badge, '')

new_badge = """              <div class=\"tournament-game-badge tournament-player-banner\" id=\"tournamentGameBadge\" hidden aria-label=\"مباراة بطولة\">
                <span class=\"tournament-game-cup\" aria-hidden=\"true\">🏆</span>
                <span class=\"tournament-game-round\" id=\"tournamentGameRound\">—</span>
                <span class=\"tournament-game-divider\" aria-hidden=\"true\"></span>
                <span class=\"tournament-game-title\"><strong>بطولة</strong> <span id=\"tournamentGameName\">—</span></span>
              </div>"""

replace_once(
    'play-v10.html',
    "              <div class=\"clock-box\"><div class=\"clock\" id=\"topClock\">--:--</div><div class=\"clock-progress\"><span></span></div></div>",
    "              <div class=\"clock-box\"><div class=\"clock\" id=\"topClock\">--:--</div><div class=\"clock-progress\"><span></span></div></div>\n" + new_badge,
)

replace_once('play.html', '          <section class="player-card">\n            <div class="avatar" id="topAvatar"></div>', '          <section class="player-card" id="topPlayerCard">\n            <div class="avatar" id="topAvatar"></div>')
replace_once(
    'play.html',
    """            <div class=\"clock-box\">
              <div class=\"clock\" id=\"topClock\">00:00</div>
              <div class=\"clock-progress\"><span style=\"width:76%\"></span></div>
            </div>""",
    """            <div class=\"clock-box\">
              <div class=\"clock\" id=\"topClock\">00:00</div>
              <div class=\"clock-progress\"><span style=\"width:76%\"></span></div>
            </div>
""" + new_badge.replace('              ', '            ', 1),
)

for path in ['play-v8.js', 'play-live.js']:
    replace_once(path, '  badge.hidden = true;\n  try{', "  badge.hidden = true;\n  topPlayerCard?.classList.remove('tournament-match-card');\n  try{")
    replace_once(path, '    badge.hidden = false;\n  }catch(err){', "    badge.hidden = false;\n    topPlayerCard?.classList.add('tournament-match-card');\n  }catch(err){")
    replace_once(path, "    badge.hidden = true;\n  }\n}", "    badge.hidden = true;\n    topPlayerCard?.classList.remove('tournament-match-card');\n  }\n}")

replace_once('play-live.js', "const bottomAvatarEl = $('bottomAvatar');\nconst resignBtn", "const bottomAvatarEl = $('bottomAvatar');\nconst topPlayerCard = $('topPlayerCard');\nconst resignBtn")

replace_once('play-tournament-demo.js', "const tournamentGameRound = $('tournamentGameRound');\nconst opponentSearchPanel", "const tournamentGameRound = $('tournamentGameRound');\nconst topPlayerCard = $('topPlayerCard');\nconst opponentSearchPanel")
replace_once('play-tournament-demo.js', "if(tournamentGameBadge) tournamentGameBadge.hidden = false;", "if(tournamentGameBadge) tournamentGameBadge.hidden = false;\nif(topPlayerCard) topPlayerCard.classList.add('tournament-match-card');")

replace_once('play-v10.html', "s.src='play-tournament-demo.js?v=20260909-1';", "s.src='play-tournament-demo.js?v=20260909-2';")
replace_once('play-v10.html', "s.src='play-v8.js?v=20260909-tournamentbadge1';", "s.src='play-v8.js?v=20260909-tournamentbanner1';")
replace_once('play.html', "const PLAY_CACHE_RESET_VERSION = '20260909-tournamentbadge1';", "const PLAY_CACHE_RESET_VERSION = '20260909-tournamentbanner1';")
replace_once('play.html', 'src="play-live.js?v=20260909-tournamentbadge1"', 'src="play-live.js?v=20260909-tournamentbanner1"')

replace_once('tests/test_last_move_highlight.py', '"play-v8.js?v=20260909-tournamentbadge1",', '"play-v8.js?v=20260909-tournamentbanner1",')
replace_once('tests/test_tournament_game_demo.py', "assert 'play-tournament-demo.js?v=20260909-1' in page", "assert 'play-tournament-demo.js?v=20260909-2' in page")
replace_once('tests/test_tournament_game_badge.py', "        'class=\"tournament-game-badge\"',", "        'tournament-game-badge',")

print('tournament player banner implementation applied')
