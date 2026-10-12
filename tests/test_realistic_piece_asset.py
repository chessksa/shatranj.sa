from pathlib import Path
import struct

folder = Path('assets/pieces')
codes = ('wr','wn','wb','wq','wk','wp','br','bn','bb','bq','bk','bp')
for code in codes:
    p = folder / f'{code}.png'
    data = p.read_bytes()
    assert data[:8] == bytes((137,80,78,71,13,10,26,10)), p
    assert len(data) > 1000, p
    width,height = struct.unpack('>II',data[16:24])
    assert width > 0 and height > 0, p
assert not (Path('assets') / 'realistic-pieces.png').exists()
print('twelve independent approved PNG pieces verified')
