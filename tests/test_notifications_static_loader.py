from pathlib import Path

wrapper = Path('site-notifications.js').read_text(encoding='utf-8')
source = Path('site-notifications-original.js').read_text(encoding='utf-8')


def test_notifications_use_direct_script_without_dynamic_source_patching():
    assert 'loadCurrentNotifications().finally(' in wrapper
    assert "script.src = 'site-notifications-original.js?v='" in wrapper
    assert 'loadOriginalPatched' not in wrapper
    assert '(0, eval)' not in wrapper
    assert 'fetch(ORIGINAL_SRC' not in wrapper
    assert 'const fallbackOld = ' not in wrapper
    assert 'const fallbackNew = ' not in wrapper


def test_static_notification_runtime_has_final_approved_fixes():
    assert 'const MOBILE_RANKING_LIMIT = 10;' in source
    assert "style.id = 'mobileRankingTenStyles';" in source
    assert "track.className = 'welcome-ticker-track tournament-ticker-single';" in source
    assert 'track.replaceChildren(buildFallbackGroup(), buildFallbackGroup());' in source
    assert "document.currentScript?.src || location.href" in source
    assert 'const MOBILE_RANKING_LIMIT = 5;' not in source
