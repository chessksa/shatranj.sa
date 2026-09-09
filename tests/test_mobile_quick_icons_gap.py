from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_mobile_quick_icons_gap_is_two_pixels_both_axes():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    expected = """@media(max-width:520px){
  .quick-icons{
    grid-template-columns:repeat(4,1fr);
    gap:2px;
  }"""
    assert expected in html


if __name__ == "__main__":
    test_mobile_quick_icons_gap_is_two_pixels_both_axes()
    print("mobile quick icons gap: PASS")
