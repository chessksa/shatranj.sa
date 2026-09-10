from pathlib import Path

path = Path('index-app.html')
text = path.read_text(encoding='utf-8')

# Add a dedicated Arab-nationality selector while keeping signupRegion as worldwide residence country.
residence_anchor = '''          <label>\n            <span>الدولة</span>\n            <select id="signupRegion" required>'''
residence_replacement = '''          <label>\n            <span>الجنسية</span>\n            <select id="signupNationality" required>\n              <option value="">اختر الجنسية</option>\n            </select>\n          </label>\n\n          <label>\n            <span>دولة الإقامة</span>\n            <select id="signupRegion" required>'''

if 'id="signupNationality"' not in text:
    if residence_anchor not in text:
        raise SystemExit('signup residence field anchor not found')
    text = text.replace(residence_anchor, residence_replacement, 1)
else:
    text = text.replace('<span>الدولة</span>\n            <select id="signupRegion"', '<span>دولة الإقامة</span>\n            <select id="signupRegion"', 1)

# Add the Arab nationality catalog. Values stay as Arab-country names so ranking remains based on region.
helper_anchor = 'function populateSignupCountries(){'
nationality_helpers = r'''const ARAB_NATIONALITIES=[
  {value:'السعودية',label:'سعودي / سعودية'},
  {value:'الإمارات',label:'إماراتي / إماراتية'},
  {value:'الكويت',label:'كويتي / كويتية'},
  {value:'البحرين',label:'بحريني / بحرينية'},
  {value:'قطر',label:'قطري / قطرية'},
  {value:'عُمان',label:'عُماني / عُمانية'},
  {value:'اليمن',label:'يمني / يمنية'},
  {value:'العراق',label:'عراقي / عراقية'},
  {value:'الأردن',label:'أردني / أردنية'},
  {value:'فلسطين',label:'فلسطيني / فلسطينية'},
  {value:'لبنان',label:'لبناني / لبنانية'},
  {value:'سوريا',label:'سوري / سورية'},
  {value:'مصر',label:'مصري / مصرية'},
  {value:'السودان',label:'سوداني / سودانية'},
  {value:'ليبيا',label:'ليبي / ليبية'},
  {value:'تونس',label:'تونسي / تونسية'},
  {value:'الجزائر',label:'جزائري / جزائرية'},
  {value:'المغرب',label:'مغربي / مغربية'},
  {value:'موريتانيا',label:'موريتاني / موريتانية'},
  {value:'الصومال',label:'صومالي / صومالية'},
  {value:'جيبوتي',label:'جيبوتي / جيبوتية'},
  {value:'جزر القمر',label:'قمري / قمرية'}
];

function populateSignupNationalities(){
  const select=$('#signupNationality');
  if(!select) return;

  const placeholder=document.createElement('option');
  placeholder.value='';
  placeholder.textContent='اختر الجنسية';

  const options=ARAB_NATIONALITIES.map(nationality=>{
    const option=document.createElement('option');
    option.value=nationality.value;
    option.textContent=nationality.label;
    return option;
  });

  select.replaceChildren(placeholder,...options);
  select.value='';
}

'''

if 'const ARAB_NATIONALITIES=[' not in text:
    if helper_anchor not in text:
        raise SystemExit('world country helper anchor not found')
    text = text.replace(helper_anchor, nationality_helpers + helper_anchor, 1)

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

# Persist nationality in region (ranking field) and residence in country.
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

# Old auth metadata did not have residence country; use the old region as a safe legacy fallback.
old_fallback = """    region:metadata.region||'السعودية',\n    city:metadata.city||'الرياض',"""
new_fallback = """    region:metadata.region||'السعودية',\n    country:metadata.country||metadata.region||'السعودية',\n    city:metadata.city||'الرياض',"""
if old_fallback in text:
    text = text.replace(old_fallback, new_fallback, 1)
elif "country:metadata.country||metadata.region||'السعودية'" not in text:
    raise SystemExit('profile fallback anchor not found')

path.write_text(text, encoding='utf-8')
print('nationality/residence signup applied')
