from pathlib import Path

source = Path('site-presence.js').read_text(encoding='utf-8')

assert '.tournament-detail-table th{\n        width:39%;\n        text-align:center;\n        color:#d9c58f;\n        background:rgba(4,38,40,.42);\n        font-size:14px;' in source
assert '.tournament-detail-table td{\n        text-align:center;\n        color:var(--hero-cream,#f4eddc);\n        font-size:14px;' in source
assert '.tournament-detail-table th{width:36%;font-size:9px}' in source
assert '.tournament-detail-table td{font-size:10px}' in source

print('tournament detail table uses 14px on desktop and keeps mobile sizes')
