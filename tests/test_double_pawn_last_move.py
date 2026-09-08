from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def run_node(source):
    helper = (ROOT / 'last-move-highlight.mjs').resolve().as_uri()
    source = source.replace('__HELPER__', helper)
    with tempfile.NamedTemporaryFile('w', suffix='.mjs', delete=False, encoding='utf-8') as handle:
        handle.write(source)
        path = handle.name
    result = subprocess.run(['node', path], capture_output=True, text=True)
    if result.returncode:
        raise AssertionError(result.stdout + result.stderr)


def test_double_pawn_server_normalization_is_same_position():
    run_node(r'''
import {fenPositionKey} from '__HELPER__';
const local = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
const server = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
if (fenPositionKey(local) !== fenPositionKey(server)) {
  throw new Error('en-passant normalization must not create a fake new move');
}
''')


def test_live_and_computer_compare_position_keys_not_full_fen():
    live = (ROOT / 'play-v8.js').read_text(encoding='utf-8')
    computer = (ROOT / 'play-computer.js').read_text(encoding='utf-8')

    assert 'fenPositionKey' in live.split('\n', 5)[3], 'live game must import fenPositionKey'
    assert 'fenPositionKey(previousFen)!==fenPositionKey(row.fen)' in live.replace(' ', ''), \
        'live game must ignore server-only en-passant FEN normalization'

    assert 'fenPositionKey' in computer.split('\n', 5)[3], 'computer game must import fenPositionKey'
    assert 'fenPositionKey(previousFen)!==fenPositionKey(fen)' in computer.replace(' ', ''), \
        'computer game must ignore server-only en-passant FEN normalization'


def test_normal_orange_highlight_everywhere():
    orange = '#ff8a24'
    page = (ROOT / 'play-v10.html').read_text(encoding='utf-8')
    legacy = (ROOT / 'play.html').read_text(encoding='utf-8')

    assert f'stroke:{orange}!important;stroke-width:2px!important' in page
    assert f'border:2px solid {orange};box-shadow:none' in page
    square = f'.square.capture::after{{content:"";position:absolute;inset:8px;border:2px solid {orange};border-radius:50%}}'
    assert square in page
    assert square in legacy
    assert '#ffb347' not in page[page.index('.move-hint.capture::after'):page.index('@media(max-width:900px)', page.index('.move-hint.capture::after'))]


def test_cache_busts_for_fen_fix():
    page = (ROOT / 'play-v10.html').read_text(encoding='utf-8')
    assert 'play-v8.js?v=20260909-pawnhighlight1' in page
    assert 'play-computer.js?v=20260909-pawnhighlight1' in page


if __name__ == '__main__':
    test_double_pawn_server_normalization_is_same_position()
    test_live_and_computer_compare_position_keys_not_full_fen()
    test_normal_orange_highlight_everywhere()
    test_cache_busts_for_fen_fix()
    print('double pawn last-move highlight and orange style: PASS')
