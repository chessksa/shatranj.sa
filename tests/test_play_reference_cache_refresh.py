from pathlib import Path


def test_mobile_reference_assets_are_network_first_and_cache_is_bumped():
    sw = Path('sw.js').read_text(encoding='utf-8')
    assert 'const CACHE="shatranj-arab-v14"' in sw
    for asset in (
        '/exact-board-v13.js',
        '/play-reference-mobile-v14.css',
        '/play-reference-history-v14.mjs',
    ):
        assert asset in sw
