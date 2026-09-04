from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_player_cards_keep_desktop_info_to_four_lines_and_square_photo():
    html = (ROOT / "play-v10.html").read_text(encoding="utf-8")
    assert ".avatar{width:82px;height:82px;border-radius:14px" in html
    assert ".avatar-img" in html
    assert ".player-info{min-width:0}" in html
    assert ".name{display:block;color:inherit;text-decoration:none;font-size:16px;font-weight:800;margin:0 0 5px;white-space:nowrap" in html
    assert ".location{color:#efbd64;font-size:11px;margin-bottom:6px;white-space:nowrap" in html
    assert "📍" not in html
    assert html.count('class="rating-label">النقاط</span>') >= 2
    assert 'id="topAvatarImg"' in html
    assert 'id="bottomAvatarImg"' in html
    assert "@media(max-width:900px)" in html
    assert ".player-card{min-height:110px;padding:11px;grid-template-columns:60px minmax(0,1fr) 104px;gap:9px}" in html


def test_live_player_location_is_region_then_city_and_avatar_uses_real_profile_path():
    js = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    assert "[serverState.white_region,serverState.white_city]" in js
    assert "[serverState.black_region,serverState.black_city]" in js
    assert "setPlayerAvatar(topAvatarEl, topAvatarImgEl, top)" in js
    assert "setPlayerAvatar(bottomAvatarEl, bottomAvatarImgEl, bottom" in js
    assert "get_public_player_profile" in js
    assert "profile?.avatar_path" in js
    assert "storage.from('avatars').getPublicUrl" in js


def test_search_player_location_is_region_then_city_and_uses_saved_avatar_path():
    js = (ROOT / "play-v10-match.js").read_text(encoding="utf-8")
    assert "[p.region,p.city]" in js
    assert "p.avatar_path || `${p.id}/avatar.webp`" in js
    assert "storage.from('avatars').getPublicUrl" in js
    assert "bottomAvatarImg" in js


def test_play_avatar_uses_legacy_auth_fallback_and_cache_busting():
    prematch = (ROOT / "play-v10-match.js").read_text(encoding="utf-8")
    live = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    assert "`${authUserId}/avatar.webp`" in prematch
    assert "legacyAvatarPath=" in live
    assert "avatarUrl(legacyAvatarPath)" in live
    assert "?v=${Date.now()}" in prematch
    assert "?v=${Date.now()}" in live


def test_play_header_uses_home_label_and_equal_control_sizes():
    html = (ROOT / "play-v10.html").read_text(encoding="utf-8")
    live = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    assert 'id="leaveText">الرئيسية</span>' in html
    assert ".side-icon-btn{width:64px;height:38px" in html
    assert "#siteNotificationHost .site-notification-bell{width:64px!important;height:38px!important" in html
    assert "leaveText.textContent = 'الرئيسية'" in live
    assert "leaveText.textContent = 'مغادرة المباراة'" not in live
