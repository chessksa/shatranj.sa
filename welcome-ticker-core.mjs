const SAUDI_REGIONS = new Set([
  'الرياض','مكة المكرمة','المدينة المنورة','القصيم','المنطقة الشرقية','عسير',
  'تبوك','حائل','الحدود الشمالية','جازان','نجران','الباحة','الجوف'
]);

export function countryForRegion(value) {
  const region = String(value ?? '').trim();
  return SAUDI_REGIONS.has(region) ? 'السعودية' : region;
}

export function formatMemberLabel(member) {
  const name = String(member?.name ?? '').trim() || 'لاعب جديد';
  const country = countryForRegion(member?.region) || 'دولة غير محددة';
  const city = String(member?.city ?? '').trim();
  return city
    ? `نرحب بانضمام ${name} — ${country}، ${city}`
    : `نرحب بانضمام ${name} — ${country}`;
}

export function selectLatestMembers(rows, limit = 10) {
  const count = Math.max(1, Number(limit) || 10);
  return [...(Array.isArray(rows) ? rows : [])]
    .filter(row => row && row.created_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, count);
}

export function buildLatestMembersUrl(supabaseUrl, limit = 10) {
  const base = String(supabaseUrl ?? '').replace(/\/$/, '');
  const count = Math.max(1, Number(limit) || 10);
  const params = new URLSearchParams({
    select: 'id,name,region,city,created_at',
    order: 'created_at.desc',
    limit: String(count)
  });
  return `${base}/rest/v1/public_players?${params.toString()}`;
}

function addTickerStyles(doc) {
  if (doc.getElementById('welcomeTickerStyles')) return;
  const style = doc.createElement('style');
  style.id = 'welcomeTickerStyles';
  style.textContent = `
    .welcome-ticker{height:34px;overflow:hidden;background:#0a302f;border-top:1px solid rgba(197,163,77,.55);border-bottom:1px solid rgba(197,163,77,.55);color:#f7f3e7;display:flex;align-items:center;position:relative;z-index:12}
    .welcome-ticker[hidden]{display:none!important}
    .welcome-ticker::before,.welcome-ticker::after{content:"";position:absolute;top:0;bottom:0;width:36px;z-index:2;pointer-events:none}
    .welcome-ticker::before{right:0;background:linear-gradient(270deg,#0a302f,rgba(10,48,47,0))}
    .welcome-ticker::after{left:0;background:linear-gradient(90deg,#0a302f,rgba(10,48,47,0))}
    .welcome-ticker-track{display:flex;width:max-content;min-width:max-content;direction:ltr;will-change:transform;animation:welcomeTickerMove 42s linear infinite}
    .welcome-ticker:hover .welcome-ticker-track{animation-play-state:paused}
    .welcome-ticker-group{display:flex;align-items:center;flex:none}
    .welcome-ticker-item{direction:rtl;display:inline-flex;align-items:center;white-space:nowrap;font-size:12px;font-weight:800;line-height:1;padding:0 22px}
    .welcome-ticker-item strong{color:#f0d77c;font-weight:900}
    .welcome-ticker-separator{width:5px;height:5px;border-radius:50%;background:#c5a34d;box-shadow:0 0 0 2px rgba(197,163,77,.12);flex:none}
    @keyframes welcomeTickerMove{from{transform:translateX(-50%)}to{transform:translateX(0)}}
    @media(max-width:800px){.welcome-ticker{height:30px}.welcome-ticker-item{font-size:11px;padding:0 16px}.welcome-ticker-track{animation-duration:36s}}
    @media(prefers-reduced-motion:reduce){.welcome-ticker{overflow-x:auto}.welcome-ticker-track{animation:none;transform:none}.welcome-ticker-group:nth-child(2){display:none}}
  `;
  doc.head.appendChild(style);
}

function buildGroup(doc, members) {
  const group = doc.createElement('div');
  group.className = 'welcome-ticker-group';
  members.forEach(member => {
    const item = doc.createElement('span');
    item.className = 'welcome-ticker-item';
    item.textContent = formatMemberLabel(member);
    group.appendChild(item);

    const separator = doc.createElement('span');
    separator.className = 'welcome-ticker-separator';
    separator.setAttribute('aria-hidden', 'true');
    group.appendChild(separator);
  });
  return group;
}

export async function initWelcomeTicker({
  supabaseUrl,
  anonKey,
  limit = 10,
  refreshMs = 60000,
  documentRef = globalThis.document,
  fetchRef = globalThis.fetch
} = {}) {
  const doc = documentRef;
  if (!doc || typeof fetchRef !== 'function') return null;

  const header = doc.querySelector('header.home-header') || doc.querySelector('header');
  if (!header) return null;

  addTickerStyles(doc);

  let ticker = doc.getElementById('welcomeTicker');
  if (!ticker) {
    ticker = doc.createElement('div');
    ticker.id = 'welcomeTicker';
    ticker.className = 'welcome-ticker';
    ticker.setAttribute('role', 'region');
    ticker.setAttribute('aria-label', 'آخر الأعضاء المنضمين');
    ticker.hidden = true;
    header.insertAdjacentElement('afterend', ticker);
  }

  let loading = false;
  let lastSignature = '';

  async function refresh() {
    if (loading) return;
    loading = true;
    try {
      const response = await fetchRef(buildLatestMembersUrl(supabaseUrl, limit), {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Accept: 'application/json'
        },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`welcome ticker request failed: ${response.status}`);
      const members = selectLatestMembers(await response.json(), limit);
      if (!members.length) {
        ticker.hidden = true;
        return;
      }

      const signature = members.map(member => `${member.id}|${member.created_at}`).join(';');
      if (signature === lastSignature && !ticker.hidden) return;
      lastSignature = signature;

      const track = doc.createElement('div');
      track.className = 'welcome-ticker-track';
      track.append(buildGroup(doc, members), buildGroup(doc, members));
      ticker.replaceChildren(track);
      ticker.hidden = false;
    } catch (error) {
      console.warn('welcome ticker unavailable', error);
      if (!lastSignature) ticker.hidden = true;
    } finally {
      loading = false;
    }
  }

  await refresh();

  const countNode = doc.getElementById('headerPlayersCount');
  if (countNode && typeof MutationObserver !== 'undefined') {
    let timer = null;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 250);
    }).observe(countNode, { childList: true, characterData: true, subtree: true });
  }

  if (refreshMs > 0) setInterval(refresh, refreshMs);
  return { refresh, element: ticker };
}
