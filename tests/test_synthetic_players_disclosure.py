from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
index = (ROOT / "index.html").read_text(encoding="utf-8")
player_js = (ROOT / "player.js").read_text(encoding="utf-8")
migration_path = ROOT / "supabase" / "migrations" / "20260905_synthetic_players.sql"

assert migration_path.exists(), "synthetic players migration is missing"
sql = migration_path.read_text(encoding="utf-8")

assert "is_synthetic" in sql, "database must mark synthetic players internally"
assert "*/30 * * * *" in sql, "synthetic member schedule must run every 30 minutes"
assert "cron.schedule" in sql, "pg_cron schedule is missing"
assert "private.add_synthetic_player" in sql, "synthetic player generator is missing"
assert "22" in sql, "country rotation must cover the 22 Arab countries"

assert "500 + ALL_PLAYERS.length" not in index, "subscriber count must not contain a fixed artificial boost"
assert "is_synthetic" in index, "home page must receive the synthetic marker"
compact = "".join(index.split())
assert "ALL_PLAYERS.filter(player=>!player.is_synthetic).length" in compact, "subscriber count must exclude synthetic players"

start = index.index("function renderPlayers(players)")
end = index.find("\nfunction ", start + 10)
ranking_renderer = index[start:end if end != -1 else len(index)]
assert "is_synthetic" not in ranking_renderer, "ranking must not display a synthetic/test badge"
assert "تجريبي" not in ranking_renderer, "ranking must not label test players"

assert "profile.is_synthetic" in player_js, "public player page must inspect synthetic status"
assert "تجريبي" in player_js, "public player page must disclose a synthetic account"

print("synthetic players disclosure contract: OK")
