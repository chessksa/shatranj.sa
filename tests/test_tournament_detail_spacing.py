from pathlib import Path

source = (Path(__file__).resolve().parents[1] / 'site-presence.js').read_text(encoding='utf-8')

assert '#tournamentDetailCard{\n        padding:4px!important;\n        overflow:hidden!important;' in source
assert '.tournament-detail-layout{\n        height:100%;\n        min-height:0;\n        display:grid;' in source
assert '.tournament-info-panel,\n      .tournament-matches-panel{' in source
assert '.tournament-info-panel .detail-register{' in source

print('tournament detail spacing keeps both panels aligned with 4px outer gap')
