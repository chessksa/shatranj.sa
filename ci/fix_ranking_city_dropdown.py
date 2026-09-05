from pathlib import Path

path = Path("index.html")
text = path.read_text(encoding="utf-8")

old_html = '''        <input id="cityFilter" type="search" maxlength="80" list="cityFilterOptions" placeholder="كل المدن" aria-label="فلترة حسب المدينة">
        <datalist id="cityFilterOptions"></datalist>'''
new_html = '''        <select id="cityFilter" disabled aria-label="فلترة حسب المدينة">
          <option value="">اختر الدولة أولًا</option>
        </select>'''
assert old_html in text, "ranking city input markup not found"
text = text.replace(old_html, new_html, 1)

old_js = '''$('#regionFilter').addEventListener('change',()=>{
  populateCityList($('#regionFilter').value,'#cityFilterOptions','#cityFilter',true,true);
  applyFilter();
});
$('#cityFilter').addEventListener('input',applyFilter);
populateCityList('','#cityFilterOptions','#cityFilter',true,false);'''
new_js = '''function populateRankingCitySelect(country){
  const cityFilter=$('#cityFilter');
  const cities=ARAB_CITIES[country]||[];
  const first=document.createElement('option');
  first.value='';
  first.textContent=country?'كل مدن الدولة':'اختر الدولة أولًا';

  cityFilter.replaceChildren(
    first,
    ...cities.map(city=>{
      const option=document.createElement('option');
      option.value=city;
      option.textContent=city;
      return option;
    })
  );
  cityFilter.disabled=!country;
  cityFilter.value='';
}

$('#regionFilter').addEventListener('change',()=>{
  const country=$('#regionFilter').value;
  populateRankingCitySelect(country);
  applyFilter();
});
$('#cityFilter').addEventListener('change',applyFilter);
populateRankingCitySelect('');'''
assert old_js in text, "ranking city filter JavaScript not found"
text = text.replace(old_js, new_js, 1)

path.write_text(text, encoding="utf-8")
