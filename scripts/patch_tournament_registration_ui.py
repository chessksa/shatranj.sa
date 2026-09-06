from pathlib import Path

path = Path("index.html")
text = path.read_text(encoding="utf-8")

style_start = text.find('<style id="publicTournamentStyles">')
if style_start != -1:
    style_end = text.find('</style>', style_start)
    if style_end == -1:
        raise SystemExit("publicTournamentStyles closing tag missing")
    text = text[:style_start] + text[style_end + len('</style>'):]

section_marker = '<!-- PUBLIC TOURNAMENTS -->'
account_marker = '<!-- ACCOUNT -->'
section_start = text.find(section_marker)
if section_start != -1:
    account_start = text.find(account_marker, section_start)
    if account_start == -1:
        raise SystemExit("ACCOUNT marker missing after tournaments section")
    text = text[:section_start] + text[account_start:]

js_start_marker = 'function publicTournamentScope(row){'
js_end_marker = "function setAuthMsg(text,type=''){"
js_start = text.find(js_start_marker)
if js_start != -1:
    js_end = text.find(js_end_marker, js_start)
    if js_end == -1:
        raise SystemExit("setAuthMsg marker missing after tournament helpers")
    text = text[:js_start] + text[js_end:]

text = text.replace("\nloadPublicTournaments().catch(error=>console.error(error));\n", "\n", 1)

for forbidden in [
    '<section id="tournaments"',
    'id="publicTournamentStyles"',
    'publicTournamentsList',
    'loadPublicTournaments',
]:
    if forbidden in text:
        raise SystemExit(f"leftover marker: {forbidden}")

path.write_text(text, encoding="utf-8")
