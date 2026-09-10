from pathlib import Path

path=Path('index-app.html')
text=path.read_text(encoding='utf-8')

import_anchor="import { ARAB_CITIES_DATA } from './arab-cities.js';"
world_import="import { WORLD_COUNTRIES, getCitiesForCountry } from './world-locations.js';"
if world_import not in text:
    if import_anchor not in text:
        raise SystemExit('arab cities import anchor not found')
    text=text.replace(import_anchor,import_anchor+'\n'+world_import,1)

city_anchor='/* الدولة والمدينة */'
world_helpers=r'''/* التسجيل العالمي: الدول ثابتة داخل الموقع والمدن تُحمّل حسب الدولة */
function populateSignupCountries(){
  const select=$('#signupRegion');
  if(!select) return;

  const placeholder=document.createElement('option');
  placeholder.value='';
  placeholder.textContent='اختر الدولة';

  const options=WORLD_COUNTRIES.map(country=>{
    const option=document.createElement('option');
    option.value=country.nameAr;
    option.textContent=country.nameAr;
    option.dataset.iso2=country.iso2;
    return option;
  });

  select.replaceChildren(placeholder,...options);
  select.value='';
}

async function populateSignupCities(clearInput=true){
  const select=$('#signupRegion');
  const list=$('#signupCityOptions');
  const input=$('#signupCity');
  if(!select||!list||!input) return;

  const selected=select.selectedOptions?.[0];
  const iso2=selected?.dataset?.iso2||'';
  if(clearInput) input.value='';
  list.replaceChildren();

  if(!iso2){
    input.placeholder='اختر الدولة أولًا ثم اختر أو اكتب المدينة';
    return;
  }

  input.placeholder='جاري تحميل المدن... ويمكنك كتابة المدينة';
  const cities=await getCitiesForCountry(iso2);

  if((select.selectedOptions?.[0]?.dataset?.iso2||'')!==iso2) return;

  list.replaceChildren(...cities.map(city=>{
    const option=document.createElement('option');
    option.value=city;
    return option;
  }));

  input.placeholder=cities.length
    ? 'اختر المدينة من القائمة أو اكتب المدينة'
    : 'اكتب المدينة';
}

populateSignupCountries();
'''

if 'function populateSignupCountries(){' not in text:
    if city_anchor not in text:
        raise SystemExit('country/city anchor not found')
    text=text.replace(city_anchor,city_anchor+'\n'+world_helpers,1)

old_listener="""$('#signupRegion').addEventListener('change',()=>{\n  populateCityList($('#signupRegion').value,'#signupCityOptions','#signupCity',false,true);\n});"""
new_listener="""$('#signupRegion').addEventListener('change',async()=>{\n  await populateSignupCities(true);\n});"""
if old_listener in text:
    text=text.replace(old_listener,new_listener,1)
elif new_listener not in text:
    raise SystemExit('signup country listener anchor not found')

old_reset="populateCityList('','#signupCityOptions','#signupCity',false,true);"
new_reset="populateSignupCities(true);"
if old_reset in text:
    text=text.replace(old_reset,new_reset,1)

path.write_text(text,encoding='utf-8')
print('world signup applied')
