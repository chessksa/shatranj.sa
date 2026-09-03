from pathlib import Path
fresh_html = Path('play-v8.html').read_text(encoding='utf-8')
fresh_js = Path('play-v8.js').read_text(encoding='utf-8')
fresh_css = Path('play-v8.css').read_text(encoding='utf-8')
assert 'PLAY_CACHE_RESET_VERSION' not in fresh_html
assert 'play-v8.css?v=20260903-8' in fresh_html
assert 'play-v8.js?v=20260903-8' in fresh_html
assert 'piece-image' in fresh_css
assert 'assets/pieces/${color}${type}.png' in fresh_js
assert 'play-v8.html?game=' in fresh_js
for name in ['index.html','profile.html','profile.js','profile-section.js','site-notifications.js']:
    text = Path(name).read_text(encoding='utf-8')
    assert 'play-v8.html' in text, name
print('fresh play route: PASS')
