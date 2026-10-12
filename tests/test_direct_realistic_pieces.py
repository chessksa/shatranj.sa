from pathlib import Path

assets = Path('assets/pieces')
codes = {'w'+t for t in 'kqbnrp'} | {'b'+t for t in 'kqbnrp'}
actual = {p.stem for p in assets.glob('*.png')}
assert actual == codes, f'Unexpected or missing piece art: {sorted(actual.symmetric_difference(codes))}'
assert (assets / 'shatranj-approved-20260904.svg').exists()
for old in ('approved-dark-20260904.png','approved-light-20260904.png','shatranj-3d-staunton.svg','shatranj-3d-staunton-v2.svg','shatranj-3d-staunton-v3.svg','shatranj-approved.svg'):
    assert not (assets / old).exists(), old
assert not Path('dubrovnik-pieces.css').exists()
assert not Path('v2/home/desktop-board-preview-pieces.css').exists()
assert 'desktop-board-preview-piece' in Path('v2/home/desktop-board-shell.mjs').read_text(encoding='utf-8')
print('one approved artwork set; legacy attempts removed: PASS')
