from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POLISH = (ROOT / "site-presence.js").read_text(encoding="utf-8")


def test_already_registered_feedback_stays_in_registration_button_without_shifting_layout():
    assert "#registrationMsg.ok{display:none!important}" in POLISH
    assert "button?.textContent?.trim() === 'مسجل'" in POLISH
    assert "button.textContent = 'أنت مسجل بالفعل'" in POLISH
