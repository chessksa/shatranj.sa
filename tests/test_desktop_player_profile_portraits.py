from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def test_desktop_player_names_open_inline_public_profiles():
    shell = (ROOT / 'v2/home/desktop-board-shell.mjs').read_text(encoding='utf-8')
    profile = (ROOT / 'player.html').read_text(encoding='utf-8')
    css = (ROOT / 'v2/home/desktop-board-shell.css').read_text(encoding='utf-8')
    assert 'function openPublicPlayerPanel(playerId)' in shell
    assert "player.html?id='+encodeURIComponent(playerId)+'&embed=panel'" in shell
    assert "a[href*=\"player.html?id=\"]" in shell
    assert '.desktop-public-player-panel[hidden]' in css
    assert 'embedded-public-profile' in profile
    profile_block = shell.split('function openPublicPlayerPanel(playerId)', 1)[1].split('function embeddedPageView(', 1)[0]
    assert 'desktop:inline-play-stop' not in profile_block

def test_player_pictures_and_computer_portrait_are_used_in_game_cards():
    computer = (ROOT / 'v2/home/inline-computer.mjs').read_text(encoding='utf-8')
    shell = (ROOT / 'v2/home/desktop-board-shell.mjs').read_text(encoding='utf-8')
    css = (ROOT / 'v2/home/desktop-board-shell-tune.css').read_text(encoding='utf-8')
    assert (ROOT / 'assets/computer-avatar.svg').exists()
    assert 'assets/computer-avatar.svg' in computer
    assert "n.href='player.html?id='" in computer
    assert 'photo.onerror' in computer
    assert 'data-watch-photo=' in shell
    assert 'picture.onerror' in shell
    assert '.inline-play-player-avatar img' in css

def test_match_names_resolve_verified_player_ids():
    listing = (ROOT / 'watch.html').read_text(encoding='utf-8')
    sql = (ROOT / 'supabase/migrations/20261018193000_public_match_player_ids_for_profiles.sql').read_text(encoding='utf-8')
    assert 'data-profile-game=' in listing
    assert "supabase.rpc('get_public_match_player_ids'" in listing
    assert "p_game_type = 'human_v2'" in sql
    assert "p_game_type = 'computer'" in sql
    assert "g.status in ('matched', 'active', 'finished')" in sql
    assert 'security definer' in sql
    assert 'grant execute on function public.get_public_match_player_ids(uuid,text) to anon,authenticated;' in sql

def test_all_desktop_game_cards_show_square_avatars_and_gold_names():
    watch = (ROOT / 'v2/home/desktop-board-shell-tune.css').read_text(encoding='utf-8')
    computer = (ROOT / 'v2/home/inline-computer.css').read_text(encoding='utf-8')
    computer_js = (ROOT / 'v2/home/inline-computer.mjs').read_text(encoding='utf-8')
    online = (ROOT / 'v2/home/inline-play.css').read_text(encoding='utf-8')
    matches = (ROOT / 'watch.html').read_text(encoding='utf-8')
    home = (ROOT / 'index.html').read_text(encoding='utf-8')

    assert '--watch-avatar-size:' in watch
    assert 'width:var(--watch-avatar-size);height:var(--watch-avatar-size)' in watch
    assert 'grid-template-columns:var(--watch-avatar-size)' in watch
    assert 'color:#D8B665!important' in watch
    assert '--computer-avatar-size:' in computer
    assert 'width:var(--computer-avatar-size);height:var(--computer-avatar-size)' in computer
    assert 'grid-template-columns:var(--computer-avatar-size)' in computer
    assert 'color:#D8B665!important' in computer
    assert 'inline-computer.css?v=20261018-gold-square-portraits-v1' in computer_js
    assert 'aspect-ratio:1/1;border-radius:0' in online
    assert 'color:#D8B665!important' in online
    assert '.match-table .player-pair strong,.match-table .player-pair .player-profile-action{color:#D8B665!important}' in matches
    assert 'content="20261018-gold-square-portraits-v1"' in home
