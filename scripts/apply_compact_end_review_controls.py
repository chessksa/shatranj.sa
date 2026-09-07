from pathlib import Path

path = Path("play-v10.html")
text = path.read_text(encoding="utf-8")
old = ".grace-end-action:not(:disabled){background:rgba(255,132,28,.07)}.grace-end-action:not(:disabled) .action-icon,.grace-end-action:not(:disabled) .grace-countdown{color:#ff8a24}.grace-countdown{min-width:31px;padding:2px 7px;border:1px solid rgba(255,138,36,.65);border-radius:999px;color:#ff8a24;font-size:12px;font-weight:900;line-height:1.25}.grace-note{color:var(--muted);font-size:9px;line-height:1.25;white-space:nowrap}.grace-end-action:disabled .grace-countdown,.grace-end-action:disabled .grace-note{opacity:.62}.grace-end-action.move-review-mode{opacity:1!important;cursor:pointer!important;padding:7px 8px}.move-review-inline{width:100%;display:grid;grid-template-columns:32px minmax(0,1fr) 32px;align-items:center;gap:5px;direction:ltr}.move-review-arrow{display:grid;place-items:center;min-height:32px;border:1px solid rgba(224,181,103,.35);border-radius:8px;color:var(--gold);font-size:24px;font-weight:900;line-height:1;user-select:none}.move-review-arrow.disabled{opacity:.25}.move-review-label{direction:rtl;color:var(--text);font-size:11px;font-weight:800;white-space:nowrap}"
new = ".grace-end-action:not(:disabled){background:rgba(255,132,28,.07)}.grace-end-action:not(:disabled) .grace-countdown{color:#ff8a24}.grace-end-action>.action-icon{display:none}.grace-end-action>.grace-note{display:none}.grace-end-action:not(.move-review-mode){flex-direction:row;gap:7px}.grace-countdown{min-width:31px;padding:2px 7px;border:1px solid rgba(255,138,36,.65);border-radius:999px;color:#ff8a24;font-size:12px;font-weight:900;line-height:1.25}.grace-note{color:var(--muted);font-size:9px;line-height:1.25;white-space:nowrap}.grace-end-action:disabled .grace-countdown{opacity:.62}.grace-end-action.move-review-mode{opacity:1!important;cursor:pointer!important;padding:7px 8px}.move-review-inline{width:auto;display:grid;grid-template-columns:32px 32px;align-items:center;justify-content:center;gap:6px;direction:ltr}.move-review-arrow{display:grid;place-items:center;min-height:32px;border:1px solid rgba(224,181,103,.35);border-radius:8px;color:var(--gold);font-size:24px;font-weight:900;line-height:1;user-select:none}.move-review-arrow.disabled{opacity:.25}.move-review-label{display:none}"

if new in text:
    print("compact End/review CSS already applied")
elif old in text:
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    print("compact End/review CSS applied")
else:
    raise SystemExit("expected End/review CSS block was not found")
