from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

ARAB_COUNTRIES = [
    "السعودية", "الإمارات", "الكويت", "البحرين", "قطر", "عُمان",
    "اليمن", "العراق", "الأردن", "فلسطين", "لبنان", "سوريا",
    "مصر", "السودان", "ليبيا", "تونس", "الجزائر", "المغرب",
    "موريتانيا", "الصومال", "جيبوتي", "جزر القمر",
]

SAUDI_REGIONS = [
    "الرياض", "مكة المكرمة", "المدينة المنورة", "القصيم", "المنطقة الشرقية",
    "عسير", "تبوك", "حائل", "الحدود الشمالية", "جازان", "نجران", "الباحة", "الجوف",
]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def write(path, text):
    (ROOT / path).write_text(text, encoding="utf-8")


def require_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f"missing expected text for {label}")
    return text.replace(old, new)


def require_sub(text, pattern, repl, label, count=1):
    updated, n = re.subn(pattern, repl, text, count=count, flags=re.S)
    if n != count:
        raise SystemExit(f"expected {count} replacement(s) for {label}, got {n}")
    return updated


def country_options(indent="          "):
    lines = [f'{indent}<option value="">كل الدول العربية</option>']
    lines += [f'{indent}<option value="{country}">{country}</option>' for country in ARAB_COUNTRIES]
    return "\n".join(lines)


def signup_country_options(indent="              "):
    lines = [f'{indent}<option value="">اختر الدولة</option>']
    lines += [f'{indent}<option value="{country}">{country}</option>' for country in ARAB_COUNTRIES]
    return "\n".join(lines)


def update_index():
    path = "index.html"
    text = read(path)

    text = text.replace("شطرنج السعودية", "شطرنج العرب")
    text = require_replace(text, "المنصة السعودية للشطرنج", "المنصة العربية للشطرنج", "hero kicker")
    text = require_replace(text, "مجتمع سعودي لعشاق الشطرنج", "مجتمع عربي لعشاق الشطرنج", "hero copy")
    text = text.replace("ترتيب اللاعبين على مستوى السعودية", "ترتيب اللاعبين على مستوى العالم العربي")

    region_filter = '<select id="regionFilter">\n' + country_options() + '\n        </select>'
    text = require_sub(
        text,
        r'<select id="regionFilter">.*?</select>',
        region_filter,
        "ranking country filter",
    )

    text = require_sub(
        text,
        r'<select id="cityFilter">\s*<option value="">كل المدن</option>\s*</select>',
        '<input id="cityFilter" type="search" maxlength="80" placeholder="كل المدن" aria-label="فلترة حسب المدينة">',
        "ranking city input",
    )

    signup_region = '<select id="signupRegion" required>\n' + signup_country_options() + '\n            </select>'
    text = require_sub(
        text,
        r'<select id="signupRegion" required>.*?</select>',
        signup_region,
        "signup country select",
    )

    text = require_sub(
        text,
        r'<select id="signupCity" required disabled>.*?</select>',
        '<input id="signupCity" required maxlength="80" autocomplete="address-level2" placeholder="اكتب المدينة">',
        "signup city input",
    )

    text = require_replace(text, "<span>المنطقة</span>", "<span>الدولة</span>", "signup country label")
    text = require_replace(text, "<small>المنطقة</small>", "<small>الدولة</small>", "account country label")
    text = require_replace(text, "<th>المنطقة</th>", "<th>الدولة</th>", "ranking country heading")

    text = require_replace(
        text,
        '<input id="signupMobile" required maxlength="13" inputmode="tel" placeholder="05xxxxxxxx" autocomplete="tel">',
        '<input id="signupMobile" required maxlength="18" inputmode="tel" placeholder="مثال: +9665xxxxxxxx" autocomplete="tel">',
        "international mobile input",
    )
    text = require_replace(text, "<span>رقم الجوال</span>", "<span>رقم الجوال (مع مفتاح الدولة)</span>", "mobile label")

    saudi_regions_js = ",".join(repr(x) for x in SAUDI_REGIONS)
    text = require_sub(
        text,
        r'const CITIES=\{.*?\n\};\n\nconst CATEGORY=\{',
        f"const SAUDI_REGIONS=new Set([{saudi_regions_js}]);\n\nconst CATEGORY={{",
        "replace Saudi city map",
    )

    text = require_sub(
        text,
        r'function fillCities\(selectElement,cities,firstOption\)\{.*?\n\}\n\nfunction allCities\(\)\{.*?\n\}\n\n',
        "",
        "remove static city helpers",
    )

    mobile_fn = r'''function normalizeInternationalMobile(value){
  const raw=String(value||'').trim();
  const compact=raw.replace(/[\s()\-]/g,'');

  if(/^05\d{8}$/.test(compact)){
    const e164='+966'+compact.slice(1);
    return {local:e164,e164};
  }

  if(/^00\d{8,15}$/.test(compact)){
    const e164='+'+compact.slice(2);
    return {local:e164,e164};
  }

  if(/^\+\d{8,15}$/.test(compact)){
    return {local:compact,e164:compact};
  }

  return null;
}

function countryForRegion(value){
  const region=String(value||'').trim();
  return SAUDI_REGIONS.has(region)?'السعودية':region;
}'''
    text = require_sub(
        text,
        r'function normalizeSaudiMobile\(value\)\{.*?\n\}',
        mobile_fn,
        "international mobile normalizer",
    )

    text = require_sub(
        text,
        r'/\* مدن إنشاء الحساب \*/.*?\$\(\'#cityFilter\'\)\.addEventListener\(\'change\',applyFilter\);',
        "/* الدولة والمدينة */\n$('#regionFilter').addEventListener('change',applyFilter);\n$('#cityFilter').addEventListener('input',applyFilter);",
        "country/city event handlers",
    )

    new_title_fn = '''function updateRankingTitle(country,city){
  const title=$('#rankingTitle');
  if(!title) return;

  if(city){
    title.textContent=`ترتيب اللاعبين في مدينة ${city}`;
    return;
  }

  if(country){
    title.textContent=`ترتيب اللاعبين في ${country}`;
    return;
  }

  title.textContent='ترتيب اللاعبين على مستوى العالم العربي';
}'''
    text = require_sub(
        text,
        r'function updateRankingTitle\(region,city\)\{.*?\n\}',
        new_title_fn,
        "ranking title logic",
    )

    new_filter_fn = '''function applyFilter(){
  const country=$('#regionFilter').value.trim();
  const city=$('#cityFilter').value.trim();

  updateRankingTitle(country,city);

  renderPlayers(
    ALL_PLAYERS.filter(player=>{
      const playerCountry=countryForRegion(player.region);
      const playerCity=(player.city||'').trim();

      return (
        (!country || playerCountry===country) &&
        (!city || playerCity.includes(city))
      );
    })
  );
}'''
    text = require_sub(
        text,
        r'function applyFilter\(\)\{.*?\n\}',
        new_filter_fn,
        "country/city filtering",
    )

    text = require_replace(
        text,
        '<td>${escapeHTML(player.region)}</td>',
        '<td>${escapeHTML(countryForRegion(player.region))}</td>',
        "ranking country display",
    )

    text = require_replace(text, "region:metadata.region||'الرياض'", "region:metadata.region||'السعودية'", "profile fallback country")
    text = require_replace(text, "const mobile=normalizeSaudiMobile($('#signupMobile').value);", "const mobile=normalizeInternationalMobile($('#signupMobile').value);", "signup mobile normalizer")
    text = require_replace(text, "رقم الجوال يجب أن يكون بصيغة 05xxxxxxxx.", "أدخل رقم الجوال مع مفتاح الدولة، مثال +9665xxxxxxxx.", "mobile validation message")
    text = require_replace(text, "return setAuthMsg('اختر المنطقة.','err');", "return setAuthMsg('اختر الدولة.','err');", "country validation message")

    text = require_replace(
        text,
        "const accountRegionValue=String(currentProfile.region||'—').trim()||'—';",
        "const accountRegionValue=countryForRegion(currentProfile.region)||'—';",
        "account country display",
    )

    write(path, text)


def update_brand_pages():
    for path in [
        "profile.html", "profile-section.html", "player.html", "play-v10.html",
        "play.html", "watch.html", "manifest.webmanifest", "README.md",
    ]:
        text = read(path)
        text = text.replace("شطرنج السعودية", "شطرنج العرب")
        write(path, text)


update_index()
update_brand_pages()
print("Applied Shatranj Al-Arab identity and country-based registration")
