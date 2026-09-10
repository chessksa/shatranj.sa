from pathlib import Path

HTML = (Path(__file__).resolve().parents[1] / 'tournaments.html').read_text(encoding='utf-8')

assert 'site-presence.js?v=20260910-detail-split1' in HTML, 'tournaments page must load the new detail split layout script with a fresh cache-busting version'
assert 'site-presence.js?v=20260906-1' not in HTML, 'stale site-presence script version must not remain on tournaments page'

print('tournament detail cache bust: PASS')
