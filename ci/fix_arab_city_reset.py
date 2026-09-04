from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
old = "      $('#signupCity').disabled=true;\n      fillCities($('#signupCity'),[],'اختر المنطقة أولًا');"
new = "      $('#signupCity').value='';"
if old not in text:
    raise SystemExit('expected legacy signup city reset not found')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
print('Fixed signup city reset for free-text Arab city field')
