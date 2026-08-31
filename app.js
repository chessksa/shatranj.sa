const REGIONS = [
  "الرياض","مكة المكرمة","المدينة المنورة","القصيم","المنطقة الشرقية","عسير",
  "تبوك","حائل","الحدود الشمالية","جازان","نجران","الباحة","الجوف"
];

const CATEGORY_LABELS = {
  open: "مفتوح",
  u18: "تحت 18",
  u14: "تحت 14",
  u10: "تحت 10",
};

const config = window.SHATRANJ_CONFIG?.supabase || {};
let supabase = null;

if (config.enabled) {
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
  supabase = createClient(config.url, config.anonKey);
}

const $ = (s) => document.querySelector(s);
const menuBtn = $("#menuBtn");
const mainNav = $("#mainNav");
const regionSelect = $("#region");
const regionFilter = $("#regionFilter");
const cityFilter = $("#cityFilter");
const form = $("#playerForm");
const msg = $("#formMessage");
const rankingBody = $("#rankingBody");
const emptyRanking = $("#emptyRanking");
const resultsCount = $("#resultsCount");

function fillRegions() {
  regionSelect.innerHTML = '<option value="">اختر المنطقة</option>' + REGIONS.map(r => `<option>${r}</option>`).join("");
  regionFilter.innerHTML = '<option value="">كل المناطق</option>' + REGIONS.map(r => `<option>${r}</option>`).join("");
}

menuBtn?.addEventListener("click", () => {
  mainNav.classList.toggle("open");
});

function normalizeMobile(v) {
  return v.replace(/\s|-/g, "");
}

function validSaudiMobile(v) {
  return /^05\d{8}$/.test(v);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]);
}

function localPlayers() {
  return JSON.parse(localStorage.getItem("shatranj_players") || "[]");
}

function saveLocal(players) {
  localStorage.setItem("shatranj_players", JSON.stringify(players));
}

async function getPlayers() {
  if (supabase) {
    const { data, error } = await supabase
      .from("public_players")
      .select("id,name,region,city,category,rating,rating_status,created_at")
      .order("rating", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }
  return localPlayers().sort((a, b) => b.rating - a.rating);
}

async function addPlayer(player) {
  if (supabase) {
    const { error } = await supabase.rpc("register_player", {
      p_name: player.name,
      p_mobile: player.mobile,
      p_region: player.region,
      p_city: player.city,
      p_category: player.category
    });
    if (error) {
      if (String(error.message || "").includes("duplicate")) {
        throw new Error("رقم الجوال مسجل مسبقًا.");
      }
      throw error;
    }
    return;
  }

  const players = localPlayers();
  if (players.some(p => p.mobile === player.mobile)) {
    throw new Error("رقم الجوال مسجل مسبقًا.");
  }

  players.push({
    id: crypto.randomUUID(),
    ...player,
    rating: 1500,
    rating_status: "provisional",
    created_at: new Date().toISOString(),
  });

  saveLocal(players);
}

function updateStats(players) {
  $("#playersCount").textContent = players.length;
  $("#regionsCount").textContent = new Set(players.map(p => p.region)).size;
  $("#citiesCount").textContent = new Set(players.map(p => p.city)).size;
}

function filteredPlayers(players) {
  const selectedRegion = regionFilter.value;
  const selectedCity = cityFilter.value.trim();
  return players.filter(p => {
    const okRegion = !selectedRegion || p.region === selectedRegion;
    const okCity = !selectedCity || (p.city || "").includes(selectedCity);
    return okRegion && okCity;
  });
}

function renderTopThree(players) {
  const tops = [players[0], players[1], players[2]];
  [1,2,3].forEach((n, i) => {
    const p = tops[i];
    $(`#top${n}Name`).textContent = p ? p.name : "—";
    $(`#top${n}Meta`).textContent = p ? `${p.city} — ${p.region}` : "لا يوجد بيانات بعد";
    $(`#top${n}Rating`).textContent = p ? p.rating : "—";
  });
}

function statusLabel(status) {
  return status === "verified" ? "معتمد" : "مبدئي";
}

function renderTable(players) {
  rankingBody.innerHTML = players.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td>${escapeHtml(p.city || "")}</td>
      <td>${escapeHtml(p.region || "")}</td>
      <td><span class="category-badge">${CATEGORY_LABELS[p.category] || "مفتوح"}</span></td>
      <td><span class="status-badge ${p.rating_status === "verified" ? "verified" : ""}">${statusLabel(p.rating_status)}</span></td>
      <td class="rating">${p.rating}</td>
    </tr>
  `).join("");

  emptyRanking.style.display = players.length ? "none" : "block";
  resultsCount.textContent = `${players.length} نتيجة`;
}

async function render() {
  try {
    const allPlayers = await getPlayers();
    updateStats(allPlayers);
    renderTopThree(allPlayers);
    const shownPlayers = filteredPlayers(allPlayers);
    renderTable(shownPlayers);
  } catch (e) {
    console.error(e);
    msg.className = "message error";
    msg.textContent = "تعذر تحميل البيانات. تأكد من الربط مع Supabase أو جرّب لاحقًا.";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";
  msg.className = "message";

  const mobile = normalizeMobile($("#mobile").value);
  if (!validSaudiMobile(mobile)) {
    msg.className = "message error";
    msg.textContent = "أدخل رقم جوال سعودي بصيغة 05xxxxxxxx.";
    return;
  }

  const player = {
    name: $("#name").value.trim(),
    mobile,
    region: $("#region").value,
    city: $("#city").value.trim(),
    category: $("#category").value
  };

  try {
    await addPlayer(player);
    form.reset();
    msg.className = "message success";
    msg.textContent = "تم إنشاء ملف اللاعب بنجاح.";
    await render();
  } catch (e) {
    console.error(e);
    msg.className = "message error";
    if (String(e.message || "").includes("duplicate")) {
      msg.textContent = "رقم الجوال مسجل مسبقًا.";
    } else if (String(e.message || "").includes("Failed to fetch")) {
      msg.textContent = "تعذر الاتصال بقاعدة البيانات.";
    } else {
      msg.textContent = e.message || "تعذر التسجيل.";
    }
  }
});

regionFilter.addEventListener("change", render);
cityFilter.addEventListener("input", render);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

fillRegions();
render();
