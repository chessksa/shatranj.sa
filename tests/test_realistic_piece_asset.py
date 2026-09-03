from pathlib import Path
import struct
import zlib

png = Path('assets/realistic-pieces.png').read_bytes()
assert png[:8] == b'\x89PNG\r\n\x1a\n', 'realistic piece asset must be a PNG'

pos = 8
ihdr = None
idat = bytearray()
while pos < len(png):
    size = struct.unpack('>I', png[pos:pos+4])[0]
    kind = png[pos+4:pos+8]
    payload = png[pos+8:pos+8+size]
    pos += 12 + size
    if kind == b'IHDR':
        ihdr = payload
    elif kind == b'IDAT':
        idat.extend(payload)
    elif kind == b'IEND':
        break

assert ihdr is not None, 'PNG must contain IHDR'
width, height = struct.unpack('>II', ihdr[:8])
assert (width, height) == (768, 256), f'unexpected sprite dimensions: {(width, height)}'
assert zlib.decompress(bytes(idat)), 'PNG IDAT stream must decode successfully'

css = Path('realistic-pieces.css').read_text(encoding='utf-8')
assert 'assets/realistic-pieces.png?v=20260903-2' in css, 'CSS must request the repaired asset with a fresh cache key'

print('realistic piece asset: PASS')
