from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
old = "/* تهيئة */\nfillCities($('#cityFilter'),allCities(),'كل المدن');\n\n"
if old not in text:
    raise SystemExit('legacy city initializer not found')
path.write_text(text.replace(old, "/* تهيئة */\n", 1), encoding='utf-8')
print('Removed legacy Saudi city initializer')
