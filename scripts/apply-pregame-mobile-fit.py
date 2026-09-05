from pathlib import Path

path = Path('play-v10.html')
html = path.read_text(encoding='utf-8')

# Keep the original pregame state hook.
if "document.body.classList.add('pregame')" not in html:
    needle = "    }else{\n      const s=document.createElement('script');"
    replacement = "    }else{\n      document.body.classList.add('pregame');\n      const s=document.createElement('script');"
    if needle not in html:
        raise SystemExit('Could not locate pregame script branch')
    html = html.replace(needle, replacement, 1)

# Equalize the lower player card with the 96px upper time-selection card.
html = html.replace(
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard){order:3;width:100%;min-height:64px!important;height:64px!important;padding:4px 6px!important;grid-template-columns:40px minmax(0,1fr) 80px!important;gap:5px!important;border-radius:10px!important}',
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard){order:3;width:100%;min-height:96px!important;height:96px!important;padding:7px 8px!important;grid-template-columns:54px minmax(0,1fr) 92px!important;gap:7px!important;border-radius:10px!important}'
)
html = html.replace(
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .avatar{width:38px!important;height:38px!important;border-radius:8px!important}',
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .avatar{width:52px!important;height:52px!important;border-radius:9px!important}'
)
html = html.replace(
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .name{font-size:12px!important;margin:0 0 1px!important;line-height:1.1!important}',
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .name{font-size:14px!important;margin:0 0 2px!important;line-height:1.12!important}'
)
html = html.replace(
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .location{font-size:8px!important;margin-bottom:1px!important;line-height:1!important}',
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .location{font-size:9px!important;margin-bottom:2px!important;line-height:1.05!important}'
)
html = html.replace(
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .rating{font-size:9px!important;gap:3px!important;line-height:1!important}',
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .rating{font-size:10px!important;gap:3px!important;line-height:1.05!important}'
)
html = html.replace(
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .status{font-size:8px!important;margin:1px 0 0!important;gap:3px!important;line-height:1!important}',
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .status{font-size:9px!important;margin:2px 0 0!important;gap:3px!important;line-height:1!important}'
)
html = html.replace(
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .clock{font-size:16px!important;padding:4px 3px!important;border-radius:7px!important}',
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .clock{font-size:20px!important;padding:7px 4px!important;border-radius:8px!important}'
)
html = html.replace(
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .clock-progress{margin-top:2px!important;height:3px!important}',
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .clock-progress{margin-top:3px!important;height:4px!important}'
)

# Restore root vertical scrolling/overscroll so iOS Safari pull-to-refresh works.
html = html.replace(
    'body.pregame{height:100dvh!important;min-height:0!important;overflow:hidden!important}',
    'body.pregame{height:auto!important;min-height:100dvh!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch;overscroll-behavior-y:auto!important}'
)
html = html.replace(
    'body.live-game{height:100dvh!important;min-height:0!important;overflow:hidden!important}',
    'body.live-game{height:auto!important;min-height:100dvh!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch;overscroll-behavior-y:auto!important}'
)

path.write_text(html, encoding='utf-8')
