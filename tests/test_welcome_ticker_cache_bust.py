from pathlib import Path
import re

index = Path('index.html').read_text(encoding='utf-8')

old = 'site-notifications.js?v=20260905-3'
assert old not in index, (
    'The home page still references the pre-welcome-ticker cached wrapper.'
)

match = re.search(r'site-notifications\.js\?v=([^"\']+)', index)
assert match and match.group(1), 'site-notifications.js must use a versioned URL.'

print('welcome ticker cache-bust reference is current:', match.group(1))
