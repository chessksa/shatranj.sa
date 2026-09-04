from pathlib import Path

SAUDI_REGIONS = [
    "الرياض", "مكة المكرمة", "المدينة المنورة", "القصيم", "المنطقة الشرقية",
    "عسير", "تبوك", "حائل", "الحدود الشمالية", "جازان", "نجران", "الباحة", "الجوف",
]


def replace_once(path, old, new):
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"missing expected text in {path}: {old[:80]}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


regions = ",".join(repr(x) for x in SAUDI_REGIONS)
helper = f"  const SAUDI_REGIONS = new Set([{regions}]);\n  const countryForRegion = (value) => {{\n    const region = String(value || '').trim();\n    return SAUDI_REGIONS.has(region) ? 'السعودية' : region;\n  }};\n"

replace_once(
    "profile.js",
    "  const $ = (id) => document.getElementById(id);\n",
    "  const $ = (id) => document.getElementById(id);\n" + helper,
)
replace_once(
    "profile.js",
    "    $('playerMeta').textContent = [username, row.city, row.region].filter(Boolean).join(' • ');",
    "    $('playerMeta').textContent = [username, row.city, countryForRegion(row.region)].filter(Boolean).join(' • ');",
)

replace_once(
    "player.js",
    "  const $ = (id) => document.getElementById(id);\n",
    "  const $ = (id) => document.getElementById(id);\n" + helper,
)
replace_once(
    "player.js",
    "      $('publicMeta').textContent=[profile.username?`@${profile.username}`:'',profile.city,profile.region].filter(Boolean).join(' • ');",
    "      $('publicMeta').textContent=[profile.username?`@${profile.username}`:'',profile.city,countryForRegion(profile.region)].filter(Boolean).join(' • ');",
)

replace_once(
    "profile-section.js",
    "  document.title = `${currentSection.title} | شطرنج السعودية`;",
    "  document.title = `${currentSection.title} | شطرنج العرب`;",
)

print("Applied Arab country display to player profile scripts")
