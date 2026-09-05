from pathlib import Path

html = Path('index.html').read_text(encoding='utf-8')
sw = Path('sw.js').read_text(encoding='utf-8')

header = html.split('<header class="home-header">', 1)[1].split('</header>', 1)[0]
assert 'id="dashboardNav"' not in header, 'dashboardNav must be removed from the header source'
assert 'const CACHE="shatranj-arab-v3";' in sw, 'service worker cache must be versioned to v3'
assert 'if(e.request.mode==="navigate"){' in sw, 'navigations must have a dedicated network-first branch'
assert 'fetch(new Request(e.request,{cache:"no-store"}))' in sw, 'navigation must bypass stale HTTP cache'
assert 'c.put(e.request,response.clone())' in sw, 'fresh navigation response should update offline cache'
assert 'client.navigate(client.url)' in sw, 'updated service worker must reload stale open clients'
print('header dashboard source removal + fresh navigation: PASS')
