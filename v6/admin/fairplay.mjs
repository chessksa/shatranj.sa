import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = window.SHATRANJ_CONFIG?.supabase || {};
const supabase = cfg.enabled && cfg.url && cfg.anonKey ? createClient(cfg.url, cfg.anonKey) : null;
const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

async function rpc(name, args = {}) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data;
}

function fmt(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('ar-SA');
}

function signalText(signals = {}) {
  const avg = signals.average_server_move_ms;
  const fast = signals.moves_under_150ms;
  const std = signals.timing_stddev_ms;
  const source = signals.source_type;
  return [
    avg != null ? `متوسط ${Number(avg).toFixed(0)}ms` : null,
    fast != null ? `${fast} نقلة ≤150ms` : null,
    std != null ? `تشتت ${Number(std).toFixed(0)}ms` : null,
    source ? `المصدر: ${source}` : null,
  ].filter(Boolean).join(' · ');
}

async function loadFairPlay() {
  const body = $('v6FairPlayBody');
  if (!body || !supabase) return;
  try {
    const rows = await rpc('admin_v6_list_fair_play_cases', { p_status: 'review' });
    body.innerHTML = (rows || []).map((row) => `
      <tr>
        <td><strong>${esc(row.player_name || '—')}</strong><div style="font-size:10px;color:var(--muted);margin-top:3px">${esc(row.player_id)}</div></td>
        <td><span class="status-pill status-waiting">${esc(row.score)}</span></td>
        <td>${esc(signalText(row.signals || {}))}</td>
        <td>${row.last_game_id ? `<a class="link-btn" href="watch.html?game=${encodeURIComponent(row.last_game_id)}">فتح المباراة</a>` : '—'}</td>
        <td>${esc(row.event_count || 0)}</td>
        <td>${esc(fmt(row.updated_at))}</td>
        <td><div class="table-actions">
          <button class="action-btn ok" data-fairplay-status="cleared" data-case="${esc(row.id)}">سليم</button>
          <button class="action-btn" data-fairplay-status="actioned" data-case="${esc(row.id)}">تمت المراجعة</button>
        </div></td>
      </tr>`).join('') || '<tr><td colspan="7" class="empty">لا توجد حالات Fair Play تنتظر المراجعة.</td></tr>';
  } catch (error) {
    console.error('تعذر تحميل Fair Play', error);
    body.innerHTML = '<tr><td colspan="7" class="empty">تعذر تحميل حالات Fair Play.</td></tr>';
  }
}

async function resolveCase(button) {
  const caseId = button.dataset.case;
  const status = button.dataset.fairplayStatus;
  if (!caseId || !['cleared','actioned'].includes(status)) return;
  const note = prompt('ملاحظة المراجعة (اختياري):', '') ?? '';
  if (!confirm(status === 'cleared' ? 'تأكيد أن الحالة سليمة؟' : 'تأكيد أن الحالة تمت مراجعتها؟')) return;
  button.disabled = true;
  try {
    await rpc('admin_v6_resolve_fair_play_case', {
      p_case_id: caseId,
      p_status: status,
      p_note: note.trim() || null,
    });
    await loadFairPlay();
  } catch (error) {
    console.error('تعذر تحديث حالة Fair Play', error);
    alert('تعذر حفظ نتيجة المراجعة.');
  } finally {
    button.disabled = false;
  }
}

function addFairPlayPanel() {
  const host = $('reportsView');
  if (!host || $('v6FairPlayPanel')) return;
  const section = document.createElement('section');
  section.id = 'v6FairPlayPanel';
  section.className = 'panel';
  section.style.marginTop = '14px';
  section.innerHTML = `
    <div class="panel-head"><h2>Fair Play</h2><button id="v6FairPlayRefresh" class="refresh-btn" type="button">↻ تحديث</button></div>
    <div class="panel-body">
      <div class="owner-note">إشارات آلية للمراجعة البشرية فقط. لا ينتج عنها إجراء تلقائي على حساب اللاعب.</div>
      <div class="table-wrap"><table><thead><tr><th>اللاعب</th><th>الدرجة</th><th>الإشارات</th><th>المباراة</th><th>العينة</th><th>آخر تحديث</th><th>القرار</th></tr></thead><tbody id="v6FairPlayBody"><tr><td colspan="7" class="empty">جارٍ التحميل…</td></tr></tbody></table></div>
    </div>`;
  host.appendChild(section);
  section.addEventListener('click', (event) => {
    const button = event.target.closest('[data-fairplay-status]');
    if (button) resolveCase(button);
  });
  $('v6FairPlayRefresh')?.addEventListener('click', loadFairPlay);
  loadFairPlay();
}

function start() {
  const app = $('adminApp');
  if (!app || app.hidden) {
    setTimeout(start, 180);
    return;
  }
  addFairPlayPanel();
  $('refreshBtn')?.addEventListener('click', loadFairPlay);
  setInterval(() => {
    if ($('reportsView')?.classList.contains('active')) loadFairPlay();
  }, 15000);
}

start();
