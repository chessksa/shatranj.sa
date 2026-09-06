from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')

old_matches = '<div><small>المباريات الآن</small><strong id="headerMatchesCount">0</strong></div>'
new_matches = '<div><small>المتواجدين</small><strong id="headerMatchesCount">0</strong></div>'
old_online = '<div><small>المتواجدين</small><strong id="headerOnlineCount">0</strong></div>'
new_online = '<div><small>المباريات الآن</small><strong id="headerOnlineCount">0</strong></div>'

if text.count(old_matches) != 1:
    raise SystemExit('matches label anchor not found exactly once')
if text.count(old_online) != 1:
    raise SystemExit('online label anchor not found exactly once')

text = text.replace(old_matches, new_matches, 1)
text = text.replace(old_online, new_online, 1)
path.write_text(text, encoding='utf-8')
