from pathlib import Path

path = Path('play-v10.html')
html = path.read_text(encoding='utf-8')

if "document.body.classList.add('live-game');" not in html:
    old = "    if(hasGame){\n      document.getElementById('opponentSearchPanel').hidden = true;"
    new = "    if(hasGame){\n      document.body.classList.add('live-game');\n      document.getElementById('opponentSearchPanel').hidden = true;"
    if old not in html:
        raise SystemExit('live-game script insertion point not found')
    html = html.replace(old, new, 1)

marker = '/* Live mobile game stack */'
if marker not in html:
    patch = r'''

    /* Live mobile game stack */
    @media(max-width:900px){
      body.live-game{height:100dvh!important;min-height:0!important;overflow:hidden!important}
      body.live-game #matchmakingScreen{display:none!important}
      body.live-game #gamePage{height:100dvh!important;min-height:0!important;padding:3px 5px!important;overflow:hidden!important}
      body.live-game #gamePage .layout{height:100%!important;min-height:0!important;display:flex!important;flex-direction:column!important;gap:3px!important;overflow:hidden!important;justify-content:flex-start!important}
      body.live-game .side-panel,body.live-game .panel-stack{display:contents!important}
      body.live-game .side-header{order:0;width:100%;min-height:38px!important;height:38px!important;padding:2px 6px!important;border-radius:9px!important}
      body.live-game .side-brand{font-size:11px!important;gap:4px!important}
      body.live-game .side-brand-mark{width:25px!important;height:25px!important;font-size:16px!important;border-radius:7px!important}
      body.live-game .side-header-actions{gap:3px!important}
      body.live-game .side-icon-btn{height:29px!important;width:54px!important;font-size:9px!important;border-radius:7px!important}
      body.live-game #siteNotificationHost{width:54px!important;min-width:54px!important}
      body.live-game #siteNotificationHost .site-notification-bell{width:54px!important;height:29px!important;border-radius:7px!important}
      body.live-game #opponentSearchPanel{display:none!important}
      body.live-game #topPlayerLive{display:contents!important}
      body.live-game #topPlayerCard{order:1;width:100%;min-height:64px!important;height:64px!important;padding:4px 6px!important;grid-template-columns:40px minmax(0,1fr) 80px!important;gap:5px!important;border-radius:10px!important}
      body.live-game .board-panel{order:2;width:100%;height:auto!important;min-height:0!important;flex:1 1 auto!important;display:flex!important;flex-direction:column!important;gap:3px!important;justify-content:flex-start!important;align-items:center!important;overflow:hidden!important}
      body.live-game .board-panel>.board-frame{width:min(calc(100vw - 10px),calc(100dvh - 236px))!important;max-width:100%!important;padding:4px 4px 11px!important;border-radius:9px!important;margin:0 auto!important;flex:0 0 auto!important}
      body.live-game .board-panel>.actions-card{width:min(calc(100vw - 10px),calc(100dvh - 236px))!important;min-height:34px!important;height:34px!important;border-radius:8px!important;flex:0 0 34px!important}
      body.live-game .board-panel>.actions-card .action-item{min-height:34px!important;height:34px!important;padding:1px 3px!important;gap:2px!important}
      body.live-game .board-panel>.actions-card .action-icon{font-size:14px!important}
      body.live-game .board-panel>.actions-card .action-label{font-size:9px!important}
      body.live-game .board-panel>.actions-card .grace-countdown{font-size:8px!important;min-width:20px!important;padding:1px 4px!important}
      body.live-game .panel-stack>.player-card:not(#topPlayerCard){order:3;width:100%;min-height:64px!important;height:64px!important;padding:4px 6px!important;grid-template-columns:40px minmax(0,1fr) 80px!important;gap:5px!important;border-radius:10px!important}
      body.live-game .player-card .avatar{width:38px!important;height:38px!important;border-radius:8px!important}
      body.live-game .player-card .name{font-size:12px!important;margin:0 0 1px!important;line-height:1.1!important}
      body.live-game .player-card .location{font-size:8px!important;margin-bottom:1px!important;line-height:1!important}
      body.live-game .player-card .rating{font-size:9px!important;gap:3px!important;line-height:1!important}
      body.live-game .player-card .status{font-size:8px!important;margin:1px 0 0!important;gap:3px!important;line-height:1!important}
      body.live-game .player-card .status::before{width:5px!important;height:5px!important}
      body.live-game .player-card .clock{font-size:16px!important;padding:4px 3px!important;border-radius:7px!important}
      body.live-game .player-card .clock-progress{margin-top:2px!important;height:3px!important}
      body.live-game .coords-left,body.live-game .coords-bottom{font-size:8px!important}
    }
'''
    html = html.replace('  </style>', patch + '  </style>', 1)

path.write_text(html, encoding='utf-8')
