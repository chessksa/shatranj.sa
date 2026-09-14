(() => {
  'use strict';

  if (!new URLSearchParams(location.search).has('computer')) return;

  const run = async () => {
    const bottomAvatarImg = document.getElementById('bottomAvatarImg');
    if (!bottomAvatarImg) return;

    const cfg = window.SHATRANJ_CONFIG?.supabase || {};
    if (!cfg.enabled || !cfg.url || !cfg.anonKey) return;

    let createClient = window.supabase?.createClient;
    if (!createClient) {
      try {
        const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        createClient = mod.createClient;
      } catch (error) {
        console.warn('computer player profile client unavailable', error);
        return;
      }
    }

    const supabase = createClient(cfg.url, cfg.anonKey);
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    if (!session) return;

    const { data, error } = await supabase.rpc('get_my_player_profile');
    const player = Array.isArray(data) ? (data[0] || null) : data;
    if (error || !player) return;

    const nameEl = document.getElementById('bottomName');
    const locationEl = document.getElementById('bottomLocation');
    const ratingEl = document.getElementById('bottomRating');

    if (nameEl && player.name) nameEl.textContent = player.name;
    if (locationEl) {
      const locationText = [player.region, player.city].filter(Boolean).join(' — ');
      if (locationText) locationEl.textContent = locationText;
    }
    if (ratingEl && Number.isFinite(Number(player.rating))) ratingEl.textContent = String(player.rating);

    if (!player.id) return;

    const avatarPath = player.avatar_path || `${player.id}/avatar.webp`;
    const legacyAvatarPath = session.user?.id ? `${session.user.id}/avatar.webp` : null;
    const avatarUrl = (path) => `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
    let triedLegacy = false;

    bottomAvatarImg.hidden = true;
    bottomAvatarImg.onload = () => {
      bottomAvatarImg.hidden = false;
      document.getElementById('bottomAvatar')?.classList.remove('avatar-empty');
    };
    bottomAvatarImg.onerror = () => {
      if (!triedLegacy && legacyAvatarPath && legacyAvatarPath !== avatarPath) {
        triedLegacy = true;
        bottomAvatarImg.src = avatarUrl(legacyAvatarPath);
        return;
      }
      bottomAvatarImg.hidden = true;
    };
    bottomAvatarImg.src = avatarUrl(avatarPath);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
