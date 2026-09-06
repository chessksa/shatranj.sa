from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    return text.replace(old, new, 1)


admin_path = Path('admin.js')
admin = admin_path.read_text(encoding='utf-8')

admin = replace_once(
    admin,
    '<div class="form-group"><label>الحد الأقصى للاعبين</label><input id="tournamentMax" class="field" type="number" min="2" placeholder="بدون حد"></div>',
    '<div class="form-group"><label>عدد المشاركين</label><select id="tournamentCapacityMode" class="field"><option value="fixed">محدد</option><option value="open">مفتوح</option></select></div>\n        <div id="tournamentMaxGroup" class="form-group"><label>العدد المحدد</label><input id="tournamentMax" class="field" type="number" min="2" step="1" placeholder="مثال: 16"></div>',
    'admin capacity fields',
)

admin = replace_once(
    admin,
    'async function loadTournaments(){',
    "function syncTournamentCapacityMode(){\n  const mode=$('tournamentCapacityMode')?.value||'fixed';\n  const group=$('tournamentMaxGroup');\n  const input=$('tournamentMax');\n  if(group)group.hidden=mode==='open';\n  if(input){input.disabled=mode==='open';input.required=mode==='fixed';if(mode==='open')input.value='';}\n}\n\nasync function loadTournaments(){",
    'capacity sync function',
)

old_open = "function openTournamentModal(t=null){\n  state.selectedTournament=t;$('tournamentModalTitle').textContent=t?'تعديل البطولة':'إضافة بطولة';$('tournamentName').value=t?.name||'';$('tournamentScope').value=t?.scope_type||'global';$('tournamentTime').value=t?.time_control||'10';fillCountries($('tournamentCountry'),t?.country||'');fillCities($('tournamentCountry'),$('tournamentCity'),t?.city||'');$('tournamentStarts').value=toLocalInput(t?.starts_at);$('tournamentRegOpen').value=toLocalInput(t?.registration_opens_at);$('tournamentRegClose').value=toLocalInput(t?.registration_closes_at);$('tournamentMax').value=t?.max_players||'';$('tournamentStatus').value=t?.status==='cancelled'?'draft':(t?.status||'draft');$('tournamentReason').value='';$('tournamentReasonGroup').hidden=!t;setScopeFields('tournamentScope','tournamentCountryGroup','tournamentCityGroup','tournamentCountry','tournamentCity');$('tournamentMessage').textContent='';\n  [...$('tournamentStatus').options].forEach(o=>o.disabled=!t&&['running','finished'].includes(o.value));showModal('tournamentModal');\n}"
new_open = "function openTournamentModal(t=null){\n  state.selectedTournament=t;$('tournamentModalTitle').textContent=t?'تعديل البطولة':'إضافة بطولة';$('tournamentName').value=t?.name||'';$('tournamentScope').value=t?.scope_type||'global';$('tournamentTime').value=t?.time_control||'10';fillCountries($('tournamentCountry'),t?.country||'');fillCities($('tournamentCountry'),$('tournamentCity'),t?.city||'');$('tournamentStarts').value=toLocalInput(t?.starts_at);$('tournamentRegOpen').value=toLocalInput(t?.registration_opens_at);$('tournamentRegClose').value=toLocalInput(t?.registration_closes_at);$('tournamentCapacityMode').value=t?.max_players?'fixed':'open';$('tournamentMax').value=t?.max_players||'';$('tournamentStatus').value=t?.status==='cancelled'?'draft':(t?.status||'draft');$('tournamentReason').value='';$('tournamentReasonGroup').hidden=!t;setScopeFields('tournamentScope','tournamentCountryGroup','tournamentCityGroup','tournamentCountry','tournamentCity');syncTournamentCapacityMode();$('tournamentMessage').textContent='';\n  [...$('tournamentStatus').options].forEach(o=>o.disabled=!t&&['running','finished'].includes(o.value));showModal('tournamentModal');\n}"
admin = replace_once(admin, old_open, new_open, 'open tournament modal')

old_save = "async function saveTournament(){\n  const t=state.selectedTournament,scope=$('tournamentScope').value,button=$('saveTournament');button.disabled=true;$('tournamentMessage').textContent='جارٍ الحفظ...';\n  const common={p_name:$('tournamentName').value.trim(),p_scope_type:scope,p_country:scope==='global'?null:$('tournamentCountry').value,p_city:scope==='city'?$('tournamentCity').value:null,p_time_control:$('tournamentTime').value,p_starts_at:fromLocalInput($('tournamentStarts').value),p_registration_opens_at:fromLocalInput($('tournamentRegOpen').value),p_registration_closes_at:fromLocalInput($('tournamentRegClose').value),p_max_players:$('tournamentMax').value?Number($('tournamentMax').value):null,p_status:$('tournamentStatus').value};\n  try{"
new_save = "async function saveTournament(){\n  const t=state.selectedTournament,scope=$('tournamentScope').value,button=$('saveTournament');\n  const capacityMode=$('tournamentCapacityMode').value;\n  const maxPlayers=capacityMode==='fixed'?Number($('tournamentMax').value):null;\n  button.disabled=true;$('tournamentMessage').textContent='جارٍ الحفظ...';\n  try{\n    if(capacityMode==='fixed'&&(!Number.isInteger(maxPlayers)||maxPlayers<2))throw new Error('حدد عدد المشاركين للبطولة.');\n    const common={p_name:$('tournamentName').value.trim(),p_scope_type:scope,p_country:scope==='global'?null:$('tournamentCountry').value,p_city:scope==='city'?$('tournamentCity').value:null,p_time_control:$('tournamentTime').value,p_starts_at:fromLocalInput($('tournamentStarts').value),p_registration_opens_at:fromLocalInput($('tournamentRegOpen').value),p_registration_closes_at:fromLocalInput($('tournamentRegClose').value),p_max_players:capacityMode==='open'?null:maxPlayers,p_status:$('tournamentStatus').value};"
admin = replace_once(admin, old_save, new_save, 'save tournament capacity')

old_listeners = "$('addTournamentBtn')?.addEventListener('click',()=>openTournamentModal());$('tournamentScope')?.addEventListener('change',()=>setScopeFields('tournamentScope','tournamentCountryGroup','tournamentCityGroup','tournamentCountry','tournamentCity'));$('tournamentCountry')?.addEventListener('change',()=>fillCities($('tournamentCountry'),$('tournamentCity')));$('saveTournament')?.addEventListener('click',saveTournament);"
new_listeners = "$('addTournamentBtn')?.addEventListener('click',()=>openTournamentModal());$('tournamentScope')?.addEventListener('change',()=>setScopeFields('tournamentScope','tournamentCountryGroup','tournamentCityGroup','tournamentCountry','tournamentCity'));$('tournamentCountry')?.addEventListener('change',()=>fillCities($('tournamentCountry'),$('tournamentCity')));$('tournamentCapacityMode')?.addEventListener('change',syncTournamentCapacityMode);$('saveTournament')?.addEventListener('click',saveTournament);"
admin = replace_once(admin, old_listeners, new_listeners, 'capacity mode listener')

admin_path.write_text(admin, encoding='utf-8')

public_path = Path('tournaments.html')
public_page = public_path.read_text(encoding='utf-8')

old_registration_open = "function registrationOpen(row){if(row.status!=='open')return false;const now=Date.now();if(row.registration_opens_at&&now<new Date(row.registration_opens_at).getTime())return false;if(row.registration_closes_at&&now>=new Date(row.registration_closes_at).getTime())return false;return true}"
new_registration_open = "function tournamentIsFull(row){const max=Number(row.max_players);return Number.isFinite(max)&&max>0&&Number(row.registered_count||0)>=max}\nfunction registrationOpen(row){if(row.status!=='open')return false;const now=Date.now();if(row.registration_opens_at&&now<new Date(row.registration_opens_at).getTime())return false;if(row.registration_closes_at&&now>=new Date(row.registration_closes_at).getTime())return false;return true}"
public_page = replace_once(public_page, old_registration_open, new_registration_open, 'public full helper')

old_control = "function registrationControl(row){return registrationOpen(row)?`<button class=\"register-btn\" type=\"button\" data-tournament-id=\"${esc(row.id)}\">سجّل الآن</button>`:'<button class=\"register-btn\" type=\"button\" disabled>التسجيل مغلق</button>'}"
new_control = "function registrationControl(row){if(tournamentIsFull(row))return '<button class=\"register-btn\" type=\"button\" disabled>اكتمل العدد</button>';return registrationOpen(row)?`<button class=\"register-btn\" type=\"button\" data-tournament-id=\"${esc(row.id)}\">سجّل الآن</button>`:'<button class=\"register-btn\" type=\"button\" disabled>التسجيل مغلق</button>'}"
public_page = replace_once(public_page, old_control, new_control, 'public registration control')

public_path.write_text(public_page, encoding='utf-8')
print('tournament capacity mode applied')
