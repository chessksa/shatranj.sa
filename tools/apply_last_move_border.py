from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f"missing patch target: {label}")
    return text.replace(old, new, 1)


def patch(path, replacements):
    file_path = ROOT / path
    text = file_path.read_text(encoding="utf-8")
    for old, new, label in replacements:
        text = replace_once(text, old, new, label)
    file_path.write_text(text, encoding="utf-8")


LIVE_MARKER_IMPORT = "import {Markers} from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/extensions/markers/Markers.js';"
COMPUTER_MARKER_IMPORT = "import { Markers } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/extensions/markers/Markers.js';"

patch(
    "play-v8.js",
    [
        (
            "import {Chessboard, COLOR, INPUT_EVENT_TYPE, BORDER_TYPE} from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/Chessboard.js';\n",
            "import {Chessboard, COLOR, INPUT_EVENT_TYPE, BORDER_TYPE} from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/Chessboard.js';\n" + LIVE_MARKER_IMPORT + "\n",
            "live Markers import",
        ),
        (
            "import { inferLastMoveFromFens, squareOverlayPosition } from './last-move-highlight.mjs?v=20260908-1';\n",
            "import { inferLastMoveFromFens } from './last-move-highlight.mjs?v=20260908-1';\n\nconst LAST_MOVE_MARKER = { class: 'marker-frame-last-move', slice: 'markerFrame', position: 'above' };\n",
            "live last-move helper import",
        ),
        (
            "function clearLastMoveHighlight(){\n  if(!moveHintsEl) return;\n  moveHintsEl.querySelectorAll('.last-move-highlight').forEach((marker)=>marker.remove());\n}\n\nfunction renderLastMoveHighlight(){\n  clearLastMoveHighlight();\n  if(!moveHintsEl || !lastMove?.from || !lastMove?.to || isReviewingPast()) return;\n  [lastMove.from,lastMove.to].forEach((square,index)=>{\n    const pos=squareOverlayPosition(square,flipped);\n    if(!pos) return;\n    const marker=document.createElement('span');\n    marker.className='last-move-highlight';\n    marker.dataset.square=square;\n    marker.dataset.moveEnd=index===0?'from':'to';\n    marker.style.left=`${pos.left}%`;\n    marker.style.top=`${pos.top}%`;\n    moveHintsEl.appendChild(marker);\n  });\n}\n",
            "function clearLastMoveHighlight(){\n  const board=cmBoard;\n  if(!board?.removeMarkers) return;\n  board.removeMarkers(LAST_MOVE_MARKER);\n}\n\nfunction renderLastMoveHighlight(){\n  const board=cmBoard;\n  clearLastMoveHighlight();\n  if(!board?.addMarker || !lastMove?.from || !lastMove?.to || isReviewingPast()) return;\n  board.addMarker(LAST_MOVE_MARKER,lastMove.from);\n  board.addMarker(LAST_MOVE_MARKER,lastMove.to);\n}\n",
            "live native marker renderer",
        ),
        (
            "    assetsUrl:'assets/',\n    style:{",
            "    assetsUrl:'assets/',\n    extensions:[{class:Markers,props:{autoMarkers:null,sprite:'last-move-markers.svg'}}],\n    style:{",
            "live Markers extension",
        ),
    ],
)

patch(
    "play-computer.js",
    [
        (
            "import { Chessboard, COLOR, INPUT_EVENT_TYPE, BORDER_TYPE } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/Chessboard.js';\n",
            "import { Chessboard, COLOR, INPUT_EVENT_TYPE, BORDER_TYPE } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/Chessboard.js';\n" + COMPUTER_MARKER_IMPORT + "\n",
            "computer Markers import",
        ),
        (
            "import { inferLastMoveFromFens, squareOverlayPosition } from './last-move-highlight.mjs?v=20260908-1';\n",
            "import { inferLastMoveFromFens } from './last-move-highlight.mjs?v=20260908-1';\n\nconst LAST_MOVE_MARKER = { class: 'marker-frame-last-move', slice: 'markerFrame', position: 'above' };\n",
            "computer last-move helper import",
        ),
        (
            "function clearLastMoveHighlight() {\n  if (!moveHintsEl) return;\n  moveHintsEl.querySelectorAll('.last-move-highlight').forEach((marker) => marker.remove());\n}\n\nfunction renderLastMoveHighlight() {\n  clearLastMoveHighlight();\n  if (!moveHintsEl || !lastMove?.from || !lastMove?.to || isComputerReviewingPast()) return;\n  [lastMove.from, lastMove.to].forEach((square, index) => {\n    const pos = squareOverlayPosition(square, false);\n    if (!pos) return;\n    const marker = document.createElement('span');\n    marker.className = 'last-move-highlight';\n    marker.dataset.square = square;\n    marker.dataset.moveEnd = index === 0 ? 'from' : 'to';\n    marker.style.left = `${pos.left}%`;\n    marker.style.top = `${pos.top}%`;\n    moveHintsEl.appendChild(marker);\n  });\n}\n",
            "function clearLastMoveHighlight() {\n  const board = cmBoard;\n  if (!board?.removeMarkers) return;\n  board.removeMarkers(LAST_MOVE_MARKER);\n}\n\nfunction renderLastMoveHighlight() {\n  const board = cmBoard;\n  clearLastMoveHighlight();\n  if (!board?.addMarker || !lastMove?.from || !lastMove?.to || isComputerReviewingPast()) return;\n  board.addMarker(LAST_MOVE_MARKER, lastMove.from);\n  board.addMarker(LAST_MOVE_MARKER, lastMove.to);\n}\n",
            "computer native marker renderer",
        ),
        (
            "    assetsUrl: 'assets/',\n    style: {",
            "    assetsUrl: 'assets/',\n    extensions: [{ class: Markers, props: { autoMarkers: null, sprite: 'last-move-markers.svg' } }],\n    style: {",
            "computer Markers extension",
        ),
    ],
)

patch(
    "play-v10.html",
    [
        (
            ".last-move-highlight{position:absolute;width:12.5%;height:12.5%;background:rgba(255,180,90,.10);box-shadow:inset 0 0 0 3px rgba(255,180,90,.95),inset 0 0 10px rgba(255,180,90,.18);pointer-events:none;z-index:0}",
            ".cm-board-host .cm-chessboard .markers .marker.marker-frame-last-move{stroke:#ffb45a!important;stroke-width:3.6px!important;stroke-linecap:round;stroke-linejoin:round;opacity:1!important;fill:none!important;filter:drop-shadow(0 0 1px rgba(255,180,90,.85))}",
            "native marker style",
        ),
        (
            "play-computer.js?v=20260908-lastmove1",
            "play-computer.js?v=20260908-lastmove2",
            "computer cache bust",
        ),
        (
            "play-v8.js?v=20260908-lastmove1",
            "play-v8.js?v=20260908-lastmove2",
            "live cache bust",
        ),
    ],
)

sprite = '''<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <g id="markerFrame" fill="none">
    <rect x="2" y="2" width="36" height="36" rx="1.5" ry="1.5"/>
  </g>
</svg>
'''
asset = ROOT / "assets" / "last-move-markers.svg"
asset.write_text(sprite, encoding="utf-8")

print("native cm-chessboard last-move markers applied")
