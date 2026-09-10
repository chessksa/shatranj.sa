from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "tournaments.html").read_text(encoding="utf-8")


def test_already_registered_feedback_stays_in_registration_button():
    assert "button.textContent=alreadyRegistered?'أنت مسجل بالفعل':'تم التسجيل'" in HTML
    assert "setRegistrationMessage(result.code==='already_registered'?" not in HTML
