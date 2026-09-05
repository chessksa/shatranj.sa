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

# Restore root vertical scrolling/overscroll so iOS Safari can receive downward gestures.
html = html.replace(
    'body.pregame{height:100dvh!important;min-height:0!important;overflow:hidden!important}',
    'body.pregame{height:auto!important;min-height:100dvh!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch;overscroll-behavior-y:auto!important}'
)
html = html.replace(
    'body.live-game{height:100dvh!important;min-height:0!important;overflow:hidden!important}',
    'body.live-game{height:auto!important;min-height:100dvh!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch;overscroll-behavior-y:auto!important}'
)

# Polish the active opponent-search state and keep the vertical stack tight.
search_marker = '/* Mobile opponent search polish */'
search_css = r'''
    /* Mobile opponent search polish */
    @media(max-width:900px){
      body.pregame #opponentSearchWaiting{width:100%;height:100%;display:grid;align-content:center;justify-items:center}
      body.pregame #opponentSearchWaiting .opponent-waiting-line{font-size:18px!important;color:#ffbd6a!important;font-weight:800!important;gap:9px!important;line-height:1.2!important}
      body.pregame #opponentSearchWaiting .opponent-waiting-line strong{font-size:18px!important;color:inherit!important}
      body.pregame #opponentSearchWaiting .search-dots{gap:5px!important}
      body.pregame #opponentSearchWaiting .search-dots i{background:#ffbd6a!important;width:7px!important;height:7px!important}
      body.pregame #opponentSearchWaiting .opponent-waiting-meta{margin-top:9px!important;gap:22px!important;font-size:10px!important;line-height:1.15!important}
      body.pregame #opponentSearchWaiting .inline-cancel-search{margin-top:15px!important;height:32px!important;padding:0 18px!important;border-radius:8px!important}
      body.pregame .board-panel{order:2;width:100%;height:auto!important;min-height:0!important;flex:0 0 auto!important;display:flex!important;flex-direction:column!important;gap:3px!important;justify-content:flex-start!important;align-items:center!important;overflow:visible!important}
    }
'''
if search_marker not in html:
    html = html.replace('  </style>', search_css + '  </style>', 1)

# Add an in-page pull-to-refresh gesture for mobile Safari. It starts only from
# the upper page area and ignores interactive controls to avoid interfering with chess moves.
pull_marker = '/* Mobile in-page pull refresh */'
pull_css = r'''
    /* Mobile in-page pull refresh */
    #mobilePullRefresh{position:fixed;z-index:120;top:6px;left:50%;transform:translate(-50%,-56px);min-width:122px;height:34px;padding:0 13px;border:1px solid rgba(224,181,103,.55);border-radius:18px;background:rgba(3,43,48,.96);color:#f4cd67;display:flex;align-items:center;justify-content:center;font:700 11px Arial,sans-serif;opacity:0;pointer-events:none;transition:transform .16s ease,opacity .16s ease;box-shadow:0 6px 18px rgba(0,0,0,.24)}
    #mobilePullRefresh.visible{opacity:1}
    #mobilePullRefresh.ready{color:#ffbd6a;border-color:rgba(255,189,106,.78)}
'''
if pull_marker not in html:
    html = html.replace('  </style>', pull_css + '  </style>', 1)

if 'id="mobilePullRefresh"' not in html:
    html = html.replace('<body>', '<body>\n  <div id="mobilePullRefresh" aria-hidden="true">اسحب للتحديث</div>', 1)

pull_script_marker = 'const PULL_REFRESH_THRESHOLD=72'
if pull_script_marker not in html:
    pull_script = r'''
  <script>
    (()=>{
      const indicator=document.getElementById('mobilePullRefresh');
      if(!indicator || !window.matchMedia('(max-width:900px)').matches) return;
      const PULL_REFRESH_THRESHOLD=72;
      const PULL_START_ZONE=120;
      let pullStartY=0;
      let pullDistance=0;
      let pullActive=false;

      const isInteractive=(target)=>Boolean(target?.closest?.('button,a,input,textarea,select,[role="button"]'));
      const resetPull=()=>{
        pullActive=false;
        pullDistance=0;
        indicator.classList.remove('visible','ready');
        indicator.style.transform='translate(-50%,-56px)';
        indicator.textContent='اسحب للتحديث';
      };
      const handlePullStart=(event)=>{
        if(event.touches.length!==1 || window.scrollY>0) return resetPull();
        const touch=event.touches[0];
        if(touch.clientY>PULL_START_ZONE || isInteractive(event.target)) return resetPull();
        pullStartY=touch.clientY;
        pullActive=true;
      };
      const handlePullMove=(event)=>{
        if(!pullActive || event.touches.length!==1) return;
        const distance=event.touches[0].clientY-pullStartY;
        if(distance<=0) return resetPull();
        pullDistance=Math.min(distance,110);
        event.preventDefault();
        const shown=Math.min(42,pullDistance*.45);
        indicator.classList.add('visible');
        indicator.classList.toggle('ready',pullDistance>=PULL_REFRESH_THRESHOLD);
        indicator.style.transform=`translate(-50%,${shown-40}px)`;
        indicator.textContent=pullDistance>=PULL_REFRESH_THRESHOLD?'اترك للتحديث':'اسحب للتحديث';
      };
      const handlePullEnd=()=>{
        if(!pullActive) return resetPull();
        const shouldRefresh=pullDistance>=PULL_REFRESH_THRESHOLD;
        if(!shouldRefresh) return resetPull();
        indicator.classList.add('visible','ready');
        indicator.style.transform='translate(-50%,2px)';
        indicator.textContent='جارٍ التحديث…';
        setTimeout(()=>location.reload(),80);
      };
      document.addEventListener('touchstart',handlePullStart,{passive:true});
      document.addEventListener('touchmove',handlePullMove,{passive:false});
      document.addEventListener('touchend',handlePullEnd,{passive:true});
      document.addEventListener('touchcancel',resetPull,{passive:true});
    })();
  </script>
'''
    html = html.replace('</body>', pull_script + '</body>', 1)

path.write_text(html, encoding='utf-8')
