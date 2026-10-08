from pathlib import Path

read=lambda path:Path(path).read_text(encoding='utf-8')

def test_home_refresh_cannot_restore_old_app_shell():
    boot=read('index.html')
    worker=read('sw.js')
    legacy=read('app.js')
    assert "type==='reload'" in boot
    assert "'-reload-'+Date.now()" in boot
    assert "fetch('./index-app.html?v='+runtimeVersion,{cache:'no-store'})" in boot
    assert "getRegistrations()" in boot
    assert "key.startsWith('shatranj-arab-')" in boot
    assert "legacyCleanupKey" not in boot
    assert "self.registration.unregister()" in worker
    assert "addEventListener('fetch'" not in worker
    assert "navigator.serviceWorker.register" not in legacy

def test_theme_base_and_every_desktop_layer_share_the_live_version():
    boot=read('index.html')
    app=read('index-app.html')
    theme=read('home-theme.css')
    dashboard=read('v2/home/dashboard.mjs')
    shell=read('v2/home/desktop-board-shell.mjs')
    tune=read('v2/home/desktop-board-shell-tune.mjs')
    inline=read('v2/home/inline-play.mjs')
    assert 'name="shatranj-asset-version"' in boot
    assert 'home-theme-base.css?v=' in app
    assert app.index('home-theme-base.css?v=') < app.index('home-theme.css?v=')
    assert '@import url("./home-theme-base.css' not in theme
    assert 'homeAssetVersion' in dashboard
    assert 'desktopAssetVersion' in shell
    assert 'tuneAssetVersion' in tune
    assert 'inlineVersion' in inline
    assert 'desktop-sidebar-cleanup.css?v=${tuneAssetVersion}' in tune
    assert 'desktop-board-shell.mjs?v=${homeAssetVersion}' in dashboard
