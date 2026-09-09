from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "index.html"
text = path.read_text(encoding="utf-8")
old = """@media(max-width:520px){
  .quick-icons{
    grid-template-columns:repeat(4,1fr);
    gap:4px;
  }"""
new = """@media(max-width:520px){
  .quick-icons{
    grid-template-columns:repeat(4,1fr);
    gap:2px;
  }"""
if new in text:
    print("mobile quick icon gap already 2px")
elif old in text:
    text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8")
    print("mobile quick icon horizontal and vertical gap set to 2px")
else:
    raise SystemExit("expected mobile quick-icons block not found")
