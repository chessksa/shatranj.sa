from pathlib import Path

JS = (Path(__file__).resolve().parents[1] / 'site-presence.js').read_text(encoding='utf-8')

assert '.tournament-detail-layout{' in JS, 'tournament detail must use a two-column layout'
assert 'grid-template-columns:minmax(0,0.9fr) minmax(0,1.1fr)' in JS, 'desktop detail layout must reserve separate space for info and matches'
assert "infoPanel.className = 'tournament-info-panel'" in JS, 'detail data needs its own panel'
assert "matchesPanel.className = 'tournament-matches-panel'" in JS, 'tournament matches need their own panel'
assert "table.className = 'tournament-detail-table'" in JS, 'tournament data must remain in a compact table'
assert "matchesTable.className = 'tournament-matches-table'" in JS, 'matches must render in a separate table'
assert '<th>الدور</th><th>اللاعبان</th><th>الحالة</th><th>الإجراء</th>' in JS, 'matches table must expose round, players, status, and action columns'
assert '.tournament-matches-scroll{' in JS and 'overflow-y:auto' in JS, 'only the matches area should scroll internally when needed'
assert "observer.observe(detailCard, { childList: true })" in JS, 'detail transformation must keep following same-page detail rendering'
assert "bracketObserver.observe(bracketHost, { childList: true, subtree: true })" in JS, 'match table must stay synchronized with bracket refreshes'
print('tournament detail split layout: PASS')
