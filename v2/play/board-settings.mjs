import { loadBoardPreferences, saveBoardPreferences, applyBoardPreferences, renderThemePicker } from '../board/controller.mjs';
import { getGameState } from './api.js';

const board = document.getElementById('v2-board');
const openButton = document.getElementById('v2-board-settings');
const modal = document.getElementById('v2-settings-modal');
const closeButtons = [...document.querySelectorAll('[data-close-v2-settings]')];
const picker = document.getElementById('v2-play-theme-picker');
const coordinates = document.getElementById('v2-play-coordinates');
const animation = document.getElementById('v2-play-animation');
const moveMethod = document.getElementById('v2-play-move-method');
const legal = document.getElementById('v2-play-legal');
const whiteBottom = document.getElementById('v2-play-white-bottom');
let prefs = loadBoardPreferences();
let observer = null;
let dragSource = null;
let allowSyntheticClick = false;
let legalGeneration = 0;
let ChessClass = null;

async function loadChess(){
  if (ChessClass) return ChessClass;
  const module = await import('https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm');
  ChessClass = module.Chess;
  return ChessClass;
}

function gameId(){ return new URLSearchParams(location.search).get('game'); }
function visualOrientation(){ return board?.firstElementChild?.dataset.square === 'h1' ? 'b' : 'w'; }

function decorateCoordinates(){
  if (!board) return;
  const orientation = visualOrientation();
  for (const square of board.querySelectorAll('.v2-square')) {
    const name = square.dataset.square || '';
    square.removeAttribute('data-rank-label');
    square.removeAttribute('data-file-label');
    if (prefs.coordinates === 'off' || name.length !== 2) continue;
    const file=name[0], rank=name[1];
    if ((orientation==='w' && file==='a') || (orientation==='b' && file==='h')) square.dataset.rankLabel=rank;
    if ((orientation==='w' && rank==='1') || (orientation==='b' && rank==='8')) square.dataset.fileLabel=file;
  }
}

function clearLegalTargets(){
  board?.querySelectorAll('.legal-target').forEach((square)=>square.classList.remove('legal-target'));
}

async function refreshLegalTargets(){
  const generation=++legalGeneration;
  clearLegalTargets();
  if (!prefs.showLegalMoves || !board) return;
  const selected=board.querySelector('.v2-square.selected')?.dataset.square;
  const id=gameId();
  if (!selected || !id) return;
  try {
    const [game, Chess] = await Promise.all([getGameState(id), loadChess()]);
    if (generation!==legalGeneration || !game?.fen) return;
    const chess=new Chess(game.fen);
    for (const move of chess.moves({square:selected,verbose:true})) {
      board.querySelector(`.v2-square[data-square="${move.to}"]`)?.classList.add('legal-target');
    }
  } catch {
    clearLegalTargets();
  }
}

function syncControls(){
  applyBoardPreferences(board,prefs);
  if(coordinates) coordinates.value=prefs.coordinates;
  if(animation) animation.value=prefs.animation;
  if(moveMethod) moveMethod.value=prefs.moveMethod;
  if(legal) legal.checked=prefs.showLegalMoves;
  if(whiteBottom) whiteBottom.checked=prefs.whiteAlwaysBottom;
  decorateCoordinates();
  void refreshLegalTargets();
}

function renderPicker(){
  if (!picker) return;
  renderThemePicker(picker,prefs.theme,(theme)=>persist({theme}));
}
function persist(patch){
  prefs=saveBoardPreferences({...prefs,...patch});
  syncControls();renderPicker();
}
function openModal(){ if(modal){modal.hidden=false;renderPicker();syncControls();} }
function closeModal(){ if(modal) modal.hidden=true; }

openButton?.addEventListener('click',openModal);
closeButtons.forEach((button)=>button.addEventListener('click',closeModal));
modal?.addEventListener('click',(event)=>{if(event.target===modal)closeModal()});
document.addEventListener('keydown',(event)=>{if(event.key==='Escape')closeModal()});
coordinates?.addEventListener('change',()=>persist({coordinates:coordinates.value}));
animation?.addEventListener('change',()=>persist({animation:animation.value}));
moveMethod?.addEventListener('change',()=>persist({moveMethod:moveMethod.value}));
legal?.addEventListener('change',()=>persist({showLegalMoves:legal.checked}));
whiteBottom?.addEventListener('change',()=>persist({whiteAlwaysBottom:whiteBottom.checked}));

board?.addEventListener('click',(event)=>{
  if(prefs.moveMethod==='drag' && !allowSyntheticClick){event.preventDefault();event.stopImmediatePropagation()}
},true);
board?.addEventListener('pointerdown',(event)=>{
  if(prefs.moveMethod==='click') return;
  const square=event.target.closest('.v2-square');
  if(square) dragSource=square.dataset.square;
});
board?.addEventListener('pointerup',(event)=>{
  if(prefs.moveMethod==='click' || !dragSource) return;
  const target=event.target.closest('.v2-square')?.dataset.square;
  const source=dragSource;dragSource=null;
  if(!target || target===source) return;
  const sourceEl=board.querySelector(`.v2-square[data-square="${source}"]`);
  const targetEl=board.querySelector(`.v2-square[data-square="${target}"]`);
  if(!sourceEl||!targetEl) return;
  allowSyntheticClick=true;
  sourceEl.click();targetEl.click();
  queueMicrotask(()=>{allowSyntheticClick=false});
});

if(board){
  observer=new MutationObserver(()=>{decorateCoordinates();void refreshLegalTargets()});
  observer.observe(board,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
}
syncControls();renderPicker();
window.addEventListener('storage',(event)=>{if(event.key==='shatranj:v2:board-preferences'){prefs=loadBoardPreferences();syncControls();renderPicker()}});
window.addEventListener('pagehide',()=>observer?.disconnect());
