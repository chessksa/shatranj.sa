import { loadBoardPreferences } from './controller.mjs';
import { getBoardTheme } from './themes.mjs';

const board=document.querySelector('.board');
if(board){
  let prefs=loadBoardPreferences();
  const apply=()=>{
    prefs=loadBoardPreferences();
    const theme=getBoardTheme(prefs.theme);
    board.dataset.boardTheme=prefs.theme;
    board.querySelectorAll('.square.light').forEach(square=>{square.style.background=theme.light;square.style.borderColor=theme.line||''});
    board.querySelectorAll('.square.dark').forEach(square=>{square.style.background=theme.dark;square.style.borderColor=theme.line||''});
    const left=document.querySelector('.coords-left');
    const bottom=document.querySelector('.coords-bottom');
    const show=prefs.coordinates!=='off';
    if(left) left.style.display=show?'grid':'none';
    if(bottom) bottom.style.display=show?'grid':'none';
  };
  apply();
  const observer=new MutationObserver(apply);
  observer.observe(board,{childList:true,subtree:true});
  window.addEventListener('storage',(event)=>{if(event.key==='shatranj:v2:board-preferences')apply()});
  window.addEventListener('pagehide',()=>observer.disconnect());

  const host=document.querySelector('.side-header-actions');
  if(host && !host.querySelector('.v2-legacy-board-settings')){
    const link=document.createElement('a');
    link.href='settings-v2.html';
    link.className='side-icon-btn v2-legacy-board-settings';
    link.textContent='الرقعة';
    link.style.display='grid';link.style.placeItems='center';link.style.textDecoration='none';
    host.prepend(link);
  }
}
