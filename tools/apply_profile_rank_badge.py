from pathlib import Path

html_path = Path('profile.html')
js_path = Path('profile.js')
html = html_path.read_text(encoding='utf-8')
js = js_path.read_text(encoding='utf-8')

if 'id="playerRankBadge"' not in html:
    identity_css = ".identity h1{margin:0 0 6px;font-size:clamp(23px,4vw,34px)}.identity .sub{color:var(--muted);font-size:14px}.identity .rating{display:inline-flex;align-items:center;gap:6px;margin-top:10px;color:var(--gold);font-size:18px;font-weight:800}.hero-actions{display:flex;gap:8px;flex-direction:column;min-width:150px}"
    rank_css = identity_css + "\n    .identity-name-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.identity-name-row h1{margin:0}.player-rank-badge{display:inline-flex;align-items:center;gap:6px;color:var(--gold);font-size:13px;font-weight:800;padding:4px 8px;border:1px solid rgba(212,180,103,.38);border-radius:999px;background:rgba(212,180,103,.08);white-space:nowrap}.rank-icon{width:22px;height:22px;display:block;color:var(--gold);fill:currentColor;stroke:currentColor}.rank-svg-defs{position:absolute;width:0;height:0;overflow:hidden}.player-rank-badge[data-rank=champion]{box-shadow:0 0 18px rgba(212,180,103,.15)}"
    if identity_css not in html:
        raise SystemExit('identity CSS anchor not found')
    html = html.replace(identity_css, rank_css, 1)

    body_anchor = '<body>\n'
    svg_defs = '''<body>\n  <svg class="rank-svg-defs" aria-hidden="true" focusable="false">\n    <symbol id="rank-pawn" viewBox="0 0 64 64"><circle cx="32" cy="15" r="9" fill="currentColor"/><path d="M22 27h20l5 12H17l5-12Zm-7 16h34l5 10H10l5-10Z" fill="currentColor"/></symbol>\n    <symbol id="rank-knight" viewBox="0 0 64 64"><path d="M17 52h36v-8H25c1-8 8-12 16-16 5-3 7-8 5-14l-8 5-8-8-3 11-9 8 6 5-7 17Zm17-31 5-3 1 5-6-2Z" fill="currentColor"/></symbol>\n    <symbol id="rank-rook" viewBox="0 0 64 64"><path d="M14 10h9v8h7v-8h8v8h7v-8h9v17l-7 7v14h7v7H10v-7h7V34l-7-7V10h4Zm10 25h16v13H24V35Z" fill="currentColor"/></symbol>\n    <symbol id="rank-queen" viewBox="0 0 64 64"><circle cx="13" cy="14" r="4" fill="currentColor"/><circle cx="32" cy="9" r="4" fill="currentColor"/><circle cx="51" cy="14" r="4" fill="currentColor"/><path d="M14 20l10 9 8-14 8 14 10-9-6 25H20l-6-25Zm5 31h26v6H19v-6Z" fill="currentColor"/></symbol>\n    <symbol id="rank-crown" viewBox="0 0 64 64"><path d="M9 18l13 12 10-20 10 20 13-12-6 29H15L9 18Zm8 35h30v6H17v-6Z" fill="currentColor"/></symbol>\n    <symbol id="rank-trophy" viewBox="0 0 64 64"><path d="M20 9h24v8h10v10c0 9-6 15-15 16-1 5-3 8-5 10h10v7H20v-7h10c-2-2-4-5-5-10-9-1-15-7-15-16V17h10V9Zm-4 14v4c0 5 3 8 8 9V23h-8Zm24 13c5-1 8-4 8-9v-4h-8v13Z" fill="currentColor"/></symbol>\n  </svg>\n'''
    if body_anchor not in html:
        raise SystemExit('body anchor not found')
    html = html.replace(body_anchor, svg_defs, 1)

    name_anchor = '          <h1 id="playerName">—</h1>\n'
    name_badge = '''          <div class="identity-name-row">\n            <h1 id="playerName">—</h1>\n            <span class="player-rank-badge" id="playerRankBadge" data-rank="beginner">\n              <svg class="rank-icon" viewBox="0 0 64 64" aria-hidden="true"><use id="playerRankUse" href="#rank-pawn"></use></svg>\n              <span id="playerRankLabel">مبتدئ</span>\n            </span>\n          </div>\n'''
    if name_anchor not in html:
        raise SystemExit('player name anchor not found')
    html = html.replace(name_anchor, name_badge, 1)

    achievements_block = '''        <div class="card always-visible" id="achievementsSection" style="grid-column:1/-1">\n          <div class="card-head"><h2>الإنجازات</h2></div>\n          <div class="achievement-grid" id="achievementsList"></div>\n        </div>\n'''
    if achievements_block not in html:
        raise SystemExit('achievements block anchor not found')
    html = html.replace(achievements_block, '', 1)
    html = html.replace('profile.js?v=20260903-icon-nav', 'profile.js?v=20260903-rank-badge', 1)

if 'function rankForRating' not in js:
    achievements_const = '''  const ACHIEVEMENTS = [\n    ['first_win','♟','أول فوز','تحقيق أول انتصار'],\n    ['wins_10','♜','10 انتصارات','الوصول إلى 10 انتصارات'],\n    ['games_50','♞','50 مباراة','إكمال 50 مباراة'],\n    ['streak_5','♛','سلسلة 5 انتصارات','خمسة انتصارات متتالية'],\n    ['rating_1600','★','1600','الوصول إلى تصنيف 1600'],\n    ['rating_1800','★★','1800','الوصول إلى تصنيف 1800'],\n    ['rating_2000','♚','2000','الوصول إلى تصنيف 2000']\n  ];\n\n'''
    if achievements_const not in js:
        raise SystemExit('achievements const anchor not found')
    rank_code = '''  function rankForRating(rating) {\n    const points = Number(rating) || 0;\n    if (points >= 3000) return { key: 'champion', label: 'بطل', icon: 'rank-trophy' };\n    if (points >= 2700) return { key: 'elite', label: 'نخبة', icon: 'rank-crown' };\n    if (points >= 2400) return { key: 'professional', label: 'محترف', icon: 'rank-queen' };\n    if (points >= 2100) return { key: 'advanced', label: 'متقدم', icon: 'rank-rook' };\n    if (points >= 1800) return { key: 'competitor', label: 'منافس', icon: 'rank-knight' };\n    return { key: 'beginner', label: 'مبتدئ', icon: 'rank-pawn' };\n  }\n\n  function renderPlayerRank(rating) {\n    const rank = rankForRating(rating);\n    const badge = $('playerRankBadge');\n    badge.dataset.rank = rank.key;\n    $('playerRankLabel').textContent = rank.label;\n    $('playerRankUse').setAttribute('href', `#${rank.icon}`);\n  }\n\n'''
    js = js.replace(achievements_const, rank_code, 1)

    rating_anchor = "    $('heroRating').textContent = row.rating;\n"
    if rating_anchor not in js:
        raise SystemExit('hero rating anchor not found')
    js = js.replace(rating_anchor, rating_anchor + '    renderPlayerRank(row.rating);\n', 1)

    achievements_fn = '''  async function loadAchievements() {\n    const { data, error } = await client.rpc('get_my_achievements');\n    if (error) throw error;\n    const earned = new Map((data || []).map(x => [x.achievement_code, x.earned_at]));\n    $('achievementsList').innerHTML = ACHIEVEMENTS.map(([code,icon,name,hint]) => {\n      const at = earned.get(code);\n      const date = at ? new Date(at).toLocaleDateString('ar-SA') : 'غير مكتسبة بعد';\n      return `<div class="achievement ${at ? 'earned' : 'locked'}"><div class="ico">${icon}</div><div><div class="name">${name}</div><div class="hint">${at ? `مكتسبة • ${date}` : hint}</div></div></div>`;\n    }).join('');\n  }\n\n'''
    if achievements_fn not in js:
        raise SystemExit('loadAchievements anchor not found')
    js = js.replace(achievements_fn, '', 1)
    js = js.replace('await Promise.all([loadProfileNavigationCounts(), loadRecentGames(), loadAchievements()]);', 'await Promise.all([loadProfileNavigationCounts(), loadRecentGames()]);', 1)

html_path.write_text(html, encoding='utf-8')
js_path.write_text(js, encoding='utf-8')
print('profile rank badge applied')
