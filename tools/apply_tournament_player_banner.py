from pathlib import Path
import re
import textwrap

ROOT = Path(__file__).resolve().parents[1]

NEW_CSS = """    .side-head-stack{display:grid;gap:7px;width:100%}
    .tournament-player-banner{position:relative;z-index:8;width:100%;min-height:40px;padding:6px 12px;border:1px solid rgba(224,181,103,.82);border-radius:18px;background:linear-gradient(90deg,rgba(3,43,48,.98),rgba(5,62,67,.96));box-shadow:0 5px 14px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center;gap:12px;direction:ltr;text-align:center;white-space:nowrap;overflow:hidden;line-height:1.1}
    .tournament-game-cup{flex:0 0 auto;font-size:20px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}.tournament-game-round{flex:0 0 auto;color:#f4efe6;font-size:13px;font-weight:800;direction:rtl;text-align:center}.tournament-game-divider{flex:0 0 1px;width:1px;height:22px;background:rgba(224,181,103,.72)}.tournament-game-title{min-width:0;overflow:hidden;text-overflow:ellipsis;color:#f4efe6;font-size:14px;font-weight:900;direction:rtl;text-align:center;display:flex;align-items:center;justify-content:center;gap:4px}.tournament-game-title strong{color:#ffbd73;font-size:14px;font-weight:900}.tournament-game-title #tournamentGameName{color:#ffbd73;max-width:220px;overflow:hidden;text-overflow:ellipsis}
    @media(max-width:900px){.side-head-stack{order:0;width:100%;gap:5px}.tournament-player-banner{min-height:30px;height:30px;padding:3px 8px;border-radius:15px;gap:7px}.tournament-game-cup{font-size:16px}.tournament-game-round{font-size:11px}.tournament-game-divider{height:18px}.tournament-game-title,.tournament-game-title strong{font-size:11px}.tournament-game-title #tournamentGameName{max-width:135px}}
"""

BANNER_LINES = [
    '<div class="tournament-game-badge tournament-player-banner" id="tournamentGameBadge" hidden aria-label="مباراة بطولة">',
    '  <span class="tournament-game-cup" aria-hidden="true">🏆</span>',
    '  <span class="tournament-game-round" id="tournamentGameRound">—</span>',
    '  <span class="tournament-game-divider" aria-hidden="true"></span>',
    '  <span class="tournament-game-title"><strong>بطولة</strong> <span id="tournamentGameName">—</span></span>',
    '</div>',
]


def replace_banner_css(text, path):
    start = text.find('    #topPlayerCard.tournament-match-card{')
    if start < 0:
        if '.side-head-stack{' in text and 'justify-content:center' in text:
            return text
        raise SystemExit(f'{path}: old tournament banner CSS not found')
    end = text.find('\n\n', start)
    if end < 0:
        raise SystemExit(f'{path}: tournament banner CSS terminator not found')
    return text[:start] + NEW_CSS.rstrip('\n') + text[end:]


def remove_existing_banner(text, path):
    pattern = re.compile(
        r'\n[ \t]*<div class="tournament-game-badge tournament-player-banner" id="tournamentGameBadge" hidden aria-label="مباراة بطولة">.*?\n[ \t]*</div>',
        re.S,
    )
    text, count = pattern.subn('', text, count=1)
    if count != 1:
        if 'class="side-head-stack"' in text and text.count('id="tournamentGameBadge"') == 1:
            return text
        raise SystemExit(f'{path}: existing tournament banner not found exactly once')
    return text


def wrap_header_with_banner(text, path):
    if 'class="side-head-stack"' in text:
        return text

    stack_pos = text.find('<div class="panel-stack">')
    if stack_pos < 0:
        raise SystemExit(f'{path}: panel stack not found')
    header_pos = text.find('<div class="side-header">', stack_pos)
    top_pos = text.find('id="topPlayerCard"', header_pos)
    if header_pos < 0 or top_pos < 0:
        raise SystemExit(f'{path}: header/top-player markers not found')

    top_section_pos = text.rfind('<section', header_pos, top_pos + 1)
    if top_section_pos < 0:
        raise SystemExit(f'{path}: top player section not found')

    header_line_start = text.rfind('\n', 0, header_pos) + 1
    top_line_start = text.rfind('\n', 0, top_section_pos) + 1
    header_block = text[header_line_start:top_line_start].rstrip()
    indent = text[header_line_start:header_pos]

    if '<div class="side-header">' not in header_block:
        raise SystemExit(f'{path}: side header block malformed')

    banner = '\n'.join(indent + '  ' + line for line in BANNER_LINES)
    wrapped = (
        indent + '<div class="side-head-stack">\n'
        + textwrap.indent(header_block, '  ')
        + '\n'
        + banner
        + '\n'
        + indent + '</div>\n\n'
    )
    return text[:header_line_start] + wrapped + text[top_line_start:]


def update_page(path):
    file_path = ROOT / path
    text = file_path.read_text(encoding='utf-8')
    text = replace_banner_css(text, path)
    text = remove_existing_banner(text, path)
    text = wrap_header_with_banner(text, path)
    file_path.write_text(text, encoding='utf-8')


for page in ('play-v10.html', 'play.html'):
    update_page(page)

print('tournament banner moved below header and centered')
