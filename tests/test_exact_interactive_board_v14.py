from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_exact_interactive_board_assets_and_wiring():
    html = (ROOT / 'play-v10.html').read_text(encoding='utf-8')
    css = ROOT / 'exact-board-v14.css'
    js = ROOT / 'exact-board-v14.js'
    asset_dir = ROOT / 'assets' / 'exact-board-v14'

    assert css.exists(), 'exact-board-v14.css must exist'
    assert js.exists(), 'exact-board-v14.js must exist'
    assert 'exact-board-v14.css?v=20260903-14' in html
    assert 'exact-board-v14.js?v=20260903-14' in html
    assert 'exact-board-v13.js' not in html

    required = {
        'board-empty.webp',
        'wk.png','wq.png','wr.png','wb.png','wn.png','wp.png',
        'bk.png','bq.png','br.png','bb.png','bn.png','bp.png',
    }
    present = {p.name for p in asset_dir.glob('*')} if asset_dir.exists() else set()
    assert required <= present, f'missing exact board assets: {sorted(required - present)}'

    css_text = css.read_text(encoding='utf-8')
    js_text = js.read_text(encoding='utf-8')
    assert 'approved-board-v13.webp' not in css_text
    assert 'exact-board-preview' not in css_text
    assert 'exact-board-preview' not in js_text
    assert 'board-empty.webp' in css_text
    for piece in sorted(required - {'board-empty.webp'}):
        assert piece in js_text
