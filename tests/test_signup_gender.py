from pathlib import Path

html = Path('index.html').read_text(encoding='utf-8')
sw = Path('sw.js').read_text(encoding='utf-8')

assert 'id="signupGender"' in html, 'signup gender select is missing'
assert '<option value="male">ذكر</option>' in html, 'male option is missing'
assert '<option value="female">أنثى</option>' in html, 'female option is missing'
assert "if(!$('#signupGender').value)" in html, 'gender is not required before signup'
assert "gender:$('#signupGender').value" in html, 'gender is not included in signup profile metadata'
assert 'shatranj-saudi-v3' in sw, 'service worker cache must be bumped so the new signup form reaches existing clients'

print('signup gender requirements present')
