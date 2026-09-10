import { ARAB_CITIES_DATA } from './arab-cities.js';

const CITY_API_BASE='https://countriesnow.space/api/v0.1/countries/cities';
const CITY_API_QUERY='https://countriesnow.space/api/v0.1/countries/cities/q';
const CITY_CACHE_PREFIX='shatranj-world-cities-v1:';
const CITY_CACHE_TTL=30*24*60*60*1000;

const ARABIC_NAME_OVERRIDES=Object.freeze({
  SA:'السعودية',AE:'الإمارات',KW:'الكويت',BH:'البحرين',QA:'قطر',OM:'عُمان',YE:'اليمن',IQ:'العراق',JO:'الأردن',PS:'فلسطين',LB:'لبنان',SY:'سوريا',EG:'مصر',SD:'السودان',LY:'ليبيا',TN:'تونس',DZ:'الجزائر',MA:'المغرب',MR:'موريتانيا',SO:'الصومال',DJ:'جيبوتي',KM:'جزر القمر'
});

const API_NAME_OVERRIDES=Object.freeze({
  BO:'Bolivia',BN:'Brunei',CD:'Democratic Republic of the Congo',CG:'Republic of the Congo',CI:'Ivory Coast',CZ:'Czech Republic',FM:'Micronesia',IR:'Iran',KP:'North Korea',KR:'South Korea',LA:'Laos',MD:'Moldova',MK:'North Macedonia',PS:'Palestine',RU:'Russia',SY:'Syria',TW:'Taiwan',TZ:'Tanzania',VA:'Vatican City',VE:'Venezuela',VN:'Vietnam'
});

const RAW_COUNTRIES=[
{iso2:'SA'}, {iso2:'AD'}, {iso2:'AE'}, {iso2:'AF'}, {iso2:'AG'}, {iso2:'AI'}, {iso2:'AL'}, {iso2:'AM'}, {iso2:'AO'}, {iso2:'AQ'}, {iso2:'AR'}, {iso2:'AS'}, {iso2:'AT'}, {iso2:'AU'}, {iso2:'AW'}, {iso2:'AX'}, {iso2:'AZ'}, {iso2:'BA'}, {iso2:'BB'}, {iso2:'BD'}, {iso2:'BE'}, {iso2:'BF'}, {iso2:'BG'}, {iso2:'BH'}, {iso2:'BI'}, {iso2:'BJ'}, {iso2:'BL'}, {iso2:'BM'}, {iso2:'BN'}, {iso2:'BO'}, {iso2:'BQ'}, {iso2:'BR'}, {iso2:'BS'}, {iso2:'BT'}, {iso2:'BV'}, {iso2:'BW'}, {iso2:'BY'}, {iso2:'BZ'}, {iso2:'CA'}, {iso2:'CC'}, {iso2:'CD'}, {iso2:'CF'}, {iso2:'CG'}, {iso2:'CH'}, {iso2:'CI'}, {iso2:'CK'}, {iso2:'CL'}, {iso2:'CM'}, {iso2:'CN'}, {iso2:'CO'}, {iso2:'CR'}, {iso2:'CU'}, {iso2:'CV'}, {iso2:'CW'}, {iso2:'CX'}, {iso2:'CY'}, {iso2:'CZ'}, {iso2:'DE'}, {iso2:'DJ'}, {iso2:'DK'}, {iso2:'DM'}, {iso2:'DO'}, {iso2:'DZ'}, {iso2:'EC'}, {iso2:'EE'}, {iso2:'EG'}, {iso2:'EH'}, {iso2:'ER'}, {iso2:'ES'}, {iso2:'ET'}, {iso2:'FI'}, {iso2:'FJ'}, {iso2:'FK'}, {iso2:'FM'}, {iso2:'FO'}, {iso2:'FR'}, {iso2:'GA'}, {iso2:'GB'}, {iso2:'GD'}, {iso2:'GE'}, {iso2:'GF'}, {iso2:'GG'}, {iso2:'GH'}, {iso2:'GI'}, {iso2:'GL'}, {iso2:'GM'}, {iso2:'GN'}, {iso2:'GP'}, {iso2:'GQ'}, {iso2:'GR'}, {iso2:'GS'}, {iso2:'GT'}, {iso2:'GU'}, {iso2:'GW'}, {iso2:'GY'}, {iso2:'HK'}, {iso2:'HM'}, {iso2:'HN'}, {iso2:'HR'}, {iso2:'HT'}, {iso2:'HU'}, {iso2:'ID'}, {iso2:'IE'}, {iso2:'IL'}, {iso2:'IM'}, {iso2:'IN'}, {iso2:'IO'}, {iso2:'IQ'}, {iso2:'IR'}, {iso2:'IS'}, {iso2:'IT'}, {iso2:'JE'}, {iso2:'JM'}, {iso2:'JO'}, {iso2:'JP'}, {iso2:'KE'}, {iso2:'KG'}, {iso2:'KH'}, {iso2:'KI'}, {iso2:'KM'}, {iso2:'KN'}, {iso2:'KP'}, {iso2:'KR'}, {iso2:'KW'}, {iso2:'KY'}, {iso2:'KZ'}, {iso2:'LA'}, {iso2:'LB'}, {iso2:'LC'}, {iso2:'LI'}, {iso2:'LK'}, {iso2:'LR'}, {iso2:'LS'}, {iso2:'LT'}, {iso2:'LU'}, {iso2:'LV'}, {iso2:'LY'}, {iso2:'MA'}, {iso2:'MC'}, {iso2:'MD'}, {iso2:'ME'}, {iso2:'MF'}, {iso2:'MG'}, {iso2:'MH'}, {iso2:'MK'}, {iso2:'ML'}, {iso2:'MM'}, {iso2:'MN'}, {iso2:'MO'}, {iso2:'MP'}, {iso2:'MQ'}, {iso2:'MR'}, {iso2:'MS'}, {iso2:'MT'}, {iso2:'MU'}, {iso2:'MV'}, {iso2:'MW'}, {iso2:'MX'}, {iso2:'MY'}, {iso2:'MZ'}, {iso2:'NA'}, {iso2:'NC'}, {iso2:'NE'}, {iso2:'NF'}, {iso2:'NG'}, {iso2:'NI'}, {iso2:'NL'}, {iso2:'NO'}, {iso2:'NP'}, {iso2:'NR'}, {iso2:'NU'}, {iso2:'NZ'}, {iso2:'OM'}, {iso2:'PA'}, {iso2:'PE'}, {iso2:'PF'}, {iso2:'PG'}, {iso2:'PH'}, {iso2:'PK'}, {iso2:'PL'}, {iso2:'PM'}, {iso2:'PN'}, {iso2:'PR'}, {iso2:'PS'}, {iso2:'PT'}, {iso2:'PW'}, {iso2:'PY'}, {iso2:'QA'}, {iso2:'RE'}, {iso2:'RO'}, {iso2:'RS'}, {iso2:'RU'}, {iso2:'RW'}, {iso2:'SB'}, {iso2:'SC'}, {iso2:'SD'}, {iso2:'SE'}, {iso2:'SG'}, {iso2:'SH'}, {iso2:'SI'}, {iso2:'SJ'}, {iso2:'SK'}, {iso2:'SL'}, {iso2:'SM'}, {iso2:'SN'}, {iso2:'SO'}, {iso2:'SR'}, {iso2:'SS'}, {iso2:'ST'}, {iso2:'SV'}, {iso2:'SX'}, {iso2:'SY'}, {iso2:'SZ'}, {iso2:'TC'}, {iso2:'TD'}, {iso2:'TF'}, {iso2:'TG'}, {iso2:'TH'}, {iso2:'TJ'}, {iso2:'TK'}, {iso2:'TL'}, {iso2:'TM'}, {iso2:'TN'}, {iso2:'TO'}, {iso2:'TR'}, {iso2:'TT'}, {iso2:'TV'}, {iso2:'TW'}, {iso2:'TZ'}, {iso2:'UA'}, {iso2:'UG'}, {iso2:'UM'}, {iso2:'US'}, {iso2:'UY'}, {iso2:'UZ'}, {iso2:'VA'}, {iso2:'VC'}, {iso2:'VE'}, {iso2:'VG'}, {iso2:'VI'}, {iso2:'VN'}, {iso2:'VU'}, {iso2:'WF'}, {iso2:'WS'}, {iso2:'YE'}, {iso2:'YT'}, {iso2:'ZA'}, {iso2:'ZM'}, {iso2:'ZW'}
];

const arabicDisplayNames=typeof Intl.DisplayNames==='function'?new Intl.DisplayNames(['ar'],{type:'region'}):null;
const englishDisplayNames=typeof Intl.DisplayNames==='function'?new Intl.DisplayNames(['en'],{type:'region'}):null;

function countryNameAr(iso2){
  return ARABIC_NAME_OVERRIDES[iso2]||arabicDisplayNames?.of(iso2)||iso2;
}

function countryApiName(iso2){
  return API_NAME_OVERRIDES[iso2]||englishDisplayNames?.of(iso2)||iso2;
}

const builtCountries=RAW_COUNTRIES.map(({iso2})=>Object.freeze({
  iso2,
  nameAr:countryNameAr(iso2),
  apiName:countryApiName(iso2)
}));

export const WORLD_COUNTRIES=Object.freeze([
  ...builtCountries.filter(country=>country.iso2==='SA'),
  ...builtCountries.filter(country=>country.iso2!=='SA').sort((a,b)=>a.nameAr.localeCompare(b.nameAr,'ar',{sensitivity:'base'}))
]);

const COUNTRY_BY_ISO=new Map(WORLD_COUNTRIES.map(country=>[country.iso2,country]));

function uniqueSortedCities(values){
  return [...new Set((Array.isArray(values)?values:[])
    .map(value=>String(value||'').trim())
    .filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b,'ar',{sensitivity:'base'}));
}

function readCachedCities(iso2){
  try{
    const raw=localStorage.getItem(CITY_CACHE_PREFIX+iso2);
    if(!raw) return null;
    const parsed=JSON.parse(raw);
    if(!parsed||!Array.isArray(parsed.cities)) return null;
    if(Date.now()-Number(parsed.savedAt||0)>CITY_CACHE_TTL) return null;
    return parsed.cities;
  }catch{
    return null;
  }
}

function writeCachedCities(iso2,cities){
  try{
    localStorage.setItem(CITY_CACHE_PREFIX+iso2,JSON.stringify({savedAt:Date.now(),cities}));
  }catch{}
}

async function fetchCities(country){
  const queryUrl=`${CITY_API_QUERY}?country=${encodeURIComponent(country.apiName)}`;
  try{
    const response=await fetch(queryUrl,{headers:{Accept:'application/json'},cache:'force-cache'});
    if(response.ok){
      const payload=await response.json();
      if(payload?.error===false&&Array.isArray(payload.data)) return payload.data;
    }
  }catch{}

  const response=await fetch(CITY_API_BASE,{
    method:'POST',
    headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify({country:country.apiName})
  });
  if(!response.ok) throw new Error(`city api ${response.status}`);
  const payload=await response.json();
  if(payload?.error!==false||!Array.isArray(payload.data)) throw new Error('invalid city api response');
  return payload.data;
}

export function getCountryByIso2(iso2){
  return COUNTRY_BY_ISO.get(String(iso2||'').toUpperCase())||null;
}

export async function getCitiesForCountry(iso2){
  const country=getCountryByIso2(iso2);
  if(!country) return [];

  const localArabic=ARAB_CITIES_DATA[country.nameAr];
  if(Array.isArray(localArabic)&&localArabic.length) return uniqueSortedCities(localArabic);

  const cached=readCachedCities(country.iso2);
  if(cached) return cached;

  try{
    const cities=uniqueSortedCities(await fetchCities(country));
    if(cities.length) writeCachedCities(country.iso2,cities);
    return cities;
  }catch(error){
    console.warn('تعذر تحميل مدن الدولة',country.nameAr,error);
    return [];
  }
}
