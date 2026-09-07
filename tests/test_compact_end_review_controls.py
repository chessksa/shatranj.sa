from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "play-v10.html").read_text(encoding="utf-8")
CSS = (ROOT / "exact-board-v13.css").read_text(encoding="utf-8")

assert ".grace-end-action>.action-icon{display:none}" in HTML, "End grace control must hide the old X icon"
assert ".grace-end-action>.grace-note{display:none}" in HTML, "End grace control must hide the explanatory note"
assert ".grace-end-action:not(.move-review-mode){flex-direction:row" in HTML, "End and countdown base control must remain available for the override"
assert ".move-review-inline{width:auto" in HTML, "Move review controls must use only their compact icon area"
assert "grid-template-columns:32px 32px" in HTML, "Base move review slots must remain present"
assert ".move-review-label{display:none}" in HTML, "Move review text label must be visually removed"
assert "data-review-direction=\"-1\"" not in HTML, "Review arrows remain JS-generated rather than duplicated in page markup"

assert ".grace-end-action:not(.move-review-mode) .grace-countdown" in CSS, "Countdown override must target the active grace control"
assert "font-size:22px!important" in CSS, "Grace countdown number must be larger"
assert "color:#ffb45a!important" in CSS, "Grace countdown must use a light orange while counting"
assert "grid-template-columns:54px 54px!important" in CSS, "Review arrows must use larger slots"
assert "direction:rtl!important" in CSS, "Back control must be on the right and forward on the left"
assert "min-height:54px!important" in CSS, "Review arrow buttons must be taller"
assert "font-size:42px!important" in CSS, "Review arrow glyphs must be larger"
assert "exact-board-v13.css?v=20260907-3" in HTML, "Board control stylesheet cache version must be bumped"

print("compact End/review controls: PASS")
