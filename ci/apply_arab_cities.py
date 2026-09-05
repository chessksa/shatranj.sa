from pathlib import Path

path = Path("index.html")
text = path.read_text(encoding="utf-8")

replacements = [
    (
        '<input id="cityFilter" type="search" maxlength="80" placeholder="كل المدن" aria-label="فلترة حسب المدينة">',
        '<input id="cityFilter" type="search" maxlength="80" list="cityFilterOptions" placeholder="كل المدن" aria-label="فلترة حسب المدينة">\n        <datalist id="cityFilterOptions"></datalist>',
    ),
    (
        '<input id="signupCity" required maxlength="80" autocomplete="address-level2" placeholder="اكتب المدينة">',
        '<input id="signupCity" required maxlength="80" list="signupCityOptions" autocomplete="address-level2" placeholder="اختر أو اكتب المدينة">\n            <datalist id="signupCityOptions"></datalist>',
    ),
    (
        "import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';",
        "import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';\nimport { ARAB_CITIES_DATA } from './arab-cities.js';",
    ),
    (
        "const SAUDI_REGIONS=new Set(['الرياض','مكة المكرمة','المدينة المنورة','القصيم','المنطقة الشرقية','عسير','تبوك','حائل','الحدود الشمالية','جازان','نجران','الباحة','الجوف']);",
        "const SAUDI_REGIONS=new Set(['الرياض','مكة المكرمة','المدينة المنورة','القصيم','المنطقة الشرقية','عسير','تبوك','حائل','الحدود الشمالية','جازان','نجران','الباحة','الجوف']);\nconst ARAB_CITIES=ARAB_CITIES_DATA;",
    ),
    (
        "/* الدولة والمدينة */\n$('#regionFilter').addEventListener('change',applyFilter);\n$('#cityFilter').addEventListener('input',applyFilter);",
        """/* الدولة والمدينة */
function populateCityList(country,listSelector,inputSelector,allWhenEmpty=false,clearInput=true){
  const list=$(listSelector);
  const input=$(inputSelector);
  const cities=country
    ? (ARAB_CITIES[country]||[])
    : (allWhenEmpty?[...new Set(Object.values(ARAB_CITIES).flat())]:[]);

  list.replaceChildren(...cities.map(city=>{
    const option=document.createElement('option');
    option.value=city;
    return option;
  }));

  if(clearInput) input.value='';
}

$('#regionFilter').addEventListener('change',()=>{
  populateCityList($('#regionFilter').value,'#cityFilterOptions','#cityFilter',true,true);
  applyFilter();
});
$('#cityFilter').addEventListener('input',applyFilter);
populateCityList('','#cityFilterOptions','#cityFilter',true,false);""",
    ),
    (
        "/* إنشاء الحساب */\n$('#signupForm').addEventListener('submit',async event=>{",
        """/* إنشاء الحساب */
$('#signupRegion').addEventListener('change',()=>{
  populateCityList($('#signupRegion').value,'#signupCityOptions','#signupCity',false,true);
});

$('#signupForm').addEventListener('submit',async event=>{""",
    ),
    (
        "      $('#signupCity').value='';",
        "      populateCityList('','#signupCityOptions','#signupCity',false,true);",
    ),
]

for old, new in replacements:
    if old not in text:
        raise SystemExit(f"Required pattern not found:\n{old[:180]}")
    text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")
print("Applied Arab city catalog integration to index.html")
