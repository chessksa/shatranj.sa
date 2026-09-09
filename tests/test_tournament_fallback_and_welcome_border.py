from pathlib import Path

css = Path('home-theme.css').read_text(encoding='utf-8')
wrapper = Path('site-notifications.js').read_text(encoding='utf-8')

assert '/* Welcome ticker top gold divider */' in css
assert '#welcomeTicker{' in css
assert 'border-top:1px solid rgba(197,163,77,.55)!important;' in css

assert "const fallbackOld = `" in wrapper
assert "const fallbackNew = `" in wrapper
assert "track.className = 'welcome-ticker-track';" in wrapper
assert "group.className = 'welcome-ticker-group';" in wrapper
assert "for (let index = 0; index < 6; index += 1)" in wrapper
assert "track.replaceChildren(buildFallbackGroup(), buildFallbackGroup());" in wrapper
assert "if (source.includes(fallbackOld)) source = source.replace(fallbackOld, fallbackNew);" in wrapper

print('tournament fallback repeats seamlessly and welcome ticker has a top gold divider')
