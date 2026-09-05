from pathlib import Path

index = Path('index.html').read_text(encoding='utf-8')

expected = 'site-notifications.js?v=20260906-welcome1'
assert expected in index, (
    'The home page must use a fresh site-notifications.js URL so browsers do not '
    'reuse the pre-welcome-ticker cached wrapper.'
)

print('welcome ticker cache-bust reference is current')
