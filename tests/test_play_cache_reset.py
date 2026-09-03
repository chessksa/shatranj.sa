from pathlib import Path
sw=Path("sw.js").read_text(encoding="utf-8")
html=Path("play.html").read_text(encoding="utf-8")
assert "PLAY_CACHE_RESET_VERSION" in html
assert "getRegistrations" in html and "caches.keys" in html
assert "activate" in sw and "caches.delete" in sw
assert "play-live.js" in sw and "realistic-pieces.css" in sw and "/assets/pieces/" in sw
assert "no-store" in sw
print("play cache reset: PASS")
