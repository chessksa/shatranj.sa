from pathlib import Path

path = Path('play-v10.html')
html = path.read_text(encoding='utf-8')

marker = '/* Pregame mobile fit */'
css = r'''
    /* Pregame mobile fit */
    @media(max-width:900px){
      body.pregame{height:100dvh!important;min-height:0!important;overflow:hidden!important}
      body.pregame #gamePage{height:100dvh!important;min-height:0!important;padding:3px 5px!important;overflow:hidden!important}
      body.pregame #gamePage .layout{height:100%!important;min-height:0!important;display:flex!important;flex-direction:column!important;gap:3px!important;overflow:hidden!important;justify-content:flex-start!important}
      body.pregame .side-panel,body.pregame .panel-stack{display:contents!important}
      body.pregame .side-header{order:0;width:100%;min-height:38px!important;height:38px!important;padding:2px 6px!important;border-radius:9px!important}
      body.pregame .side-brand{font-size:11px!important;gap:4px!important}
      body.pregame .side-brand-mark{width:25px!important;height:25px!important;font-size:16px!important;border-radius:7px!important}
      body.pregame .side-header-actions{gap:3px!important}
      body.pregame .side-icon-btn{height:29px!important;width:54px!important;font-size:9px!important;border-radius:7px!important}
      body.pregame #siteNotificationHost{width:54px!important;min-width:54px!important}
      body.pregame #siteNotificationHost .site-notification-bell{width:54px!important;height:29px!important;border-radius:7px!important}
      body.pregame #topPlayerCard{order:1;width:100%;min-height:96px!important;height:96px!important;padding:4px 6px!important;border-radius:10px!important}
      body.pregame #opponentSearchPanel{display:grid!important;height:100%!important;min-height:0!important;padding:2px 3px!important;align-content:center!important}
      body.pregame .opponent-search-title{font-size:14px!important;margin-bottom:5px!important;line-height:1.1!important}
      body.pregame .opponent-time-options{gap:5px!important}
      body.pregame .opponent-time-option{min-height:52px!important;height:52px!important;border-radius:9px!important}
      body.pregame .opponent-time-option strong{font-size:20px!important;line-height:1!important}
      body.pregame .opponent-time-option span{font-size:9px!important;line-height:1!important}
      body.pregame .board-panel{order:2;width:100%;height:auto!important;min-height:0!important;flex:1 1 auto!important;display:flex!important;flex-direction:column!important;gap:3px!important;justify-content:flex-start!important;align-items:center!important;overflow:hidden!important}
      body.pregame .board-panel>.board-frame{width:min(calc(100vw - 12px),calc(100dvh - 260px))!important;max-width:100%!important;padding:4px 4px 11px!important;border-radius:9px!important;margin:0 auto!important;flex:0 0 auto!important}
      body.pregame .board-panel>.actions-card{width:min(calc(100vw - 12px),calc(100dvh - 260px))!important;min-height:34px!important;height:34px!important;border-radius:8px!important;flex:0 0 34px!important}
      body.pregame .board-panel>.actions-card .action-item{min-height:34px!important;height:34px!important;padding:1px 3px!important;gap:2px!important}
      body.pregame .board-panel>.actions-card .action-icon{font-size:14px!important}
      body.pregame .board-panel>.actions-card .action-label{font-size:9px!important}
      body.pregame .board-panel>.actions-card .grace-countdown{font-size:8px!important;min-width:20px!important;padding:1px 4px!important}
      body.pregame .panel-stack>.player-card:not(#topPlayerCard){order:3;width:100%;min-height:64px!important;height:64px!important;padding:4px 6px!important;grid-template-columns:40px minmax(0,1fr) 80px!important;gap:5px!important;border-radius:10px!important}
      body.pregame .panel-stack>.player-card:not(#topPlayerCard) .avatar{width:38px!important;height:38px!important;border-radius:8px!important}
      body.pregame .panel-stack>.player-card:not(#topPlayerCard) .name{font-size:12px!important;margin:0 0 1px!important;line-height:1.1!important}
      body.pregame .panel-stack>.player-card:not(#topPlayerCard) .location{font-size:8px!important;margin-bottom:1px!important;line-height:1!important}
      body.pregame .panel-stack>.player-card:not(#topPlayerCard) .rating{font-size:9px!important;gap:3px!important;line-height:1!important}
      body.pregame .panel-stack>.player-card:not(#topPlayerCard) .status{font-size:8px!important;margin:1px 0 0!important;gap:3px!important;line-height:1!important}
      body.pregame .panel-stack>.player-card:not(#topPlayerCard) .status::before{width:5px!important;height:5px!important}
      body.pregame .panel-stack>.player-card:not(#topPlayerCard) .clock{font-size:16px!important;padding:4px 3px!important;border-radius:7px!important}
      body.pregame .panel-stack>.player-card:not(#topPlayerCard) .clock-progress{margin-top:2px!important;height:3px!important}
      body.pregame .coords-left,body.pregame .coords-bottom{font-size:8px!important}
    }
'''

if marker not in html:
    html = html.replace('  </style>', css + '  </style>', 1)

if "document.body.classList.add('pregame')" not in html:
    needle = "    }else{\n      const s=document.createElement('script');"
    replacement = "    }else{\n      document.body.classList.add('pregame');\n      const s=document.createElement('script');"
    if needle not in html:
        raise SystemExit('Could not locate pregame script branch')
    html = html.replace(needle, replacement, 1)

path.write_text(html, encoding='utf-8')
