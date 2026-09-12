import { loadBoardPreferences, saveBoardPreferences, applyBoardPreferences, renderThemePicker } from './controller.mjs';

const board = document.getElementById('v2-settings-preview-board');
const picker = document.getElementById('v2-settings-theme-picker');
const status = document.getElementById('v2-settings-status');
const coordinates = document.getElementById('v2-setting-coordinates');
const animation = document.getElementById('v2-setting-animation');
const moveMethod = document.getElementById('v2-setting-move-method');
const legal = document.getElementById('v2-setting-legal');
const whiteBottom = document.getElementById('v2-setting-white-bottom');
let prefs = loadBoardPreferences();

const back = ['r','n','b','q','k','b','n','r'];
function pieceAt(rank,file){
  if(rank===8) return ['b',back[file]];
  if(rank===7) return ['b','p'];
  if(rank===2) return ['w','p'];
  if(rank===1) return ['w',back[file]];
  return null;
}
function renderPreview(){
  const fragment=document.createDocumentFragment();
  for(let rank=8;rank>=1;rank--){
    for(let file=0;file<8;file++){
      const sq=document.createElement('div');
      sq.className=`preview-square ${(file+rank)%2===1?'light':'dark'}`;
      const name=`${String.fromCharCode(97+file)}${rank}`;
      if((rank===1)||(file===0)) sq.dataset.coordinate = name;
      const piece=pieceAt(rank,file);
      if(piece){const img=document.createElement('img');img.src=`assets/pieces/${piece[0]}${piece[1]}.png`;img.alt='';sq.appendChild(img)}
      fragment.appendChild(sq);
    }
  }
  board.replaceChildren(fragment);
}
function syncControls(){
  coordinates.value=prefs.coordinates;
  animation.value=prefs.animation;
  moveMethod.value=prefs.moveMethod;
  legal.checked=prefs.showLegalMoves;
  whiteBottom.checked=prefs.whiteAlwaysBottom;
  applyBoardPreferences(board,prefs);
  board.dataset.coordinates=prefs.coordinates;
}
function persist(patch){
  prefs=saveBoardPreferences({...prefs,...patch});
  syncControls();
  renderThemePicker(picker,prefs.theme,(theme)=>persist({theme}));
  status.textContent='تم حفظ الإعدادات';
  clearTimeout(persist.timer);persist.timer=setTimeout(()=>{status.textContent=''},1200);
}
renderPreview();syncControls();renderThemePicker(picker,prefs.theme,(theme)=>persist({theme}));
coordinates.addEventListener('change',()=>persist({coordinates:coordinates.value}));
animation.addEventListener('change',()=>persist({animation:animation.value}));
moveMethod.addEventListener('change',()=>persist({moveMethod:moveMethod.value}));
legal.addEventListener('change',()=>persist({showLegalMoves:legal.checked}));
whiteBottom.addEventListener('change',()=>persist({whiteAlwaysBottom:whiteBottom.checked}));
