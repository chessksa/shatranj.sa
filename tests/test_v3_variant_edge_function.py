from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'supabase/functions/variant-game-v3/index.ts'


def test_variant_edge_function_is_server_authoritative():
    text=SRC.read_text(encoding='utf-8')
    assert "npm:cm-chess@4.0.0" in text
    assert "GAME_VARIANT.chess960" in text
    assert "v3_queue_variant_server" in text
    assert "v3_commit_variant_move_server" in text
    assert "expectedPly" in text
    assert "Authentication required" in text


def test_chess960_generator_constraints_are_explicit():
    text=SRC.read_text(encoding='utf-8')
    assert "generateChess960" in text
    assert "opposite-colored bishops" in text
    assert "king between rooks" in text
