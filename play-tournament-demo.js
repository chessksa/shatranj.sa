import { Chessboard, COLOR, BORDER_TYPE } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/Chessboard.js';

const $ = (id) => document.getElementById(id);
const board = $('board');
const tournamentGameBadge = $('tournamentGameBadge');
const tournamentGameName = $('tournamentGameName');
const tournamentGameRound = $('tournamentGameRound');
const opponentSearchPanel = $('opponentSearchPanel');
const topPlayerLive = $('topPlayerLive');
const topName = $('topName');
const bottomName = $('bottomName');
const topLocation = $('topLocation');
const bottomLocation = $('bottomLocation');
const topRating = $('topRating');
const bottomRating = $('bottomRating');
const topClock = $('topClock');
const bottomClock = $('bottomClock');
const resignBtn = $('resignBtn');
const drawOffer = $('drawOffer');
const endGraceBtn = $('endGraceBtn');
const reportBtn = $('reportBtn');
const leaveBtn = $('leaveBtn');
const leaveText = $('leaveText');
const coordsLeft = $('coordsLeft');
const coordsBottom = $('coordsBottom');
const sideHeadStack = document.querySelector('.side-head-stack');

function ensureCmStyles(){
  if(!document.querySelector('link[data-cm-chessboard-core]')){
    const core=document.createElement('link');
    core.rel='stylesheet';
    core.href='https://cdn.jsdelivr.net/npm/cm-chessboard@8/assets/chessboard.css';
    core.dataset.cmChessboardCore='1';
    document.head.appendChild(core);
  }
  if(!document.querySelector('link[data-cm-chessboard-shatranj]')){
    const theme=document.createElement('link');
    theme.rel='stylesheet';
    theme.href='cm-chessboard-shatranj-v3.css?v=20260904-3';
    theme.dataset.cmChessboardShatranj='1';
    document.head.appendChild(theme);
  }
}

function renderCoords(){
  if(coordsLeft){
    coordsLeft.replaceChildren(...[8,7,6,5,4,3,2,1].map(value=>{
      const el=document.createElement('div');el.textContent=String(value);return el;
    }));
  }
  if(coordsBottom){
    coordsBottom.replaceChildren(...['a','b','c','d','e','f','g','h'].map(value=>{
      const el=document.createElement('div');el.textContent=value;return el;
    }));
  }
}

if(sideHeadStack && tournamentGameBadge && tournamentGameBadge.parentElement !== sideHeadStack) sideHeadStack.appendChild(tournamentGameBadge);
if(tournamentGameBadge) tournamentGameBadge.hidden = false;
if(tournamentGameName) tournamentGameName.textContent = 'البداية';
if(tournamentGameRound) tournamentGameRound.textContent = 'نصف النهائي';
if(opponentSearchPanel) opponentSearchPanel.hidden = true;
if(topPlayerLive) topPlayerLive.hidden = false;

if(topName) topName.textContent = 'اللاعب الأول';
if(bottomName) bottomName.textContent = 'اللاعب الثاني';
if(topLocation) topLocation.textContent = 'الرياض';
if(bottomLocation) bottomLocation.textContent = 'جدة';
if(topRating) topRating.textContent = '1540';
if(bottomRating) bottomRating.textContent = '1512';
if(topClock) topClock.textContent = '05:00';
if(bottomClock) bottomClock.textContent = '05:00';

[resignBtn,drawOffer,endGraceBtn].forEach(button=>{if(button) button.disabled=true;});
if(reportBtn) reportBtn.hidden=true;
if(leaveText) leaveText.textContent='العودة للبطولات';
if(leaveBtn) leaveBtn.addEventListener('click',()=>{location.href='tournaments.html';});

document.title='مثال مباراة بطولة | شطرنج العرب';
renderCoords();
ensureCmStyles();

if(board){
  board.className='cm-board-host';
  new Chessboard(board,{
    position:'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    orientation:COLOR.white,
    responsive:true,
    assetsUrl:'assets/',
    style:{
      cssClass:'shatranj',
      showCoordinates:false,
      borderType:BORDER_TYPE.none,
      pieces:{file:'pieces/shatranj-approved-20260904.svg?v=20260905-3',tileSize:40},
      animationDuration:0
    }
  });
}
