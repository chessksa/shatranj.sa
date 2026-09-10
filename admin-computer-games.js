import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = window.SHATRANJ_CONFIG?.supabase || {};
const supabase = cfg.enabled && cfg.url && cfg.anonKey ? createClient(cfg.url, cfg.anonKey) : null;
const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const levelLabel = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };
const statusLabel = { active: 'نشطة', finished: 'منتهية', abandoned: 'متروكة' };
const resultLabel = { win: 'فوز اللاعب', loss: 'فوز الكمبيوتر', draw: 'تعادل' };
let loading = false;

function fmtDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function statusPill(status) {
  const cls = status === 'active' ? 'status-active' : 'status-finished';
  return `<span class="status-pill ${cls}">${esc(statusLabel[status] || status || '—')}</span>`;
}

async function loadComputerGames() {
  const body = $('computerGamesTableBody');
  if (!body || !supabase || loading) return;
  const status = $('gameStatusFilter')?.value || '';
  if (status === 'waiting') {
    body.innerHTML = '<tr><td colspan="8" class="empty">لا توجد مباريات ضد الكمبيوتر بانتظار لاعب.</td></tr>';
    return;
  }

  loading = true;
  try {
    let query = supabase
      .from('computer_games')
      .select('id,player_id,level,status,result,time_control_minutes,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (status === 'active' || status === 'finished') query = query.eq('status', status);

    const { data: games, error } = await query;
    if (error) throw error;
    const rows = games || [];
    const playerIds = new Set(rows.map((g) => g.player_id).filter(Boolean));
    const players = new Map();

    if (playerIds.size) {
      const { data: playerRows, error: playerError } = await supabase.rpc('admin_list_players_v3', {
        p_search: null,
        p_status: null,
        p_country: null,
        p_city: null,
      });
      if (playerError) throw playerError;
      (playerRows || []).forEach((p) => {
        if (playerIds.has(p.id)) players.set(p.id, p);
      });
    }

    body.innerHTML = rows.map((g) => {
      const player = players.get(g.player_id) || {};
      const location = [player.city, player.country].filter(Boolean).join(' · ');
      const code = String(g.id || '').slice(0, 8).toUpperCase();
      return `<tr data-created-at="${esc(g.created_at || '')}">
        <td>${esc(code || '—')}</td>
        <td><strong>${esc(player.name || 'عضو غير معروف')}</strong>${location ? `<div style="margin-top:3px;color:var(--muted);font-size:11px">${esc(location)}</div>` : ''}</td>
        <td><span style="color:var(--gold2);font-weight:900">ضد الكمبيوتر</span><div style="margin-top:3px;color:var(--muted);font-size:11px">${esc(levelLabel[g.level] || g.level || '—')}</div></td>
        <td>${esc(g.time_control_minutes || '—')} د</td>
        <td>${statusPill(g.status)}</td>
        <td>${esc(resultLabel[g.result] || (g.result ? g.result : '—'))}</td>
        <td>${esc(fmtDate(g.created_at))}</td>
        <td><a class="link-btn" href="computer-watch.html?game=${encodeURIComponent(g.id)}">متابعة</a></td>
      </tr>`;
    }).join('') || '<tr><td colspan="8" class="empty">لا توجد مباريات ضد الكمبيوتر ضمن نطاق صلاحيتك.</td></tr>';
  } catch (error) {
    console.error('تعذر تحميل مباريات الكمبيوتر', error);
    body.innerHTML = '<tr><td colspan="8" class="empty">تعذر تحميل مباريات الكمبيوتر.</td></tr>';
  } finally {
    loading = false;
  }
}

function startWhenAdminReady() {
  const app = $('adminApp');
  if (!app) return;
  if (app.hidden) {
    setTimeout(startWhenAdminReady, 180);
    return;
  }
  loadComputerGames();
  $('gameStatusFilter')?.addEventListener('change', loadComputerGames);
  $('refreshBtn')?.addEventListener('click', loadComputerGames);
  setInterval(() => {
    if ($('gamesView')?.classList.contains('active')) loadComputerGames();
  }, 5000);
}

startWhenAdminReady();

import('./admin-pro.js?v=20260910-2').catch((error) => console.error('تعذر تحميل تطوير لوحة الإدارة', error));
import('./admin-responsive-tables.js?v=20260910-4').catch((error) => console.error('تعذر تحميل استجابة جداول الإدارة', error));
import('./admin-player-list.js?v=20260910-2').catch((error) => console.error('تعذر تحميل قائمة اللاعبين المختصرة', error));
import('./admin-view-state.js?v=20260910-1').catch((error) => console.error('تعذر حفظ قسم لوحة الإدارة', error));
import('./admin-unified-games.js?v=20260910-1').catch((error) => console.error('تعذر تحميل جدول المباريات الموحد', error));
