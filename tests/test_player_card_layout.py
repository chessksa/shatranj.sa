from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_player_cards_use_square_photo_full_name_location_without_pin_and_points_label():
    html = (ROOT / "play-v10.html").read_text(encoding="utf-8")
    assert ".avatar{width:82px;height:82px;border-radius:14px" in html
    assert ".avatar-img" in html
    assert "white-space:normal" in html
    assert "text-overflow:clip" in html
    assert "📍" not in html
    assert html.count('class="rating-label">النقاط</span>') >= 2
    assert 'id="topAvatarImg"' in html
    assert 'id="bottomAvatarImg"' in html


def test_live_player_location_is_region_then_city_and_avatar_photo_is_loaded():
    js = (ROOT / "play-v8.js").read_text(encoding="utf-8")
    assert "[serverState.white_region,serverState.white_city]" in js
    assert "[serverState.black_region,serverState.black_city]" in js
    assert "setPlayerAvatar(topAvatarEl, topAvatarImgEl, top)" in js
    assert "setPlayerAvatar(bottomAvatarEl, bottomAvatarImgEl, bottom)" in js
    assert "storage.from('avatars').getPublicUrl" in js


def test_search_player_location_is_region_then_city_and_loads_own_avatar():
    js = (ROOT / "play-v10-match.js").read_text(encoding="utf-8")
    assert "[p.region,p.city]" in js
    assert "storage.from('avatars').getPublicUrl" in js
    assert "bottomAvatarImg" in js
