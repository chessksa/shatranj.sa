import { loadBoardPreferences, saveBoardPreferences, applyBoardPreferences, renderThemePicker } from './controller.mjs?v=20261013-live-home-board-v1';

const picker=document.getElementById('v2-settings-theme-picker');
const status=document.getElementById('v2-settings-status');
const coordinates=document.getElementById('v2-setting-coordinates');
const animation=document.getElementById('v2-setting-animation');
const moveMethod=document.getElementById('v2-setting-move-method');
const legal=document.getElementById('v2-setting-legal');
const whiteBottom=document.getElementById('v2-setting-white-bottom');
let prefs=loadBoardPreferences();
let statusTimer=null;

function notifyHomeBoard(){
  // The settings page runs in a same-origin panel on desktop. The parent reacts
  // immediately; cross-tab or separate-page updates also propagate via storage.
  if(window.parent!==window){
    window.parent.postMessage({type:'shatranj:board-preferences-updated'},window.location.origin);
  }
}

function syncControls(){
  coordinates.value=prefs.coordinates;
  animation.value=prefs.animation;
  moveMethod.value=prefs.moveMethod;
  legal.checked=prefs.showLegalMoves;
  whiteBottom.checked=prefs.whiteAlwaysBottom;
  applyBoardPreferences(document.documentElement,prefs);
}

function persist(patch){
  try{
    prefs=saveBoardPreferences({...prefs,...patch});
    syncControls();
    renderThemePicker(picker,prefs.theme,theme=>persist({theme}));
    notifyHomeBoard();
    if(status){
      status.classList.remove('error');
      status.textContent=Object.hasOwn(patch,'theme')
        ? 'تم تطبيق اللون على الرقعة الرئيسية وحفظه.'
        : 'تم حفظ إعدادات اللعب.';
    }
  }catch(error){
    console.error('تعذر حفظ إعدادات الرقعة',error);
    if(status){
      status.classList.add('error');
      status.textContent='تعذر حفظ الإعدادات؛ حاول مجددًا.';
    }
  }
  clearTimeout(statusTimer);
  statusTimer=setTimeout(()=>{if(status)status.textContent='';},2500);
}

if(picker){
  syncControls();
  renderThemePicker(picker,prefs.theme,theme=>persist({theme}));
}
coordinates?.addEventListener('change',()=>persist({coordinates:coordinates.value}));
animation?.addEventListener('change',()=>persist({animation:animation.value}));
moveMethod?.addEventListener('change',()=>persist({moveMethod:moveMethod.value}));
legal?.addEventListener('change',()=>persist({showLegalMoves:legal.checked}));
whiteBottom?.addEventListener('change',()=>persist({whiteAlwaysBottom:whiteBottom.checked}));
