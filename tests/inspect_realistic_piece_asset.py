from pathlib import Path
import struct, zlib

p = Path('assets/realistic-pieces.png')
data = p.read_bytes()
assert data[:8] == b'\x89PNG\r\n\x1a\n', 'not a PNG'
pos = 8
chunks = []
idat = bytearray()
ihdr = None
trns = None
palette = None
while pos < len(data):
    n = struct.unpack('>I', data[pos:pos+4])[0]
    typ = data[pos+4:pos+8]
    payload = data[pos+8:pos+8+n]
    pos += 12 + n
    chunks.append(typ.decode('ascii'))
    if typ == b'IHDR': ihdr = payload
    elif typ == b'IDAT': idat.extend(payload)
    elif typ == b'tRNS': trns = payload
    elif typ == b'PLTE': palette = payload
    elif typ == b'IEND': break

w,h,bit_depth,color_type,compression,filter_method,interlace = struct.unpack('>IIBBBBB', ihdr)
print('PNG', w, h, 'bit_depth', bit_depth, 'color_type', color_type, 'interlace', interlace, 'bytes', len(data))
assert interlace == 0, 'diagnostic supports non-interlaced PNG only'
assert bit_depth == 8, 'diagnostic expects 8-bit PNG'
channels = {0:1,2:3,3:1,4:2,6:4}[color_type]
bpp = channels
raw = zlib.decompress(bytes(idat))
stride = w * channels
assert len(raw) == h * (stride + 1), (len(raw), h*(stride+1))
rows = []
prev = bytearray(stride)
off = 0

def paeth(a,b,c):
    p = a+b-c
    pa,pb,pc = abs(p-a),abs(p-b),abs(p-c)
    return a if pa <= pb and pa <= pc else (b if pb <= pc else c)

for y in range(h):
    ft = raw[off]; off += 1
    scan = bytearray(raw[off:off+stride]); off += stride
    recon = bytearray(stride)
    for i,x in enumerate(scan):
        a = recon[i-bpp] if i >= bpp else 0
        b = prev[i]
        c = prev[i-bpp] if i >= bpp else 0
        if ft == 0: val = x
        elif ft == 1: val = (x+a)&255
        elif ft == 2: val = (x+b)&255
        elif ft == 3: val = (x+((a+b)//2))&255
        elif ft == 4: val = (x+paeth(a,b,c))&255
        else: raise AssertionError(f'unknown filter {ft}')
        recon[i]=val
    rows.append(recon); prev = recon

visible = 0
nonwhite = 0
alphas = []
for row in rows:
    for x in range(w):
        px = row[x*channels:(x+1)*channels]
        if color_type == 6:
            r,g,b,a = px
        elif color_type == 4:
            g,a = px; r=b=g
        elif color_type == 2:
            r,g,b = px; a=255
        elif color_type == 0:
            g=px[0]; r=b=g; a=255
        elif color_type == 3:
            idx=px[0]
            r,g,b = palette[idx*3:idx*3+3]
            a = trns[idx] if trns and idx < len(trns) else 255
        alphas.append(a)
        if a: visible += 1
        if a and (r < 245 or g < 245 or b < 245): nonwhite += 1
print('visible_pixels', visible, 'nonwhite_visible', nonwhite, 'alpha_min', min(alphas), 'alpha_max', max(alphas))
print('chunks', chunks)
assert visible > (w*h)//100, 'asset is effectively transparent'
assert nonwhite > (w*h)//1000, 'asset has no meaningful visible piece content'
