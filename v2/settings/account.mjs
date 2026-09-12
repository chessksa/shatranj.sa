import { getSessionPlayer, rpc } from '../platform/api.mjs';

const $ = (id) => document.getElementById(id);
const challenges = $('v5-allow-challenges');
const messages = $('v5-allow-messages');
const showOnline = $('v5-show-online');
const siteNotifications = $('v5-site-notifications');
const soundEnabled = $('v5-sound-enabled');
const language = $('v5-language');
const timezone = $('v5-timezone');
const saveButton = $('v5-settings-save');
const status = $('v5-account-status');

function firstRow(data) {
  return Array.isArray(data) ? data[0] ?? null : data ?? null;
}

function setStatus(message, error = false) {
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('error', error);
}

function applySettings(value) {
  if (!value) return;
  challenges.value = value.allow_challenges || 'everyone';
  messages.value = value.allow_messages || 'everyone';
  showOnline.checked = value.show_online !== false;
  siteNotifications.checked = value.site_notifications !== false;
  soundEnabled.checked = value.sound_enabled !== false;
  language.value = value.language || 'ar';
  timezone.value = value.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Riyadh';
  localStorage.setItem('shatranj:sound-enabled', soundEnabled.checked ? '1' : '0');
}

function disableForm(disabled) {
  for (const el of [challenges, messages, showOnline, siteNotifications, soundEnabled, language, timezone, saveButton]) {
    if (el) el.disabled = disabled;
  }
}

async function load() {
  const { session } = await getSessionPlayer();
  if (!session) {
    disableForm(true);
    setStatus('سجل الدخول لتعديل إعدادات الحساب.', true);
    return;
  }
  try {
    const data = firstRow(await rpc('v5_get_my_settings'));
    applySettings(data);
    setStatus('إعدادات الحساب متزامنة مع حسابك.');
  } catch (error) {
    console.error(error);
    setStatus('تعذر تحميل إعدادات الحساب.', true);
  }
}

async function save() {
  if (!saveButton) return;
  disableForm(true);
  setStatus('جارٍ الحفظ…');
  try {
    const data = firstRow(await rpc('v5_update_my_settings', {
      p_allow_challenges: challenges.value,
      p_allow_messages: messages.value,
      p_show_online: showOnline.checked,
      p_site_notifications: siteNotifications.checked,
      p_sound_enabled: soundEnabled.checked,
      p_language: language.value,
      p_timezone: timezone.value.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Riyadh',
    }));
    applySettings(data);
    setStatus('تم حفظ إعدادات الحساب.');
  } catch (error) {
    console.error(error);
    setStatus('تعذر حفظ إعدادات الحساب.', true);
  } finally {
    disableForm(false);
  }
}

saveButton?.addEventListener('click', save);
void load();
