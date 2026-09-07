from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "play-v10.html").read_text(encoding="utf-8")

assert ".grace-end-action>.action-icon{display:none}" in HTML, "End grace control must hide the old X icon"
assert ".grace-end-action>.grace-note{display:none}" in HTML, "End grace control must hide the explanatory note"
assert ".grace-end-action:not(.move-review-mode){flex-direction:row" in HTML, "End and countdown must sit together without extra content"
assert ".move-review-inline{width:auto" in HTML, "Move review controls must use only their compact icon area"
assert "grid-template-columns:32px 32px" in HTML, "Move review mode must contain exactly two compact arrow slots"
assert ".move-review-label{display:none}" in HTML, "Move review text label must be visually removed"
assert "data-review-direction=\"-1\"" not in HTML, "Review arrows remain JS-generated rather than duplicated in page markup"

print("compact End/review controls: PASS")
