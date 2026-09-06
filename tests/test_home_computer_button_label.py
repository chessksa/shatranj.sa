from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'index.html').read_text(encoding='utf-8')

assert '<a class="btn light hero-computer-btn" href="play-v10.html?computer=1"><span>العب ضد الكمبيوتر</span></a>' in html
assert '<span>اللعب ضد الكمبيوتر</span>' not in html

print('home computer button label: PASS')
# Verifies the live main-branch label after the production change.
