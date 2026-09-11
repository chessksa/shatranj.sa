from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_mobile_moderators_table_keeps_delete_action_visible():
    js = (ROOT / "admin-responsive-tables.js").read_text(encoding="utf-8")

    assert "moderatorsTableBody: { visible:[0,1,3,5] }" in js
    assert "tbody.id === 'moderatorsTableBody'" in js
    assert "button.textContent = 'حذف'" in js


def test_mobile_moderator_delete_action_is_visually_dangerous():
    js = (ROOT / "admin-responsive-tables.js").read_text(encoding="utf-8")

    assert '[data-action="removeModerator"]' in js
    assert "color:#ffaaaa!important" in js
