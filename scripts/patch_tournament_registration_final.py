from pathlib import Path

path = Path("index.html")
text = path.read_text(encoding="utf-8")

style_start = text.find('<style id="publicTournamentStyles">')
if style_start != -1:
    style_end = text.find('</style>', style_start)
    if style_end == -1:
        raise SystemExit("publicTournamentStyles closing tag missing")
    text = text[:style_start] + text[style_end + len('</style>'):]

section_start = text.find('<!-- PUBLIC TOURNAMENTS -->')
if section_start != -1:
    account_start = text.find('<!-- ACCOUNT -->', section_start)
    if account_start == -1:
        raise SystemExit("ACCOUNT marker missing after tournaments section")
    text = text[:section_start] + text[account_start:]

js_start = text.find('function publicTournamentScope(row){')
if js_start != -1:
    js_end = text.find("function setAuthMsg(text,type=''){", js_start)
    if js_end == -1:
        raise SystemExit("setAuthMsg marker missing")
    text = text[:js_start] + text[js_end:]

text = text.replace("\nloadPublicTournaments().catch(error=>console.error(error));\n", "\n", 1)

for marker in ('<section id="tournaments"','id="publicTournamentStyles"','publicTournamentsList','loadPublicTournaments'):
    if marker in text:
        raise SystemExit(f"leftover marker: {marker}")

# Preserve the current welcome ticker cache version from latest main.
if 'site-notifications.js?v=20260906-ticker-hyphen1' not in text:
    raise SystemExit('latest welcome ticker cache token was not preserved')

path.write_text(text, encoding="utf-8")
