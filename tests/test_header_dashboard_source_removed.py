from pathlib import Path
html = Path("index.html").read_text(encoding="utf-8")
sw = Path("sw.js").read_text(encoding="utf-8")
css = Path("home-theme.css").read_text(encoding="utf-8")
header = html.split('<header class="home-header">', 1)[1].split('</header>', 1)[0]
assert 'id="dashboardNav"' in header, "dashboardNav must remain in desktop header source"
assert 'لوحة التحكم' in header
marker = '/* Mobile header remove dashboard final 20260905 */'
assert marker in css
assert 'body.home-signed-in .compact-member-nav .dashboard-link{display:none!important}' in css.split(marker,1)[1]
assert 'const CACHE="shatranj-arab-v3";' in sw
assert 'client.navigate(client.url)' in sw
print("desktop dashboard present + mobile dashboard hidden: PASS")
