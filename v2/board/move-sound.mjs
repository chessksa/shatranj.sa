/* Shatranj Arab Chess — shared move/capture/check audio.
   No external audio files, autoplay, analytics or background playback. */
const STORAGE_KEY='shatranj:sound-enabled';
let context=null;
let lastPlayedAt=-1;

export function boardSoundEnabled(){
  try{return window.localStorage.getItem(STORAGE_KEY)!=='0';}
  catch{return true;}
}
function audioContext(){
  if(context)return context;
  const AudioClass=window.AudioContext||window.webkitAudioContext;
  if(!AudioClass)return null;
  try{context=new AudioClass();}catch{return null;}
  return context;
}
function unlockSound(){
  if(!boardSoundEnabled())return;
  const ctx=audioContext();
  if(ctx?.state==='suspended')void ctx.resume().catch(()=>{});
}
// Audio on iOS/Safari requires a user gesture; unlock once from the first real interaction.
if(typeof document!=='undefined'){
  document.addEventListener('pointerdown',unlockSound,{passive:true});
  document.addEventListener('keydown',unlockSound);
}

function note(ctx,when,frequency,duration,volume,type='triangle'){
  const osc=ctx.createOscillator();
  const gain=ctx.createGain();
  osc.type=type;
  osc.frequency.setValueAtTime(frequency,when);
  osc.frequency.exponentialRampToValueAtTime(Math.max(80,frequency*.65),when+duration);
  gain.gain.setValueAtTime(.0001,when);
  gain.gain.exponentialRampToValueAtTime(volume,when+.004);
  gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when+duration+.005);
  osc.onended=()=>{osc.disconnect();gain.disconnect();};
}

export function playChessSound(kind='move'){
  if(!boardSoundEnabled())return false;
  const ctx=audioContext();
  if(!ctx||ctx.state!=='running')return false;
  const now=ctx.currentTime;
  if(now-lastPlayedAt<.045)return false;
  lastPlayedAt=now;
  try{
    if(kind==='check'){
      note(ctx,now,650,.070,.055,'sine');
      note(ctx,now+.077,930,.105,.052,'triangle');
    }else if(kind==='capture'){
      note(ctx,now,310,.070,.077,'triangle');
      note(ctx,now+.045,200,.095,.065,'sine');
    }else{
      note(ctx,now,410,.055,.059,'triangle');
      note(ctx,now+.030,560,.045,.027,'sine');
    }
    return true;
  }catch{return false;}
}

function positionOf(fen){
  const placement=String(fen||'').split(/\s+/)[0];
  const ranks=placement.split('/');
  if(ranks.length!==8)return null;
  const board=Array.from({length:8},()=>Array(8).fill(''));
  for(let r=0;r<8;r++){
    let c=0;
    for(const ch of ranks[r]){
      if(/[1-8]/.test(ch)){c+=Number(ch);continue;}
      if(!/[prnbqkPRNBQK]/.test(ch)||c>7)return null;
      board[r][c++]=ch;
    }
    if(c!==8)return null;
  }
  return board;
}
function pieces(board){
  return board.reduce((n,row)=>n+row.filter(Boolean).length,0);
}
function kingIsAttacked(afterFen,board){
  const turn=String(afterFen).split(/\s+/)[1];
  if(turn!=='w'&&turn!=='b')return false;
  const king=turn==='w'?'K':'k',other=turn==='w'?'b':'w';
  let kr=-1,kc=-1;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]===king){kr=r;kc=c;}
  if(kr<0)return false;
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const piece=board[r][c];
      if(!piece||(piece===piece.toUpperCase()?'w':'b')!==other)continue;
      const kind=piece.toLowerCase(),dr=kr-r,dc=kc-c,ar=Math.abs(dr),ac=Math.abs(dc);
      if(kind==='p'&&ar===1&&ac===1&&dr===(other==='w'?-1:1))return true;
      if(kind==='n'&&((ar===1&&ac===2)||(ar===2&&ac===1)))return true;
      if(kind==='k'&&Math.max(ar,ac)===1)return true;
      const diagonal=ar===ac&&ar!==0;
      const straight=(dr===0||dc===0)&&(ar+ac!==0);
      if(!((kind==='b'&&diagonal)||(kind==='r'&&straight)||(kind==='q'&&(diagonal||straight))))continue;
      const sr=Math.sign(dr),sc=Math.sign(dc);
      let blocked=false;
      for(let rr=r+sr,cc=c+sc;rr!==kr||cc!==kc;rr+=sr,cc+=sc){
        if(board[rr]?.[cc]){blocked=true;break;}
      }
      if(!blocked)return true;
    }
  }
  return false;
}

// Called after a confirmed move, never on selection, orientation change, or initial board load.
export function playBoardMoveSound(beforeFen,afterFen){
  const beforePlacement=String(beforeFen||'').split(/\s+/)[0];
  const afterPlacement=String(afterFen||'').split(/\s+/)[0];
  if(!beforePlacement||!afterPlacement||beforePlacement===afterPlacement)return false;
  if(!boardSoundEnabled())return false;
  const before=positionOf(beforeFen),after=positionOf(afterFen);
  if(!before||!after)return false;
  const kind=kingIsAttacked(afterFen,after)?'check':
    pieces(after)<pieces(before)?'capture':'move';
  return playChessSound(kind);
}
