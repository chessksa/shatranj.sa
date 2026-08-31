const REGIONS = [
  "الرياض","مكة المكرمة","المدينة المنورة","القصيم","المنطقة الشرقية","عسير",
  "تبوك","حائل","الحدود الشمالية","جازان","نجران","الباحة","الجوف"
];

const regionSelect = document.querySelector("#region");
const regionFilter = document.querySelector("#regionFilter");
const cityFilter = document.querySelector("#cityFilter");
const form = document.querySelector("#playerForm");
const msg = document.querySelector("#formMessage");
const body = document.querySelector("#rankingBody");
const empty = document.querySelector("#emptyRanking");

regionSelect.innerHTML = '<option value="">اختر المنطقة</option>' + REGIONS.map(r=>`<option>${r}</option>`).join("");
regionFilter.innerHTML = '<option value="">كل المناطق</option>' + REGIONS.map(r=>`<option>${r}</option>`).join("");

const config = window.SHATRANJ_CONFIG?.supabase || {};
let supabase = null;

if (config.enabled) {
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
  supabase = createClient(config.url, config.anonKey);
}

function normalizeMobile(v){
  return v.replace(/\s|-/g,"");
}
function validSaudiMobile(v){
  return /^05\d{8}$/.test(v);
}
function localPlayers(){
  return JSON.parse(localStorage.getItem("shatranj_players") || "[]");
}
function saveLocal(players){
  localStorage.setItem("shatranj_players", JSON.stringify(players));
}

async function getPlayers(){
  if(supabase){
    const {data,error} = await supabase
      .from("public_players")
      .select("id,name,region,city,rating,rating_status,category,created_at")
      .order("rating",{ascending:false})
      .order("created_at",{ascending:true});
    if(error) throw error;
    return data || [];
  }
  return localPlayers();
}

async function addPlayer(player){
  if(supabase){
    const {error} = await supabase.rpc("register_player", {
      p_name: player.name,
      p_mobile: player.mobile,
      p_region: player.region,
      p_city: player.city,
      p_category: player.category
    });
    if(error) throw error;
    return;
  }
  const players = localPlayers();
  if(players.some(p=>p.mobile===player.mobile)) throw new Error("هذا الرقم مسجل مسبقًا.");
  players.push({
    id: crypto.randomUUID(),
    ...player,
    rating:1500,
    rating_status:"provisional",
    created_at:new Date().toISOString()
  });
  saveLocal(players);
}

function filtered(players){
  const r = regionFilter.value;
  const c = cityFilter.value.trim();
  return players.filter(p=>(!r || p.region===r) && (!c || p.city.includes(c)));
}

function updateStats(players){
  document.querySelector("#playersCount").textContent = players.length;
  document.querySelector("#regionsCount").textContent = new Set(players.map(p=>p.region)).size;
  document.querySelector("#citiesCount").textContent = new Set(players.map(p=>p.city)).size;
}

async function render(){
  try{
    const all = await getPlayers();
    updateStats(all);
    const players = filtered(all);
    body.innerHTML = players.map((p,i)=>`
      <tr>
        <td>${i+1}</td>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td>${escapeHtml(p.city)}</td>
        <td>${escapeHtml(p.region)}</td>
        <td class="rating">${p.rating}</td>
        <td><span class="status ${p.rating_status === "verified" ? "verified":""}">
          ${p.rating_status === "verified" ? "معتمد" : "مبدئي"}
        </span></td>
      </tr>`).join("");
    empty.style.display = players.length ? "none" : "block";
  }catch(e){
    console.error(e);
    msg.textContent = "تعذر تحميل البيانات.";
  }
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[ch]);
}

form.addEventListener("submit", async e=>{
  e.preventDefault();
  msg.textContent = "";
  const mobile = normalizeMobile(document.querySelector("#mobile").value);
  if(!validSaudiMobile(mobile)){
    msg.textContent = "أدخل رقم جوال سعودي بصيغة 05xxxxxxxx.";
    return;
  }
  const player = {
    name: document.querySelector("#name").value.trim(),
    mobile,
    region: regionSelect.value,
    city: document.querySelector("#city").value.trim(),
    category: document.querySelector("#category").value
  };
  try{
    await addPlayer(player);
    form.reset();
    msg.textContent = "تم إنشاء ملف اللاعب بنجاح.";
    await render();
  }catch(e){
    msg.textContent = e.message || "تعذر التسجيل.";
  }
});

regionFilter.addEventListener("change",render);
cityFilter.addEventListener("input",render);

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
render();
