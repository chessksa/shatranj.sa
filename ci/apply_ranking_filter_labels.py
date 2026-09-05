from pathlib import Path

index_path = Path("index.html")
html = index_path.read_text(encoding="utf-8")
html = html.replace('<option value="">كل الدول العربية</option>', '<option value="">الدولة</option>', 1)
html = html.replace("first.textContent=country?'كل مدن الدولة':'اختر الدولة أولًا';", "first.textContent=country?'المدينة':'اختر الدولة أولًا';", 1)
index_path.write_text(html, encoding="utf-8")

css_path = Path("home-theme.css")
css = css_path.read_text(encoding="utf-8")
old = """#ranking .ranking-filters select{\n  height:32px!important;\n  min-width:0;\n  padding:0 7px!important;\n  border-radius:9px!important;\n  font-size:10px!important;"""
new = """#ranking .ranking-filters select{\n  height:32px!important;\n  min-width:0;\n  padding:0 7px!important;\n  border-radius:9px!important;\n  font-size:12px!important;"""
assert old in css, "Final ranking filter style block not found"
css = css.replace(old, new, 1)
css_path.write_text(css, encoding="utf-8")
