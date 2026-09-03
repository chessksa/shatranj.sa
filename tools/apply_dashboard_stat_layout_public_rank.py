from pathlib import Path
import re


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing expected {label}')
    return text.replace(old, new, 1)


profile_path = Path('profile.html')
profile = profile_path.read_text(encoding='utf-8')

stat_pattern = re.compile(
    r'(?P<indent>\s*)<span class="dashboard-icon-main"><span class="dashboard-icon-glyph" aria-hidden="true">.*?</span><strong id="(?P<id>[^"]+)">(?P<value>[^<]*)</strong></span>\s*'
    r'<span class="dashboard-icon-label">(?P<label>[^<]+)</span>',
    re.S,
)
stat_matches = list(stat_pattern.finditer(profile))
if len(stat_matches) != 10:
    raise SystemExit(f'expected 10 dashboard icon items, found {len(stat_matches)}')

profile = stat_pattern.sub(
    lambda m: (
        f'{m.group("indent")}<span class="dashboard-icon-label">{m.group("label")}</span>\n'
        f'{m.group("indent")}<strong id="{m.group("id")}">{m.group("value")}</strong>'
    ),
    profile,
)
profile = re.sub(r'\s*\.dashboard-icon-main\{[^}]*\}', '', profile)
profile = re.sub(r'\s*\.dashboard-icon-glyph\{[^}]*\}', '', profile)
profile = profile.replace(
    '.dashboard-icon-item strong{font-size:15px;color:var(--gold);line-height:1}',
    '.dashboard-icon-item strong{font-size:18px;color:var(--gold);line-height:1.1}',
)
profile = profile.replace(
    '.dashboard-icon-label{max-width:100%;font-size:10.5px;line-height:1.25;color:var(--cream);',
    '.dashboard-icon-label{max-width:100%;font-size:10.5px;line-height:1.25;color:var(--muted);',
)
profile_path.write_text(profile, encoding='utf-8')


player_html_path = Path('player.html')
player_html = player_html_path.read_text(encoding='utf-8')

identity_css = '.identity h1{margin:0 0 6px;font-size:clamp(24px,4vw,36px)}.meta{color:var(--muted);font-size:14px}'
rank_css = (
    '.identity h1{margin:0 0 6px;font-size:clamp(24px,4vw,36px)}'
    '.identity-name-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.identity-name-row h1{margin:0}'
    '.player-rank-badge{display:inline-flex;align-items:center;gap:6px;color:var(--gold);font-size:13px;font-weight:800;padding:4px 8px;border:1px solid rgba(212,180,103,.38);border-radius:999px;background:rgba(212,180,103,.08);white-space:nowrap}'
    '.rank-icon{width:22px;height:22px;display:block;color:var(--gold);fill:currentColor;stroke:currentColor}.rank-svg-defs{position:absolute;width:0;height:0;overflow:hidden}.player-rank-badge[data-rank=champion]{box-shadow:0 0 18px rgba(212,180,103,.15)}'
    '.meta{color:var(--muted);font-size:14px}'
)
player_html = replace_once(player_html, identity_css, rank_css, 'public rank badge CSS anchor')

rank_defs = '''<body>
  <svg class="rank-svg-defs" aria-hidden="true" focusable="false">
    <symbol id="rank-pawn" viewBox="0 0 64 64"><circle cx="32" cy="15" r="9" fill="currentColor"/><path d="M22 27h20l5 12H17l5-12Zm-7 16h34l5 10H10l5-10Z" fill="currentColor"/></symbol>
    <symbol id="rank-knight" viewBox="0 0 64 64"><path d="M17 52h36v-8H25c1-8 8-12 16-16 5-3 7-8 5-14l-8 5-8-8-3 11-9 8 6 5-7 17Zm17-31 5-3 1 5-6-2Z" fill="currentColor"/></symbol>
    <symbol id="rank-rook" viewBox="0 0 64 64"><path d="M14 10h9v8h7v-8h8v8h7v-8h9v17l-7 7v14h7v7H10v-7h7V34l-7-7V10h4Zm10 25h16v13H24V35Z" fill="currentColor"/></symbol>
    <symbol id="rank-queen" viewBox="0 0 64 64"><circle cx="13" cy="14" r="4" fill="currentColor"/><circle cx="32" cy="9" r="4" fill="currentColor"/><circle cx="51" cy="14" r="4" fill="currentColor"/><path d="M14 20l10 9 8-14 8 14 10-9-6 25H20l-6-25Zm5 31h26v6H19v-6Z" fill="currentColor"/></symbol>
    <symbol id="rank-crown" viewBox="0 0 64 64"><path d="M9 18l13 12 10-20 10 20 13-12-6 29H15L9 18Zm8 35h30v6H17v-6Z" fill="currentColor"/></symbol>
    <symbol id="rank-trophy" viewBox="0 0 64 64"><path d="M20 9h24v8h10v10c0 9-6 15-15 16-1 5-3 8-5 10h10v7H20v-7h10c-2-2-4-5-5-10-9-1-15-7-15-16V17h10V9Zm-4 14v4c0 5 3 8 8 9V23h-8Zm24 13c5-1 8-4 8-9v-4h-8v13Z" fill="currentColor"/></symbol>
  </svg>'''
player_html = replace_once(player_html, '<body>', rank_defs, 'public rank SVG insertion point')

old_public_name = '          <h1 id="publicName">—</h1>'
new_public_name = '''          <div class="identity-name-row">
            <h1 id="publicName">—</h1>
            <span class="player-rank-badge" id="publicRankBadge" data-rank="beginner">
              <svg class="rank-icon" viewBox="0 0 64 64" aria-hidden="true"><use id="publicRankUse" href="#rank-pawn"></use></svg>
              <span id="publicRankLabel">مبتدئ</span>
            </span>
          </div>'''
player_html = replace_once(player_html, old_public_name, new_public_name, 'public player name')
player_html = re.sub(r'player\.js\?v=[^"<]+', 'player.js?v=20260903-public-rank', player_html, count=1)
player_html_path.write_text(player_html, encoding='utf-8')


player_js_path = Path('player.js')
player_js = player_js_path.read_text(encoding='utf-8')

initial_line = "  const initial = (name) => (String(name || 'ل').trim().charAt(0) || 'ل').toUpperCase();\n"
rank_logic = '''  const initial = (name) => (String(name || 'ل').trim().charAt(0) || 'ل').toUpperCase();

  function rankForRating(rating) {
    const points = Number(rating) || 0;
    if (points >= 3000) return { key: 'champion', label: 'بطل', icon: 'rank-trophy' };
    if (points >= 2700) return { key: 'elite', label: 'نخبة', icon: 'rank-crown' };
    if (points >= 2400) return { key: 'professional', label: 'محترف', icon: 'rank-queen' };
    if (points >= 2100) return { key: 'advanced', label: 'متقدم', icon: 'rank-rook' };
    if (points >= 1800) return { key: 'competitor', label: 'منافس', icon: 'rank-knight' };
    return { key: 'beginner', label: 'مبتدئ', icon: 'rank-pawn' };
  }

  function renderPublicRank(rating) {
    const rank = rankForRating(rating);
    const badge = $('publicRankBadge');
    if (!badge) return;
    badge.dataset.rank = rank.key;
    $('publicRankLabel').textContent = rank.label;
    $('publicRankUse').setAttribute('href', `#${rank.icon}`);
  }
'''
player_js = replace_once(player_js, initial_line, rank_logic, 'public rank logic anchor')
player_js = replace_once(
    player_js,
    "      $('publicName').textContent=profile.name;\n",
    "      $('publicName').textContent=profile.name;\n      renderPublicRank(profile.rating);\n",
    'public rank render call',
)
player_js_path.write_text(player_js, encoding='utf-8')

print('dashboard stat layout and public rank applied')
