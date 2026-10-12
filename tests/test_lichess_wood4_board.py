"""Regression checks for the approved original Lichess Wood 4 board texture."""

from pathlib import Path
import hashlib

ROOT = Path(__file__).resolve().parents[1]
BOARD = ROOT / "assets" / "boards" / "wood4.jpg"
BLOB_SHA = "25ae7c98a2f31b9498d66ea3e29a9a1068f868dd"


def test_wood4_is_exact_original_asset():
    data = BOARD.read_bytes()
    assert data.startswith(bytes((0xFF, 0xD8, 0xFF))), "Wood 4 must remain a JPEG"
    raw = b"blob " + str(len(data)).encode() + bytes((0,)) + data
    assert hashlib.sha1(raw).hexdigest() == BLOB_SHA


def test_board_asset_source_and_license_present():
    source = (ROOT / "assets/boards/SOURCE.md").read_text(encoding="utf-8")
    license_text = (ROOT / "licenses/AGPL-3.0.txt").read_text(encoding="utf-8")
    assert "lichess-org/lila" in source
    assert "AGPL-3.0-or-later" in source
    assert "GNU AFFERO GENERAL PUBLIC LICENSE" in license_text


def test_home_and_play_use_one_locally_hosted_original_texture():
    paths = {
        "mobile-home-fixed-v1.css": "assets/boards/wood4.jpg",
        "v2/home/desktop-board-shell.css": "../../assets/boards/wood4.jpg",
        "v2/home/mobile-board-shell.css": "../../assets/boards/wood4.jpg",
        "v2/play/home-palette.css": "../../assets/boards/wood4.jpg",
        "cm-chessboard-shatranj-v3.css": "assets/boards/wood4.jpg",
        "settings-v2.html": "assets/boards/wood4.jpg",
    }
    for path, expected in paths.items():
        css = (ROOT / path).read_text(encoding="utf-8")
        assert expected in css, f"Wood 4 missing in {path}"


def test_approved_theme_squares_are_translucent():
    mobile = (ROOT / "mobile-home-fixed-v1.css").read_text(encoding="utf-8")
    desktop = (ROOT / "v2/home/desktop-board-shell.css").read_text(encoding="utf-8")
    game = (ROOT / "cm-chessboard-shatranj-v3.css").read_text(encoding="utf-8")
    assert ".mfw-square.light{background:transparent}" in mobile
    assert ".mfw-square.dark{background:transparent}" in mobile
    for css in (desktop, game):
        assert "rgba(255,247,224,.43)" in css
        assert "rgba(49,24,11,.36)" in css

    for path in ("play-computer.js", "play-v8.js"):
        engine = (ROOT / path).read_text(encoding="utf-8")
        assert "rgba(255,247,224,.43)" in engine
        assert "rgba(49,24,11,.36)" in engine
        assert "shatranj-approved-20260904.svg" in engine
