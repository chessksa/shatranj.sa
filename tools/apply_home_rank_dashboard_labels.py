from pathlib import Path
import re


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing expected {label}')
    return text.replace(old, new, 1)


index_path = Path('index.html')
index = index_path.read_text(encoding='utf-8')

if 'id="accountRankBadge"' not in index:
    old_identity = '''            <strong id="accountWelcome">مرحبًا</strong>

          </div>'''
    new_identity = '''            <div class="account-identity-text">
              <strong id="accountWelcome">مرحبًا</strong>
              <span class="account-rank-badge" id="accountRankBadge" data-rank="beginner">
                <span class="account-rank-icon" id="accountRankIcon" aria-hidden="true">♟</span>
                <span id="accountRankLabel">مبتدئ</span>
              </span>
            </div>

          </div>'''
    index = replace_once(index, old_identity, new_identity, 'homepage member identity')

if 'function rankForRating(rating)' not in index:
    account_initial = '''function accountInitial(name){
  return (String(name||'ل').trim().charAt(0)||'ل').toUpperCase();
}
'''
    rank_logic = '''function accountInitial(name){
  return (String(name||'ل').trim().charAt(0)||'ل').toUpperCase();
}

function rankForRating(rating){
  const points=Number(rating)||0;
  if(points>=3000) return {key:'champion',label:'بطل',icon:'🏆'};
  if(points>=2700) return {key:'elite',label:'نخبة',icon:'♚'};
  if(points>=2400) return {key:'professional',label:'محترف',icon:'♛'};
  if(points>=2100) return {key:'advanced',label:'متقدم',icon:'♜'};
  if(points>=1800) return {key:'competitor',label:'منافس',icon:'♞'};
  return {key:'beginner',label:'مبتدئ',icon:'♟'};
}

function renderAccountRank(rating){
  const badge=$('#accountRankBadge');
  if(!badge) return;
  const rank=rankForRating(rating);
  badge.dataset.rank=rank.key;
  $('#accountRankLabel').textContent=rank.label;
  $('#accountRankIcon').textContent=rank.icon;
}
'''
    index = replace_once(index, account_initial, rank_logic, 'account rank logic anchor')

if 'renderAccountRank(currentProfile.rating)' not in index:
    index = replace_once(
        index,
        "    $('#accountWelcome').textContent='مرحبًا، '+currentProfile.name;\n",
        "    $('#accountWelcome').textContent='مرحبًا، '+currentProfile.name;\n    renderAccountRank(currentProfile.rating);\n",
        'homepage account render rank call',
    )

index = re.sub(r'home-theme\.css\?v=[^"<]+', 'home-theme.css?v=20260903-12', index, count=1)
index_path.write_text(index, encoding='utf-8')


css_path = Path('home-theme.css')
css = css_path.read_text(encoding='utf-8')
if '.account-rank-badge{' not in css:
    css += '''

/* Homepage member rank 20260903 */
.account-identity-text{
  min-width:0;
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  gap:5px;
}
.account-identity-text #accountWelcome{
  margin:0;
  text-align:right;
}
.account-rank-badge{
  display:inline-flex;
  align-items:center;
  gap:5px;
  width:max-content;
  max-width:100%;
  padding:4px 8px;
  border:1px solid rgba(212,180,103,.38);
  border-radius:999px;
  background:rgba(212,180,103,.08);
  color:var(--gold);
  font-size:12px;
  font-weight:900;
  line-height:1;
  white-space:nowrap;
}
.account-rank-icon{
  font-size:15px;
  line-height:1;
}
.account-rank-badge[data-rank="champion"]{
  box-shadow:0 0 16px rgba(212,180,103,.15);
}
'''
css_path.write_text(css, encoding='utf-8')


profile_path = Path('profile.html')
profile = profile_path.read_text(encoding='utf-8')
profile = profile.replace(
    '.dashboard-icon-label{max-width:100%;font-size:10.5px;line-height:1.25;',
    '.dashboard-icon-label{max-width:100%;font-size:13px;line-height:1.25;',
)
profile = profile.replace(
    '.dashboard-icon-label{font-size:10px}',
    '.dashboard-icon-label{font-size:12px}',
)
if '.dashboard-icon-label{max-width:100%;font-size:13px;' not in profile:
    raise SystemExit('failed to enlarge desktop dashboard labels')
if '.dashboard-icon-label{font-size:12px}' not in profile:
    raise SystemExit('failed to enlarge mobile dashboard labels')
profile_path.write_text(profile, encoding='utf-8')

print('homepage member rank and dashboard label sizes applied')
