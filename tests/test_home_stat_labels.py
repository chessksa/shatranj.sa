from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')
html = Path('index.html').read_text(encoding='utf-8')
watch = Path('watch.html').read_text(encoding='utf-8')

assert '.hero-stat div small{order:1!important;margin:0 0 7px!important;font-size:14px!important}' in css, 'hero stat labels must be 14px'
assert '<small>المتواجدين</small><strong id="headerOnlineCount">0</strong>' in html, 'online presence must render in headerOnlineCount'
assert '<small>المباريات الآن</small><strong id="headerMatchesCount">0</strong>' in html, 'live matches must render in headerMatchesCount'
assert 'href="watch.html"' in html and '<small>المباريات الآن</small><strong id="headerMatchesCount">0</strong>' in html, 'matches tile must link to watch page'
assert ".from('live_games')" in html, 'home live match counter must read live_games'
assert "for(const table of ['matches','games'])" not in watch, 'watch page must not use legacy match tables'
assert ".from('live_games')" in watch, 'watch page must read live_games'
print('home live stats bindings: PASS')
