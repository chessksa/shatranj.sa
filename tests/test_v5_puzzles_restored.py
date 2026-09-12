from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_puzzles_are_back_in_primary_navigation():
    nav = read("v2/site/nav.mjs")
    shell = read("v2/site/shell.mjs")

    assert "id:'puzzles',label:'الألغاز'" in nav
    assert "'puzzles.html':'puzzles'" in shell
    assert "const coreIds = ['home','play','puzzles','profile'];" in shell


def test_puzzle_page_has_a_real_puzzle_pack_and_daily_fallback():
    migration = ROOT / "supabase/migrations/20260913_puzzle_pack.sql"
    assert migration.exists()

    sql = migration.read_text(encoding="utf-8").lower()
    assert "insert into public.v2_puzzles" in sql
    assert sql.count("where not exists") >= 12
    assert "create or replace function public.v3_start_puzzle_session" in sql
    assert "on conflict (daily_date) do nothing" in sql
