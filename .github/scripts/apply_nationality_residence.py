from pathlib import Path
import re

path = Path('index-app.html')
text = path.read_text(encoding='utf-8')

# Keep nationality separate from worldwide country of residence.
residence_anchor = '''          <label>\n            <span>الدولة</span>\n            <select id="signupRegion" required>'''
residence_replacement = '''          <label>\n            <span>الجنسية</span>\n            <select id="signupNationality" required>\n              <option value="">اختر الجنسية</option>\n            </select>\n          </label>\n\n          <label>\n            <span>دولة الإقامة</span>\n            <select id="signupRegion" required>'''

if 'id="signupNationality"' not in text:
    if residence_anchor not in text:
        raise SystemExit('signup residence field anchor not found')
    text = text.replace(residence_anchor, residence_replacement, 1)
else:
    text = text.replace('<span>الدولة</span>\n            <select id="signupRegion"', '<span>دولة الإقامة</span>\n            <select id="signupRegion"', 1)

# Registration is worldwide: nationality uses the same 200+ country catalog as residence.
global_nationality_helpers = r'''function populateSignupNationalities(){
  const select=$('#signupNationality');
  if(!select) return;

  const placeholder=document.createElement('option');
  placeholder.value='';
  placeholder.textContent='اختر الجنسية';

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

'''

arab_block = re.compile(
    r"const ARAB_NATIONALITIES=\[[\s\S]*?\n\nfunction populateSignupNationalities\(\)\{[\s\S]*?\n\}\n\n(?=function populateSignupCountries\(\)\{)"
)
if arab_block.search(text):
    text = arab_block.sub(global_nationality_helpers, text, count=1)
elif 'function populateSignupNationalities(){' not in text:
    helper_anchor = 'function populateSignupCountries(){'
    if helper_anchor not in text:
        raise SystemExit('world country helper anchor not found')
    text = text.replace(helper_anchor, global_nationality_helpers + helper_anchor, 1)
elif 'WORLD_COUNTRIES.map' not in text[text.find('function populateSignupNationalities(){'):text.find('function populateSignupCountries(){')]:
    raise SystemExit('existing nationality helper is not worldwide')

call_anchor = 'populateSignupCountries();'
if 'populateSignupNationalities();' not in text:
    if call_anchor not in text:
        raise SystemExit('signup countries call anchor not found')
    text = text.replace(call_anchor, 'populateSignupNationalities();\n' + call_anchor, 1)

# Validate nationality and residence separately.
old_validation = """  if(!$('#signupRegion').value){\n    return setAuthMsg('اختر الدولة.','err');\n  }"""
new_validation = """  if(!$('#signupNationality').value){\n    return setAuthMsg('اختر الجنسية.','err');\n  }\n\n  if(!$('#signupRegion').value){\n    return setAuthMsg('اختر دولة الإقامة.','err');\n  }"""
if old_validation in text:
    text = text.replace(old_validation, new_validation, 1)
elif "if(!$('#signupNationality').value)" not in text:
    raise SystemExit('signup country validation anchor not found')

# Persist nationality in region and residence in country.
old_profile = """    region:$('#signupRegion').value,\n    city:$('#signupCity').value,"""
new_profile = """    region:$('#signupNationality').value,\n    country:$('#signupRegion').value,\n    city:$('#signupCity').value,"""
if old_profile in text:
    text = text.replace(old_profile, new_profile, 1)
elif "region:$('#signupNationality').value" not in text:
    raise SystemExit('signup profile region anchor not found')

old_rpc = """    p_region:profileData.region,\n    p_city:profileData.city,\n    p_category:profileData.category||'open'"""
new_rpc = """    p_region:profileData.region,\n    p_city:profileData.city,\n    p_category:profileData.category||'open',\n    p_residence_country:profileData.country"""
if old_rpc in text:
    text = text.replace(old_rpc, new_rpc, 1)
elif 'p_residence_country:profileData.country' not in text:
    raise SystemExit('claim profile RPC anchor not found')

old_fallback = """    region:metadata.region||'السعودية',\n    city:metadata.city||'الرياض',"""
new_fallback = """    region:metadata.region||'السعودية',\n    country:metadata.country||metadata.region||'السعودية',\n    city:metadata.city||'الرياض',"""
if old_fallback in text:
    text = text.replace(old_fallback, new_fallback, 1)
elif "country:metadata.country||metadata.region||'السعودية'" not in text:
    raise SystemExit('profile fallback anchor not found')

# One open global ranking pool. Country/nationality filter also uses the world catalog.
text = text.replace('ترتيب اللاعبين على مستوى العالم العربي', 'ترتيب اللاعبين عالميًا')
text = text.replace('<select id="regionFilter">\n          <option value="">الدولة</option>', '<select id="regionFilter">\n          <option value="">الجنسية</option>', 1)

ranking_helper = r'''function populateRankingCountries(){
  const select=$('#regionFilter');
  if(!select) return;

  const placeholder=document.createElement('option');
  placeholder.value='';
  placeholder.textContent='الجنسية';

  const options=WORLD_COUNTRIES.map(country=>{
    const option=document.createElement('option');
    option.value=country.nameAr;
    option.textContent=country.nameAr;
    return option;
  });

  select.replaceChildren(placeholder,...options);
  select.value='';
}

'''
ranking_anchor = 'function populateRankingCitySelect(country){'
if 'function populateRankingCountries(){' not in text:
    if ranking_anchor not in text:
        raise SystemExit('ranking country helper anchor not found')
    text = text.replace(ranking_anchor, ranking_helper + ranking_anchor, 1)

ranking_call = "populateRankingCitySelect('');"
if 'populateRankingCountries();' not in text:
    if ranking_call not in text:
        raise SystemExit('ranking initialization anchor not found')
    text = text.replace(ranking_call, "populateRankingCountries();\n" + ranking_call, 1)

path.write_text(text, encoding='utf-8')

# Remove the excluded country from the shared world catalog used by signup,
# residence, city lookup, and ranking filters.
world_path = Path('world-locations.js')
world_text = world_path.read_text(encoding='utf-8')
if "iso2:'IL'" in world_text:
    world_text = world_text.replace(" {iso2:'IL'},", "", 1)
if "iso2:'IL'" in world_text:
    raise SystemExit('excluded country code still present in world catalog')
world_path.write_text(world_text, encoding='utf-8')

print('worldwide nationality, global ranking, and country exclusion applied')
