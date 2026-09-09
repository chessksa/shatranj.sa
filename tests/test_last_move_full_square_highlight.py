from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SVG_PATH = ROOT / 'assets' / 'last-move-markers.svg'
SW_PATH = ROOT / 'sw.js'

root = ET.fromstring(SVG_PATH.read_text(encoding='utf-8'))
ns = {'svg': 'http://www.w3.org/2000/svg'}
marker = root.find("svg:g[@id='markerFrame']", ns)
assert marker is not None, 'last-move markerFrame slice must exist'
rect = marker.find('svg:rect', ns)
assert rect is not None, 'last-move marker must be a rectangle'

assert rect.get('x') == '0' and rect.get('y') == '0', 'highlight must start at the square edges'
assert rect.get('width') == '40' and rect.get('height') == '40', 'highlight must cover the entire 40x40 square'
assert rect.get('fill') == '#ff8a8a', 'highlight must use the approved light red fill'
opacity = float(rect.get('fill-opacity') or '1')
assert 0.20 <= opacity <= 0.40, 'light red must remain translucent so the piece stays clear'
assert rect.get('stroke') in ('none', None), 'highlight must not render an outline/frame'

sw = SW_PATH.read_text(encoding='utf-8')
assert '/assets/last-move-markers.svg' in sw, 'service worker must always fetch the marker asset fresh'

print('last move full light-red square highlight: PASS')
