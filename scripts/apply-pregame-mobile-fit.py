from pathlib import Path

path = Path('play-v10.html')
html = path.read_text(encoding='utf-8')

# Enlarge the mobile pregame header without changing desktop.
replacements = {
    'body.pregame .side-header{order:0;width:100%;min-height:38px!important;height:38px!important;padding:2px 6px!important;border-radius:9px!important}':
    'body.pregame .side-header{order:0;width:100%;min-height:48px!important;height:48px!important;padding:4px 7px!important;border-radius:10px!important}',
    'body.pregame .side-brand{font-size:11px!important;gap:4px!important}':
    'body.pregame .side-brand{font-size:14px!important;gap:6px!important}',
    'body.pregame .side-brand-mark{width:25px!important;height:25px!important;font-size:16px!important;border-radius:7px!important}':
    'body.pregame .side-brand-mark{width:32px!important;height:32px!important;font-size:20px!important;border-radius:8px!important}',
    'body.pregame .side-header-actions{gap:3px!important}':
    'body.pregame .side-header-actions{gap:4px!important}',
    'body.pregame .side-icon-btn{height:29px!important;width:54px!important;font-size:9px!important;border-radius:7px!important}':
    'body.pregame .side-icon-btn{height:34px!important;width:58px!important;font-size:10px!important;border-radius:8px!important}',
    'body.pregame #siteNotificationHost{width:54px!important;min-width:54px!important}':
    'body.pregame #siteNotificationHost{width:58px!important;min-width:58px!important}',
    'body.pregame #siteNotificationHost .site-notification-bell{width:54px!important;height:29px!important;border-radius:7px!important}':
    'body.pregame #siteNotificationHost .site-notification-bell{width:58px!important;height:34px!important;border-radius:8px!important}',

    # Fill the lower player card with a much larger avatar and a 20px name.
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard){order:3;width:100%;min-height:96px!important;height:96px!important;padding:7px 8px!important;grid-template-columns:54px minmax(0,1fr) 92px!important;gap:7px!important;border-radius:10px!important}':
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard){order:3;width:100%;min-height:96px!important;height:96px!important;padding:7px 8px!important;grid-template-columns:82px minmax(0,1fr) 92px!important;gap:8px!important;border-radius:10px!important}',
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .avatar{width:52px!important;height:52px!important;border-radius:9px!important}':
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .avatar{width:78px!important;height:78px!important;border-radius:10px!important}',
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .name{font-size:14px!important;margin:0 0 2px!important;line-height:1.12!important}':
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .name{font-size:20px!important;margin:0 0 3px!important;line-height:1.35!important;padding-bottom:2px!important}',
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .name{font-size:20px!important;margin:0 0 3px!important;line-height:1.08!important}':
    'body.pregame .panel-stack>.player-card:not(#topPlayerCard) .name{font-size:20px!important;margin:0 0 3px!important;line-height:1.35!important;padding-bottom:2px!important}',
}
for old, new in replacements.items():
    html = html.replace(old, new)

# Universal mobile downward swipe-to-refresh during pregame/search only.
# A tap remains untouched; refresh only takes over after 12px of downward movement.
html = html.replace(
    '      const PULL_REFRESH_THRESHOLD=72;\n',
    '      const PULL_REFRESH_THRESHOLD=72;\n      const PULL_ACTIVATE_DISTANCE=12;\n'
) if 'const PULL_ACTIVATE_DISTANCE=12' not in html else html

html = html.replace(
    '      const isBlockedPullTarget=(target)=>Boolean(target?.closest?.(\'button,a,input,textarea,select,[role="button"]\') || target?.closest?.(\'.board-frame,.board-shell,#board,.move-hints\'));\n',
    ''
)

html = html.replace(
    '        if(event.touches.length!==1 || window.scrollY>2 || isBlockedPullTarget(event.target)) return resetPull();\n        pullStartY=event.touches[0].clientY;\n        pullActive=true;',
    '        if(event.touches.length!==1) return resetPull();\n        pullStartY=event.touches[0].clientY;\n        pullActive=true;'
)

# Disable pull-to-refresh completely once a live game starts.
html = html.replace(
    '      const handlePullStart=(event)=>{\n        if(event.touches.length!==1) return resetPull();',
    '      const handlePullStart=(event)=>{\n        if(!document.body.classList.contains(\'pregame\')) return resetPull();\n        if(event.touches.length!==1) return resetPull();'
)
html = html.replace(
    '      const handlePullMove=(event)=>{\n        if(!pullActive || event.touches.length!==1) return;',
    '      const handlePullMove=(event)=>{\n        if(!document.body.classList.contains(\'pregame\')) return resetPull();\n        if(!pullActive || event.touches.length!==1) return;'
)
html = html.replace(
    '      const handlePullEnd=()=>{\n        if(!pullActive) return resetPull();',
    '      const handlePullEnd=()=>{\n        if(!document.body.classList.contains(\'pregame\')) return resetPull();\n        if(!pullActive) return resetPull();'
)

html = html.replace(
    '        const distance=event.touches[0].clientY-pullStartY;\n        if(distance<=0) return resetPull();\n        pullDistance=Math.min(distance,110);',
    '        const distance=event.touches[0].clientY-pullStartY;\n        if(distance<=0) return resetPull();\n        if(distance<PULL_ACTIVATE_DISTANCE) return;\n        pullDistance=Math.min(distance,110);'
)

path.write_text(html, encoding='utf-8')
