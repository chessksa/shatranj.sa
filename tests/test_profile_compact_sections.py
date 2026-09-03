from pathlib import Path
import re

html = Path('profile.html').read_text(encoding='utf-8')
js = Path('profile.js').read_text(encoding='utf-8')

assert 'تطور التصنيف' not in html, 'rating development section must be removed'
assert 'id="ratingChart"' not in html, 'rating chart container must be removed'
assert 'id="ratingDeltaBadge"' not in html, 'rating delta badge must be removed'

expected = {
    'friendsList': 'الأصدقاء',
    'incomingRequests': 'طلبات الصداقة',
    'outgoingRequests': 'الطلبات المرسلة',
    'incomingChallenges': 'التحديات',
    'outgoingChallenges': 'التحديات المرسلة',
}
for target, title in expected.items():
    pattern = rf'<button[^>]+class="section-toggle"[^>]+data-collapse-target="{target}"[^>]*>.*?{re.escape(title)}.*?</button>\s*<div class="list" id="{target}" hidden>'
    assert re.search(pattern, html, re.S), f'compact collapsible row missing for {title}'

assert 'طلبات الصداقة الواردة' not in html, 'incoming wording must be removed from friend requests title'
assert '<h2>التحديات الواردة</h2>' not in html, 'incoming wording must be removed from challenges title'

assert 'id="recentGames"' in html and 'id="recentGames" hidden' not in html, 'recent games must stay visible'
assert 'id="achievementsList"' in html and 'id="achievementsList" hidden' not in html, 'achievements must stay visible'
assert 'data-collapse-target="recentGames"' not in html, 'recent games must not be collapsible'
assert 'data-collapse-target="achievementsList"' not in html, 'achievements must not be collapsible'

assert '/* Unified compact profile sections 20260903 */' in html, 'compact profile styling marker missing'
assert '.compact-section{grid-column:1/-1' in html.replace('\n',''), 'compact sections must span the profile width'
assert 'background:rgba(13,56,57,.88)' in html, 'profile cards must use the homepage panel color'

assert 'function setupProfileSectionToggles()' in js, 'collapse setup function missing'
assert "button.setAttribute('aria-expanded'" in js, 'toggle must update accessibility state'
assert 'setupProfileSectionToggles();' in js, 'collapse setup must run'

startup = re.search(r'await Promise\.all\(\[(.*?)\]\);', js, re.S)
assert startup, 'startup Promise.all not found'
assert 'loadRatingHistory' not in startup.group(1), 'rating history must not load after chart removal'

print('profile compact collapsible sections: PASS')
