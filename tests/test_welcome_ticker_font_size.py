from pathlib import Path

wrapper = Path('site-notifications.js').read_text(encoding='utf-8')

assert "id = 'welcomeTickerFont16Styles'" in wrapper, (
    'Welcome ticker font override must have a stable style id.'
)
assert '#welcomeTicker .welcome-ticker-label' in wrapper, (
    'Fixed welcome ticker label must use the approved 16px size.'
)
assert '#welcomeTicker .welcome-ticker-item' in wrapper, (
    'Scrolling welcome ticker member text must use the approved 16px size.'
)
assert '#welcomeTicker .welcome-ticker-loading' in wrapper, (
    'Welcome ticker loading text must use the approved 16px size.'
)
assert 'font-size:16px!important' in wrapper, (
    'Welcome ticker font size must remain 16px on desktop and mobile.'
)

print('welcome ticker typography is fixed at 16px across desktop and mobile')
