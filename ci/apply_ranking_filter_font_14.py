from pathlib import Path

path = Path("home-theme.css")
css = path.read_text(encoding="utf-8")
old = """#ranking .ranking-filters select{\n  height:32px!important;\n  min-width:0;\n  padding:0 7px!important;\n  border-radius:9px!important;\n  font-size:12px!important;"""
new = """#ranking .ranking-filters select{\n  height:32px!important;\n  min-width:0;\n  padding:0 7px!important;\n  border-radius:9px!important;\n  font-size:14px!important;"""
assert old in css, "Final ranking filter style block not found"
path.write_text(css.replace(old, new, 1), encoding="utf-8")
