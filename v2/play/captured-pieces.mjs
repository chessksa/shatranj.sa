/* Shared, passive captured-material display for play and spectators.
   Figures show missing starting pieces on the given side, never inventing a
   captured king or treating an extra promotion as a negative loss. */
const INITIAL={p:8,n:2,b:2,r:2,q:1};
const ORDER=['q','r','b','n','p'];
export function missingPiecesFromFen(fen,color){
  const placement=String(fen||'').trim().split(/\s+/)[0];
  const rows=placement.split('/');
  if(rows.length!==8||!['w','b'].includes(color))return [];
  const found={p:0,n:0,b:0,r:0,q:0};
  for(const row of rows){
    let width=0;
    for(const token of row){
      if(/[1-8]/.test(token)){width+=Number(token);continue;}
      if(!/[prnbqkPRNBQK]/.test(token))return [];
      width++;
      if((token===token.toUpperCase()?'w':'b')===color&&token.toLowerCase() in found)
        found[token.toLowerCase()]++;
    }
    if(width!==8)return [];
  }
  return ORDER.flatMap(type=>Array(Math.max(0,INITIAL[type]-found[type])).fill(type));
}
export function renderCapturedPieces(host,fen,color){
  if(!host||!['w','b'].includes(color))return;
  const missing=missingPiecesFromFen(fen,color);
  const key=color+':'+missing.join('');
  if(host.dataset.capturedKey===key)return;
  host.dataset.capturedKey=key;
  host.replaceChildren();
  host.classList.add('captured-pieces');
  host.setAttribute('aria-label','القطع المفقودة '+(color==='w'?'للأبيض':'للأسود'));
  if(!missing.length){host.textContent='—';return;}
  const fragment=document.createDocumentFragment();
  for(const type of missing){
    const image=document.createElement('img');
    image.src='assets/pieces/'+color+type+'.png';
    image.alt=({p:'بيدق',n:'حصان',b:'فيل',r:'قلعة',q:'وزير'})[type];
    image.title=image.alt;
    image.width=19;image.height=19;image.draggable=false;
    fragment.append(image);
  }
  host.append(fragment);
}
export function renderCapturedPair(whiteHost,blackHost,fen){
  renderCapturedPieces(whiteHost,fen,'w');
  renderCapturedPieces(blackHost,fen,'b');
}
